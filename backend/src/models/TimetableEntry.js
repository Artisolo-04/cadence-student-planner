const pool = require("../config/db");

class OverlapConflictError extends Error {
  constructor(conflicts) {
    super("Entry overlaps with existing timetable entries");
    this.name = "OverlapConflictError";
    this.status = 409;
    this.conflicts = conflicts;
  }
}

async function lockTimetableDay(client, timetableId, dayOfWeek) {
  await client.query(
    `SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))`,
    [`timetable:${timetableId}:day:${dayOfWeek}`]
  );
}

async function getSlotSortMap(client, timetableId) {
  const result = await client.query(
    `SELECT id, sort_order FROM timetable_slots WHERE timetable_id = $1`,
    [timetableId]
  );
  const idToSort = new Map();
  const sortToId = new Map();
  for (const row of result.rows) {
    idToSort.set(row.id, row.sort_order);
    sortToId.set(row.sort_order, row.id);
  }
  return { idToSort, sortToId };
}

function subtractRanges(start, end, consumed) {
  const remaining = [];
  let cursor = start;
  for (const r of consumed) {
    if (r.start > cursor) remaining.push({ start: cursor, end: r.start - 1 });
    cursor = Math.max(cursor, r.end + 1);
  }
  if (cursor <= end) remaining.push({ start: cursor, end });
  return remaining;
}

