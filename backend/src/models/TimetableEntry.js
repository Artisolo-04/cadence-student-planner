const pool = require("../config/db");

class OverlapConflictError extends Error {
  constructor(conflicts) {
    super("Entry overlaps with existing timetable entries");
    this.name = "OverlapConflictError";
    this.status = 409;
    this.conflicts = conflicts;
  }
}

async function getSlotSortOrders(client, timetableId, slotId, endSlotId) {
  const result = await client.query(
    `SELECT id, sort_order FROM timetable_slots
     WHERE timetable_id = $1 AND id = ANY($2::int[])`,
    [timetableId, [slotId, endSlotId]]
  );
  const bySlot = Object.fromEntries(result.rows.map((r) => [r.id, r.sort_order]));
  return { startOrder: bySlot[slotId], endOrder: bySlot[endSlotId] };
}

async function findOverlaps(client, {
  timetableId, dayOfWeek, groupTag, startOrder, endOrder, excludeEntryId = null,
}) {
  const result = await client.query(
    `SELECT e.id, e.subject_id, e.group_tag, s.name AS subject_name,
            ss.sort_order AS existing_start, es.sort_order AS existing_end
     FROM timetable_entries e
     JOIN timetable_slots ss ON ss.id = e.slot_id
     JOIN timetable_slots es ON es.id = e.end_slot_id
     JOIN subjects s ON s.id = e.subject_id
     WHERE e.timetable_id = $1
       AND e.day_of_week = $2
       AND ($3::int IS NULL OR e.id != $3)
       AND (e.group_tag = 'all' OR $4 = 'all' OR e.group_tag = $4)
       AND ss.sort_order <= $6
       AND es.sort_order >= $5`,
    [timetableId, dayOfWeek, excludeEntryId, groupTag, startOrder, endOrder]
  );
  return result.rows;
}

async function validateAndCheckConflicts(client, timetableId, { slotId, endSlotId, dayOfWeek, groupTag, excludeEntryId }) {
  const { startOrder, endOrder } = await getSlotSortOrders(client, timetableId, slotId, endSlotId);
  if (startOrder === undefined || endOrder === undefined) {
    throw new Error("Invalid slot range: slot not found in this timetable");
  }
  if (endOrder < startOrder) {
    throw new Error("end_slot_id must not come before start_slot_id");
  }
  const conflicts = await findOverlaps(client, {
    timetableId, dayOfWeek, groupTag, startOrder, endOrder, excludeEntryId,
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
       RETURNING id, timetable_id, slot_id, end_slot_id, day_of_week, subject_id, group_tag, room, created_at, updated_at`,
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
       RETURNING id, timetable_id, slot_id, end_slot_id, day_of_week, subject_id, group_tag, room, created_at, updated_at`,
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

module.exports = {
  createEntry,
  updateEntry,
  findEntriesByTimetableId,
  deleteEntry,
  OverlapConflictError,
};
