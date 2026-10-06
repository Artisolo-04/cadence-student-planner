const pool = require("../config/db");
const { OverlapConflictError } = require("./timetableEntry/errors");
const { resolveAndWrite } = require("./timetableEntry/resolveAndWrite");
const { lockTimetableDay, getSlotSortMap } = require("./timetableEntry/sqlHelpers");

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
    const skipped = [];

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

        const resolved = await resolveAndWrite(
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

        if (resolved.skipped) {
          skipped.push({
            op: op.op,
            tempId: op.tempId ?? null,
            entryId: op.entryId ?? null,
            reason: resolved.reason,
            coveredBy: resolved.coveredBy,
          });
          continue;
        }
        const { mainEntry, deletedIds: fragDeleted, createdFragments } = resolved;

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
      skipped,
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