function coalesceFragmentSpecs(specs) {
  const groups = new Map();
  for (const spec of specs) {
    const key = `${spec.groupTag}\u0000${spec.subjectId}\u0000${spec.room ?? "\u0000NULL"}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(spec);
  }

  const merged = [];
  for (const group of groups.values()) {
    group.sort((a, b) => a.startSort - b.startSort);
    let current = null;
    for (const spec of group) {
      if (current && spec.startSort <= current.endSort + 1) {
        current.endSort = Math.max(current.endSort, spec.endSort);
      } else {
        if (current) merged.push(current);
        current = { ...spec };
      }
    }
    if (current) merged.push(current);
  }
  return merged;
}

async function coalesceWithExistingNeighbors(client, timetableId, dayOfWeek, excludeEntryId, specs) {
  const merged = coalesceFragmentSpecs(specs);
  const deletedIds = [];

  for (const spec of merged) {
    
    while (true) {
      const neighborResult = await client.query(
        `SELECT e.id, ss.sort_order AS start_sort, es.sort_order AS end_sort
         FROM timetable_entries e
         JOIN timetable_slots ss ON ss.id = e.slot_id
         JOIN timetable_slots es ON es.id = e.end_slot_id
         WHERE e.timetable_id = $1
           AND e.day_of_week = $2
           AND ($3::int IS NULL OR e.id != $3)
           AND e.group_tag = $4
           AND e.subject_id = $5
           AND e.room IS NOT DISTINCT FROM $6
           AND (es.sort_order = $7 OR ss.sort_order = $8)
         FOR UPDATE OF e
         LIMIT 1`,
        [
          timetableId, dayOfWeek, excludeEntryId,
          spec.groupTag, spec.subjectId, spec.room ?? null,
          spec.startSort - 1, spec.endSort + 1,
        ]
      );

      if (neighborResult.rows.length === 0) break;

      const neighbor = neighborResult.rows[0];
      await client.query(`DELETE FROM timetable_entries WHERE id = $1`, [neighbor.id]);
      deletedIds.push(neighbor.id);

      spec.startSort = Math.min(spec.startSort, neighbor.start_sort);
      spec.endSort = Math.max(spec.endSort, neighbor.end_sort);
    }
  }

  return { specs: merged, deletedIds };
}

async function resolveAndWrite(client, timetableId, slotMap, op, iStart, iEnd) {
  const excludeEntryId = op.kind === "update" ? op.entryId : null;

  const deletedIds = [];
  const fragmentSpecs = [];
  const mergeFragmentSpecs = [];

  if (op.groupTag === "g1" || op.groupTag === "g2") {
    const siblingTag = op.groupTag === "g1" ? "g2" : "g1";

    const siblingResult = await client.query(
      `SELECT e.id, e.subject_id, e.room,
              ss.sort_order AS start_sort, es.sort_order AS end_sort
       FROM timetable_entries e
       JOIN timetable_slots ss ON ss.id = e.slot_id
       JOIN timetable_slots es ON es.id = e.end_slot_id
       WHERE e.timetable_id = $1
         AND e.day_of_week = $2
         AND ($3::int IS NULL OR e.id != $3)
         AND e.group_tag = $4
         AND e.subject_id = $5
         AND ss.sort_order <= $7
         AND es.sort_order >= $6
       FOR UPDATE OF e`,
      [timetableId, op.dayOfWeek, excludeEntryId, siblingTag, op.subjectId, iStart, iEnd]
    );

    for (const c of siblingResult.rows) {
      const overlapStart = Math.max(c.start_sort, iStart);
      const overlapEnd = Math.min(c.end_sort, iEnd);
      const sameRoom = (c.room ?? null) === (op.room ?? null);

      const siblingFragments = [];
      if (c.start_sort < overlapStart) {
        siblingFragments.push({
          subjectId: c.subject_id, groupTag: siblingTag, room: c.room,
          startSort: c.start_sort, endSort: overlapStart - 1,
        });
      }
      if (c.end_sort > overlapEnd) {
        siblingFragments.push({
          subjectId: c.subject_id, groupTag: siblingTag, room: c.room,
          startSort: overlapEnd + 1, endSort: c.end_sort,
        });
      }

      let producesMerge = false;
      if (sameRoom) {
        producesMerge = true;
        mergeFragmentSpecs.push({
          subjectId: op.subjectId, groupTag: "all", room: op.room ?? c.room,
          startSort: overlapStart, endSort: overlapEnd,
        });
      } else {
        siblingFragments.push({
          subjectId: c.subject_id, groupTag: siblingTag, room: c.room,
          startSort: overlapStart, endSort: overlapEnd,
        });
      }

      if (!producesMerge) {
        const coalesced = coalesceFragmentSpecs(siblingFragments);
        const isNoOp =
          coalesced.length === 1 &&
          coalesced[0].startSort === c.start_sort &&
          coalesced[0].endSort === c.end_sort &&
          coalesced[0].groupTag === siblingTag &&
          coalesced[0].subjectId === c.subject_id &&
          (coalesced[0].room ?? null) === (c.room ?? null);

        if (isNoOp) {
          continue;
        }
      }

      await client.query(`DELETE FROM timetable_entries WHERE id = $1`, [c.id]);
      deletedIds.push(c.id);
      fragmentSpecs.push(...siblingFragments);
    }
  }

  const mergeCreatedEntries = [];
  const { specs: mergedMergeSpecs, deletedIds: neighborDeletedIdsForMerge } =
    await coalesceWithExistingNeighbors(client, timetableId, op.dayOfWeek, excludeEntryId, mergeFragmentSpecs);
  deletedIds.push(...neighborDeletedIdsForMerge);
  for (const f of mergedMergeSpecs) {
    const fragStartSlotId = slotMap.sortToId.get(f.startSort);
    const fragEndSlotId = slotMap.sortToId.get(f.endSort);
    if (fragStartSlotId == null || fragEndSlotId == null) continue;
    const r = await client.query(
      `INSERT INTO timetable_entries (timetable_id, slot_id, end_slot_id, day_of_week, subject_id, group_tag, room)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, timetable_id, slot_id AS start_slot_id, end_slot_id, day_of_week, subject_id, group_tag, room, created_at, updated_at`,
      [timetableId, fragStartSlotId, fragEndSlotId, op.dayOfWeek, f.subjectId, f.groupTag, f.room]
    );
    mergeCreatedEntries.push({ startSort: f.startSort, endSort: f.endSort, entry: r.rows[0] });
  }

  const mergeCreatedIds = mergeCreatedEntries.map((m) => m.entry.id);

  const conflictsResult = await client.query(
    `SELECT e.id, e.subject_id, e.group_tag, e.room,
            ss.sort_order AS start_sort, es.sort_order AS end_sort
     FROM timetable_entries e
     JOIN timetable_slots ss ON ss.id = e.slot_id
     JOIN timetable_slots es ON es.id = e.end_slot_id
     WHERE e.timetable_id = $1
       AND e.day_of_week = $2
       AND ($3::int IS NULL OR e.id != $3)
       AND (e.group_tag = 'all' OR $4 = 'all' OR e.group_tag = $4)
       AND ss.sort_order <= $6
       AND es.sort_order >= $5
       AND NOT (e.id = ANY($7::int[]))
     FOR UPDATE OF e`,
    [timetableId, op.dayOfWeek, excludeEntryId, op.groupTag, iStart, iEnd, mergeCreatedIds]
  );

  for (const c of conflictsResult.rows) {
    const overlapStart = Math.max(c.start_sort, iStart);
    const overlapEnd = Math.min(c.end_sort, iEnd);

    if (c.start_sort < overlapStart) {
      fragmentSpecs.push({
        subjectId: c.subject_id, groupTag: c.group_tag, room: c.room,
        startSort: c.start_sort, endSort: overlapStart - 1,
      });
    }
    if (c.end_sort > overlapEnd) {
      fragmentSpecs.push({
        subjectId: c.subject_id, groupTag: c.group_tag, room: c.room,
        startSort: overlapEnd + 1, endSort: c.end_sort,
      });
    }
    if (c.group_tag === "all" && op.groupTag !== "all") {
      const siblingTag = op.groupTag === "g1" ? "g2" : "g1";
      fragmentSpecs.push({
        subjectId: c.subject_id, groupTag: siblingTag, room: c.room,
        startSort: overlapStart, endSort: overlapEnd,
      });
    }

    await client.query(`DELETE FROM timetable_entries WHERE id = $1`, [c.id]);
    deletedIds.push(c.id);
  }

  const createdFragments = [];
  const { specs: mergedFragmentSpecs, deletedIds: neighborDeletedIds } =
    await coalesceWithExistingNeighbors(client, timetableId, op.dayOfWeek, excludeEntryId, fragmentSpecs);
  deletedIds.push(...neighborDeletedIds);
  for (const f of mergedFragmentSpecs) {
    const fragStartSlotId = slotMap.sortToId.get(f.startSort);
    const fragEndSlotId = slotMap.sortToId.get(f.endSort);
    if (fragStartSlotId == null || fragEndSlotId == null) continue;
    const r = await client.query(
      `INSERT INTO timetable_entries (timetable_id, slot_id, end_slot_id, day_of_week, subject_id, group_tag, room)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, timetable_id, slot_id AS start_slot_id, end_slot_id, day_of_week, subject_id, group_tag, room, created_at, updated_at`,
      [timetableId, fragStartSlotId, fragEndSlotId, op.dayOfWeek, f.subjectId, f.groupTag, f.room]
    );
    createdFragments.push(r.rows[0]);
  }
  createdFragments.push(...mergeCreatedEntries.map((m) => m.entry));

  const remainingRanges = subtractRanges(
    iStart, iEnd,
    mergeCreatedEntries.map((m) => ({ start: m.startSort, end: m.endSort })).sort((a, b) => a.start - b.start)
  );

  let mainEntry = null;
  const extraMainFragments = [];

  if (remainingRanges.length === 0) {
    if (op.kind === "update") {
      const del = await client.query(
        `DELETE FROM timetable_entries WHERE timetable_id = $1 AND id = $2 RETURNING id`,
        [timetableId, op.entryId]
      );
      if (del.rows.length === 0) throw new Error("Entry not found");
      deletedIds.push(op.entryId);
    }
    mainEntry = mergeCreatedEntries[0]?.entry ?? null;
  } else {
    for (let i = 0; i < remainingRanges.length; i++) {
      const { start, end } = remainingRanges[i];
      const startSlotId = slotMap.sortToId.get(start);
      const endSlotId = slotMap.sortToId.get(end);
      if (startSlotId == null || endSlotId == null) continue;

      if (i === 0 && op.kind === "update") {
        const result = await client.query(
          `UPDATE timetable_entries
           SET slot_id = $3, end_slot_id = $4, day_of_week = $5,
               subject_id = $6, group_tag = $7, room = $8, updated_at = NOW()
           WHERE timetable_id = $1 AND id = $2
           RETURNING id, timetable_id, slot_id AS start_slot_id, end_slot_id, day_of_week, subject_id, group_tag, room, created_at, updated_at`,
          [timetableId, op.entryId, startSlotId, endSlotId, op.dayOfWeek, op.subjectId, op.groupTag, op.room]
        );
        if (result.rows.length === 0) throw new Error("Entry not found");
        mainEntry = result.rows[0];
      } else {
        const result = await client.query(
          `INSERT INTO timetable_entries (timetable_id, slot_id, end_slot_id, day_of_week, subject_id, group_tag, room)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, timetable_id, slot_id AS start_slot_id, end_slot_id, day_of_week, subject_id, group_tag, room, created_at, updated_at`,
          [timetableId, startSlotId, endSlotId, op.dayOfWeek, op.subjectId, op.groupTag, op.room]
        );
        if (i === 0) {
          mainEntry = result.rows[0];
        } else {
          extraMainFragments.push(result.rows[0]);
        }
      }
    }
  }

  const postWriteDeletedIds = new Set();

  async function coalesceWrittenEntry(entry) {
    if (!entry || postWriteDeletedIds.has(entry.id)) return null;

    const startSort = slotMap.idToSort.get(entry.start_slot_id);
    const endSort = slotMap.idToSort.get(entry.end_slot_id);
    if (startSort == null || endSort == null) return entry;

    const { specs, deletedIds: adjacencyDeletedIds } =
      await coalesceWithExistingNeighbors(
        client,
        timetableId,
        op.dayOfWeek,
        entry.id,
        [{
          subjectId: entry.subject_id,
          groupTag: entry.group_tag,
          room: entry.room,
          startSort,
          endSort,
        }]
      );

    deletedIds.push(...adjacencyDeletedIds);
    adjacencyDeletedIds.forEach((id) => postWriteDeletedIds.add(id));

    const merged = specs[0];
    if (
      !merged ||
      (merged.startSort === startSort && merged.endSort === endSort)
    ) {
      return entry;
    }

    const result = await client.query(
      `UPDATE timetable_entries
       SET slot_id = $3, end_slot_id = $4, updated_at = NOW()
       WHERE timetable_id = $1 AND id = $2
       RETURNING id, timetable_id, slot_id AS start_slot_id, end_slot_id,
                 day_of_week, subject_id, group_tag, room, created_at, updated_at`,
      [
        timetableId,
        entry.id,
        slotMap.sortToId.get(merged.startSort),
        slotMap.sortToId.get(merged.endSort),
      ]
    );

    return result.rows[0] ?? entry;
  }

  mainEntry = await coalesceWrittenEntry(mainEntry);

  for (let index = 0; index < createdFragments.length; index += 1) {
    createdFragments[index] = await coalesceWrittenEntry(
      createdFragments[index]
    );
  }

  for (let index = 0; index < extraMainFragments.length; index += 1) {
    extraMainFragments[index] = await coalesceWrittenEntry(
      extraMainFragments[index]
    );
  }

  const allFragments = [...createdFragments, ...extraMainFragments].filter(Boolean);
  const dedupedFragments = mainEntry
    ? allFragments.filter((f) => f.id !== mainEntry.id)
    : allFragments;

  return {
    mainEntry,
    deletedIds,
    createdFragments: dedupedFragments,
  };
}

async function createEntry(
  timetableId,
  { slotId, endSlotId = slotId, dayOfWeek, subjectId, groupTag = "all", room = null }
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET CONSTRAINTS timetable_entries_unique_span DEFERRED");
    await lockTimetableDay(client, timetableId, dayOfWeek);

    const slotMap = await getSlotSortMap(client, timetableId);
    const iStart = slotMap.idToSort.get(slotId);
    const iEnd = slotMap.idToSort.get(endSlotId);
    if (iStart == null || iEnd == null) {
      throw new Error("Invalid slot range: slot not found in this timetable");
    }
    if (iEnd < iStart) {
      throw new Error("end_slot_id must not end before start_slot_id begins");
    }

    const resolveResult = await resolveAndWrite(
      client, timetableId, slotMap,
      { kind: "create", slotId, endSlotId, dayOfWeek, subjectId, groupTag, room },
      iStart, iEnd
    );

    await client.query("COMMIT");
    return resolveResult;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function updateEntry(
  timetableId,
  entryId,
  { slotId, endSlotId = slotId, dayOfWeek, subjectId, groupTag = "all", room = null }
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET CONSTRAINTS timetable_entries_unique_span DEFERRED");
    await lockTimetableDay(client, timetableId, dayOfWeek);

    const slotMap = await getSlotSortMap(client, timetableId);
    const iStart = slotMap.idToSort.get(slotId);
    const iEnd = slotMap.idToSort.get(endSlotId);
    if (iStart == null || iEnd == null) {
      throw new Error("Invalid slot range: slot not found in this timetable");
    }
    if (iEnd < iStart) {
      throw new Error("end_slot_id must not end before start_slot_id begins");
    }

    const resolveResult = await resolveAndWrite(
      client, timetableId, slotMap,
      { kind: "update", entryId, slotId, endSlotId, dayOfWeek, subjectId, groupTag, room },
      iStart, iEnd
    );

    await client.query("COMMIT");
    return resolveResult;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function findEntriesByTimetableId(timetableId) {
  const result = await pool.query(
    `SELECT e.id, e.slot_id AS start_slot_id, e.end_slot_id, e.day_of_week,
            e.subject_id, e.group_tag, e.room,
            s.name AS subject_name, s.color AS subject_color, s.teacher AS subject_teacher
     FROM timetable_entries e
     JOIN subjects s ON s.id = e.subject_id
     WHERE e.timetable_id = $1`,
    [timetableId]
  );
  return result.rows;
}

async function deleteEntry(timetableId, entryId) {
  const result = await pool.query(
    `DELETE FROM timetable_entries WHERE timetable_id = $1 AND id = $2 RETURNING id`,
    [timetableId, entryId]
  );
  return result.rows[0];
}

async function applyBatch(timetableId, operations) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET CONSTRAINTS timetable_entries_unique_span DEFERRED");

    const touchedIds = [
      ...new Set(
        operations.filter((o) => o.op !== "create").map((o) => o.entryId)
      ),
    ];

    let existingRows = [];
    if (touchedIds.length > 0) {
      const r = await client.query(
        `SELECT id, day_of_week FROM timetable_entries
         WHERE timetable_id = $1 AND id = ANY($2::int[])
         FOR UPDATE`,
        [timetableId, touchedIds]
      );
      existingRows = r.rows;
      if (existingRows.length !== touchedIds.length) {
        const foundIds = new Set(existingRows.map((r) => r.id));
        const missing = touchedIds.filter((id) => !foundIds.has(id));
        throw new Error(`Entry not found: ${missing.join(", ")}`);
      }
    }

    const affectedDays = new Set(existingRows.map((r) => r.day_of_week));
    operations.forEach((o) => {
      if (o.op !== "delete" && o.dayOfWeek != null) affectedDays.add(o.dayOfWeek);
    });

    for (const day of [...affectedDays].sort((a, b) => a - b)) {
      await lockTimetableDay(client, timetableId, day);
    }

    const slotMap = await getSlotSortMap(client, timetableId);

    const created = [];
    const updated = [];
    const deletedIds = [];

    for (const op of operations) {
      if (op.op === "delete") {
        const result = await client.query(
          `DELETE FROM timetable_entries WHERE timetable_id = $1 AND id = $2 RETURNING id`,
          [timetableId, op.entryId]
        );
        if (result.rows.length === 0) {
          throw new Error(`Entry not found: ${op.entryId}`);
        }
        deletedIds.push(op.entryId);
      } else if (op.op === "update" || op.op === "create") {
        const endSlotId = op.endSlotId ?? op.slotId;
        const iStart = slotMap.idToSort.get(op.slotId);
        const iEnd = slotMap.idToSort.get(endSlotId);
        if (iStart == null || iEnd == null) {
          throw new Error(
            `Invalid slot range for ${op.op === "create" ? `tempId=${op.tempId}` : `entry ${op.entryId}`}`
          );
        }
        if (iEnd < iStart) {
          throw new Error(
            `end_slot_id must not end before start_slot_id (${op.op === "create" ? `tempId=${op.tempId}` : `entry ${op.entryId}`})`
          );
        }

        const { mainEntry, deletedIds: fragDeleted, createdFragments } = await resolveAndWrite(
          client, timetableId, slotMap,
          {
            kind: op.op,
            entryId: op.entryId,
            slotId: op.slotId,
            endSlotId,
            dayOfWeek: op.dayOfWeek,
            subjectId: op.subjectId,
            groupTag: op.groupTag ?? "all",
            room: op.room ?? null,
          },
          iStart, iEnd
        );

        deletedIds.push(...fragDeleted);
        createdFragments.forEach((f) => created.push({ tempId: null, entry: f }));

        if (op.op === "create") {
          created.push({ tempId: op.tempId, entry: mainEntry });
        } else if (mainEntry) {
          updated.push(mainEntry);
        }
      } else {
        throw new Error(`Unknown operation type: ${op.op}`);
      }
    }

    const returnedEntryIds = [
      ...created.map(({ entry }) => entry?.id),
      ...updated.map((entry) => entry?.id),
    ].filter((id) => id != null);

    const hydratedById = new Map();
    if (returnedEntryIds.length > 0) {
      const hydratedResult = await client.query(
        `SELECT e.id, e.slot_id AS start_slot_id, e.end_slot_id, e.day_of_week,
                e.subject_id, e.group_tag, e.room,
                s.name AS subject_name, s.color AS subject_color,
                s.teacher AS subject_teacher
         FROM timetable_entries e
         JOIN subjects s ON s.id = e.subject_id
         WHERE e.timetable_id = $1
           AND e.id = ANY($2::int[])`,
        [timetableId, [...new Set(returnedEntryIds)]]
      );

      for (const entry of hydratedResult.rows) {
        hydratedById.set(entry.id, entry);
      }
    }

    const hydratedCreated = created
      .map((item) => {
        const entry = hydratedById.get(item.entry?.id);
        return entry ? { ...item, entry } : null;
      })
      .filter(Boolean);

    const hydratedUpdated = updated
      .map((entry) => hydratedById.get(entry.id))
      .filter(Boolean);

    await client.query("COMMIT");
    return {
      created: hydratedCreated,
      updated: hydratedUpdated,
      deletedIds,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  createEntry,
  updateEntry,
  findEntriesByTimetableId,
  deleteEntry,
  applyBatch,
  OverlapConflictError,
};
