const pool = require("../../config/db");

const ENTRY_MINUTES_QUERY = `
  WITH entry_spans AS (
    SELECT
      e.id,
      e.day_of_week,
      e.group_tag,
      e.subject_id,
      s.name AS subject_name,
      s.teacher AS subject_teacher,
      ss.sort_order AS start_sort,
      es.sort_order AS end_sort
    FROM timetable_entries e
    JOIN subjects s ON s.id = e.subject_id
    JOIN timetable_slots ss ON ss.id = e.slot_id
    JOIN timetable_slots es ON es.id = e.end_slot_id
    WHERE e.timetable_id = $1
  )
  SELECT
    es.id, es.day_of_week, es.group_tag, es.subject_id,
    es.subject_name, es.subject_teacher, es.start_sort, es.end_sort,
    COALESCE(SUM(EXTRACT(EPOCH FROM (sl.end_time - sl.start_time)) / 60), 0) AS minutes
  FROM entry_spans es
  JOIN timetable_slots sl
    ON sl.timetable_id = $1
   AND sl.sort_order BETWEEN es.start_sort AND es.end_sort
  GROUP BY es.id, es.day_of_week, es.group_tag, es.subject_id,
           es.subject_name, es.subject_teacher, es.start_sort, es.end_sort
`;

const ALL_SLOTS_QUERY = `
  SELECT sort_order, EXTRACT(EPOCH FROM (end_time - start_time)) / 60 AS minutes
  FROM timetable_slots
  WHERE timetable_id = $1
  ORDER BY sort_order
`;

const round1 = (n) => Math.round(n * 10) / 10;

function dayHasOverlap(entries) {
  const sorted = [...entries].sort((a, b) => a.start_sort - b.start_sort);
  let maxEndSoFar = -Infinity;
  for (const e of sorted) {
    if (e.start_sort <= maxEndSoFar) return true;
    maxEndSoFar = Math.max(maxEndSoFar, e.end_sort);
  }
  return false;
}

async function computeAnalytics(timetableId, myGroup) {
  const [entriesResult, slotsResult] = await Promise.all([
    pool.query(ENTRY_MINUTES_QUERY, [timetableId]),
    pool.query(ALL_SLOTS_QUERY, [timetableId]),
  ]);

  const allEntries = entriesResult.rows;
  const slots = slotsResult.rows;

  const effectiveEntries = myGroup == null
    ? allEntries
    : allEntries.filter((e) => e.group_tag === "all" || e.group_tag === myGroup);

  const facultyMap = new Map();
  for (const e of effectiveEntries) {
    const teacher = e.subject_teacher?.trim();
    if (!teacher) continue;
    if (!facultyMap.has(teacher)) {
      facultyMap.set(teacher, { teacher, subjectIds: new Set(), minutes: 0 });
    }
    const f = facultyMap.get(teacher);
    f.subjectIds.add(e.subject_id);
    f.minutes += Number(e.minutes);
  }
  const facultyAllocation = [...facultyMap.values()]
    .map((f) => ({
      teacher: f.teacher,
      subjectCount: f.subjectIds.size,
      weeklyHours: round1(f.minutes / 60),
    }))
    .sort((a, b) => b.weeklyHours - a.weeklyHours);

  const subjectMap = new Map();
  for (const e of effectiveEntries) {
    if (!subjectMap.has(e.subject_id)) {
      subjectMap.set(e.subject_id, { subjectId: e.subject_id, name: e.subject_name, minutes: 0 });
    }
    subjectMap.get(e.subject_id).minutes += Number(e.minutes);
  }
  const totalEffectiveMinutes = effectiveEntries.reduce((sum, e) => sum + Number(e.minutes), 0);
  const subjectDurationRatios = [...subjectMap.values()]
    .map((s) => ({
      subjectId: s.subjectId,
      name: s.name,
      weeklyHours: round1(s.minutes / 60),
      percentOfWeek: totalEffectiveMinutes > 0 ? round1((s.minutes / totalEffectiveMinutes) * 100) : 0,
    }))
    .sort((a, b) => b.weeklyHours - a.weeklyHours);

  const totalEntryCount = allEntries.length;
  const splitEntries = allEntries.filter((e) => e.group_tag !== "all");
  const totalAllMinutes = allEntries.reduce((sum, e) => sum + Number(e.minutes), 0);
  const splitMinutes = splitEntries.reduce((sum, e) => sum + Number(e.minutes), 0);
  const trackFracture = {
    fullWidthPercent: totalEntryCount > 0
      ? round1(((totalEntryCount - splitEntries.length) / totalEntryCount) * 100) : 0,
    splitPercent: totalEntryCount > 0
      ? round1((splitEntries.length / totalEntryCount) * 100) : 0,
    fullWidthMinutesPercent: totalAllMinutes > 0
      ? round1(((totalAllMinutes - splitMinutes) / totalAllMinutes) * 100) : 0,
    splitMinutesPercent: totalAllMinutes > 0
      ? round1((splitMinutes / totalAllMinutes) * 100) : 0,
  };

  const dayBuckets = new Map();
  for (const e of effectiveEntries) {
    if (!dayBuckets.has(e.day_of_week)) {
      dayBuckets.set(e.day_of_week, {
        minutes: 0,
        minSort: e.start_sort,
        maxSort: e.end_sort,
        entries: [],
      });
    }
    const d = dayBuckets.get(e.day_of_week);
    d.minutes += Number(e.minutes);
    d.minSort = Math.min(d.minSort, e.start_sort);
    d.maxSort = Math.max(d.maxSort, e.end_sort);
    d.entries.push({ start_sort: e.start_sort, end_sort: e.end_sort });
  }

  const dailyLoad = [];
  for (let day = 0; day <= 6; day++) {
    const bucket = dayBuckets.get(day);
    if (!bucket) {
      dailyLoad.push({
        day,
        hours: 0,
        gapMinutes: 0,
        gapEfficiencyPercent: null,
        hasParallelTracks: false,
      });
      continue;
    }

    const hasParallelTracks = dayHasOverlap(bucket.entries);

    if (hasParallelTracks) {

      dailyLoad.push({
        day,
        hours: round1(bucket.minutes / 60),
        gapMinutes: null,
        gapEfficiencyPercent: null,
        hasParallelTracks: true,
      });
      continue;
    }

    const windowMinutes = slots
      .filter((s) => s.sort_order >= bucket.minSort && s.sort_order <= bucket.maxSort)
      .reduce((sum, s) => sum + Number(s.minutes), 0);
    const gapMinutes = Math.max(0, windowMinutes - bucket.minutes);
    dailyLoad.push({
      day,
      hours: round1(bucket.minutes / 60),
      gapMinutes: Math.round(gapMinutes),
      gapEfficiencyPercent: windowMinutes > 0 ? round1((bucket.minutes / windowMinutes) * 100) : null,
      hasParallelTracks: false,
    });
  }

  const activeDays = dailyLoad.filter((d) => d.hours > 0);
  const longestDay = activeDays.length > 0
    ? activeDays.reduce((max, d) => (d.hours > max.hours ? d : max))
    : null;

  return {
    facultyAllocation,
    subjectDurationRatios,
    trackFracture,
    dailyLoad,
    longestDay: longestDay ? { day: longestDay.day, hours: longestDay.hours } : null,
    totalWeeklyHours: round1(totalEffectiveMinutes / 60),
  };
}

module.exports = { computeAnalytics };
