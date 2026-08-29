const pool = require("../config/db");

class OverlapConflictError extends Error {
  constructor(conflicts) {
    super("Entry overlaps with existing timetable entries");
    this.name = "OverlapConflictError";
    this.status = 409;
    this.conflicts = conflicts;
  }
}

async function getSlotTimeRange(client, timetableId, slotId, endSlotId) {
  const result = await client.query(
    `SELECT id, start_time, end_time FROM timetable_slots
     WHERE timetable_id = $1 AND id = ANY($2::int[])`,
    [timetableId, [slotId, endSlotId]]
  );
  const byId = Object.fromEntries(result.rows.map((r) => [r.id, r]));
  const startSlot = byId[slotId];
  const endSlot = byId[endSlotId];
  if (!startSlot || !endSlot) return null;
  return { startTime: startSlot.start_time, endTime: endSlot.end_time };
}

async function findOverlaps(client, {
  timetableId, dayOfWeek, groupTag, startTime, endTime, excludeEntryId = null,
}) {
  const result = await client.query(
    `SELECT e.id, e.subject_id, e.group_tag, s.name AS subject_name,
            ss.start_time AS existing_start, es.end_time AS existing_end
     FROM timetable_entries e
     JOIN timetable_slots ss ON ss.id = e.slot_id
     JOIN timetable_slots es ON es.id = e.end_slot_id
     JOIN subjects s ON s.id = e.subject_id
     WHERE e.timetable_id = $1
       AND e.day_of_week = $2
       AND ($3::int IS NULL OR e.id != $3)
       AND (e.group_tag = 'all' OR $4 = 'all' OR e.group_tag = $4)
       AND ss.start_time < $6
       AND es.end_time > $5`,
    [timetableId, dayOfWeek, excludeEntryId, groupTag, startTime, endTime]
  );
  return result.rows;
}

async function findFinalOverlaps(client, timetableId, days) {
  if (days.length === 0) return [];
  const result = await client.query(
    `WITH ranges AS (
       SELECT e.id, e.day_of_week, e.group_tag,
              ss.start_time, es.end_time,
              s.name AS subject_name
       FROM timetable_entries e
       JOIN timetable_slots ss ON ss.id = e.slot_id
       JOIN timetable_slots es ON es.id = e.end_slot_id
       JOIN subjects s ON s.id = e.subject_id
       WHERE e.timetable_id = $1 AND e.day_of_week = ANY($2::int[])
     )
     SELECT
       a.id AS entry_a_id, a.subject_name AS entry_a_subject,
       a.start_time AS a_start, a.end_time AS a_end,
       b.id AS entry_b_id, b.subject_name AS entry_b_subject,
       b.start_time AS b_start, b.end_time AS b_end,
       a.day_of_week
     FROM ranges a
     JOIN ranges b
       ON a.day_of_week = b.day_of_week
      AND a.id < b.id
      AND (a.group_tag = 'all' OR b.group_tag = 'all' OR a.group_tag = b.group_tag)
      AND a.start_time < b.end_time
      AND b.start_time < a.end_time`,
    [timetableId, days]
  );
  return result.rows;
}

async function lockTimetableDay(client, timetableId, dayOfWeek) {
  await client.query(
    `SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))`,
    [`timetable:${timetableId}:day:${dayOfWeek}`]
  );
}

async function validateAndCheckConflicts(client, timetableId, { slotId, endSlotId, dayOfWeek, groupTag, excludeEntryId }) {
  const range = await getSlotTimeRange(client, timetableId, slotId, endSlotId);
  if (!range) {
    throw new Error("Invalid slot range: slot not found in this timetable");
  }
  const { startTime, endTime } = range;
  if (endTime <= startTime) {
    throw new Error("end_slot_id must not end before start_slot_id begins");
  }

  await lockTimetableDay(client, timetableId, dayOfWeek);

  const conflicts = await findOverlaps(client, {
    timetableId, dayOfWeek, groupTag, startTime, endTime, excludeEntryId,
  });
  if (conflicts.length > 0) {
    throw new OverlapConflictError(conflicts);
  }
}

