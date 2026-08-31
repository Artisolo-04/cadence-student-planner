const { coalesceWithExistingNeighbors } = require("./sqlHelpers");
const { subtractRanges } = require("./intervalMath");

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

module.exports = { resolveAndWrite };
