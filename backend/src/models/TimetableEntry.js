const pool = require("../config/db");

async function clearConflictingGroupEntries(timetableId, { slotId, dayOfWeek, groupTag }) {
  const conflictTags = groupTag === "all" ? ["g1", "g2"] : ["all"];
  await pool.query(
    `DELETE FROM timetable_entries
     WHERE timetable_id = $1 AND slot_id = $2 AND day_of_week = $3 AND group_tag = ANY($4)`,
    [timetableId, slotId, dayOfWeek, conflictTags]
  );
}

async function upsertEntry(
  timetableId,
  { slotId, dayOfWeek, subjectId, groupTag = "all", room = null }
) {
  await clearConflictingGroupEntries(timetableId, { slotId, dayOfWeek, groupTag });

  const result = await pool.query(
    `INSERT INTO timetable_entries (timetable_id, slot_id, day_of_week, subject_id, group_tag, room)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (timetable_id, slot_id, day_of_week, group_tag)
     DO UPDATE SET subject_id = $4, room = $6, updated_at = NOW()
     RETURNING id, timetable_id, slot_id, day_of_week, subject_id, group_tag, room, created_at, updated_at`,
    [timetableId, slotId, dayOfWeek, subjectId, groupTag, room]
  );
  return result.rows[0];
}

async function findEntriesByTimetableId(timetableId) {
  const result = await pool.query(
    `SELECT e.id, e.slot_id, e.day_of_week, e.subject_id, e.group_tag, e.room,
            s.name AS subject_name, s.color AS subject_color, s.teacher AS subject_teacher
     FROM timetable_entries e
     JOIN subjects s ON s.id = e.subject_id
     WHERE e.timetable_id = $1`,
    [timetableId]
  );
  return result.rows;
}

async function deleteEntry(timetableId, { slotId, dayOfWeek, groupTag = "all" }) {
  const result = await pool.query(
    `DELETE FROM timetable_entries
     WHERE timetable_id = $1 AND slot_id = $2 AND day_of_week = $3 AND group_tag = $4
     RETURNING id`,
    [timetableId, slotId, dayOfWeek, groupTag]
  );
  return result.rows[0];
}

module.exports = {
  upsertEntry,
  findEntriesByTimetableId,
  deleteEntry,
};