async function createEntry(
  timetableId,
  { slotId, endSlotId = slotId, dayOfWeek, subjectId, groupTag = "all", room = null }
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await validateAndCheckConflicts(client, timetableId, { slotId, endSlotId, dayOfWeek, groupTag, excludeEntryId: null });

    const result = await client.query(
      `INSERT INTO timetable_entries (timetable_id, slot_id, end_slot_id, day_of_week, subject_id, group_tag, room)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, timetable_id, slot_id AS start_slot_id, end_slot_id, day_of_week, subject_id, group_tag, room, created_at, updated_at`,
      [timetableId, slotId, endSlotId, dayOfWeek, subjectId, groupTag, room]
    );

    await client.query("COMMIT");
    return result.rows[0];
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
    await validateAndCheckConflicts(client, timetableId, { slotId, endSlotId, dayOfWeek, groupTag, excludeEntryId: entryId });

    const result = await client.query(
      `UPDATE timetable_entries
       SET slot_id = $3, end_slot_id = $4, day_of_week = $5,
           subject_id = $6, group_tag = $7, room = $8, updated_at = NOW()
       WHERE timetable_id = $1 AND id = $2
       RETURNING id, timetable_id, slot_id AS start_slot_id, end_slot_id, day_of_week, subject_id, group_tag, room, created_at, updated_at`,
      [timetableId, entryId, slotId, endSlotId, dayOfWeek, subjectId, groupTag, room]
    );

    if (result.rows.length === 0) {
      throw new Error("Entry not found");
    }

    await client.query("COMMIT");
    return result.rows[0];
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

/**
 * Apply a batch of create/update/delete operations to timetable_entries
 * atomically. Overlap validation happens ONCE, against the final state,
 * after all raw mutations are applied — not per-operation — so
 * swaps/resizes/multi-entry cleanups never see false-positive conflicts
 * against their own transaction's intermediate state.
 */
async function applyBatch(timetableId, operations) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "SET CONSTRAINTS timetable_entries_unique_span DEFERRED"
    );

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
        const range = await getSlotTimeRange(client, timetableId, op.slotId, endSlotId);
        if (!range) {
          throw new Error(
            `Invalid slot range for ${op.op === "create" ? `tempId=${op.tempId}` : `entry ${op.entryId}`}`
          );
        }
        if (range.endTime <= range.startTime) {
          throw new Error(
            `end_slot_id must not end before start_slot_id (${op.op === "create" ? `tempId=${op.tempId}` : `entry ${op.entryId}`})`
          );
        }

        if (op.op === "create") {
          const result = await client.query(
            `INSERT INTO timetable_entries
               (timetable_id, slot_id, end_slot_id, day_of_week, subject_id, group_tag, room)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, timetable_id, slot_id AS start_slot_id, end_slot_id,
                       day_of_week, subject_id, group_tag, room, created_at, updated_at`,
            [timetableId, op.slotId, endSlotId, op.dayOfWeek, op.subjectId, op.groupTag ?? "all", op.room ?? null]
          );
          created.push({ tempId: op.tempId, entry: result.rows[0] });
        } else {
          const result = await client.query(
            `UPDATE timetable_entries
             SET slot_id = $3, end_slot_id = $4, day_of_week = $5,
                 subject_id = $6, group_tag = $7, room = $8, updated_at = NOW()
             WHERE timetable_id = $1 AND id = $2
             RETURNING id, timetable_id, slot_id AS start_slot_id, end_slot_id,
                       day_of_week, subject_id, group_tag, room, created_at, updated_at`,
            [timetableId, op.entryId, op.slotId, endSlotId, op.dayOfWeek, op.subjectId, op.groupTag ?? "all", op.room ?? null]
          );
          if (result.rows.length === 0) {
            throw new Error(`Entry not found: ${op.entryId}`);
          }
          updated.push(result.rows[0]);
        }
      } else {
        throw new Error(`Unknown operation type: ${op.op}`);
      }
    }

    const conflicts = await findFinalOverlaps(client, timetableId, [...affectedDays]);
    if (conflicts.length > 0) {
      throw new OverlapConflictError(conflicts);
    }

    await client.query("COMMIT");
    return { created, updated, deletedIds };
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
