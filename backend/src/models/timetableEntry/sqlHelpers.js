const { coalesceFragmentSpecs } = require("./intervalMath");

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

module.exports = { lockTimetableDay, getSlotSortMap, coalesceWithExistingNeighbors };
