const round1 = (n) => Math.round(n * 10) / 10;

function timeToMinutes(hhmm) {
  if (!hhmm) return null;
  const [h, m] = String(hhmm).slice(0, 5).split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function slotDurationMinutes(slot) {
  const start = timeToMinutes(slot.start_time);
  const end = timeToMinutes(slot.end_time);
  if (start == null || end == null) return 0;
  return Math.max(0, end - start);
}

function entrySortRange(entry, slotById) {
  const startSlot = slotById.get(String(entry.start_slot_id));
  const endSlot = slotById.get(String(entry.end_slot_id));
  if (!startSlot || !endSlot) return null;
  return { startSort: startSlot.sort_order, endSort: endSlot.sort_order };
}

function minutesForSortRange(startSort, endSort, slots) {
  return slots
    .filter((s) => s.sort_order >= startSort && s.sort_order <= endSort)
    .reduce((sum, s) => sum + slotDurationMinutes(s), 0);
}

function dayHasOverlap(entries) {
  const sorted = [...entries].sort((a, b) => a.start_sort - b.start_sort);
  let maxEndSoFar = -Infinity;
  for (const e of sorted) {
    if (e.start_sort <= maxEndSoFar) return true;
    maxEndSoFar = Math.max(maxEndSoFar, e.end_sort);
  }
  return false;
}

export function filterEntriesForGroup(rawEntries, groupTag) {
  if (groupTag === "all") return rawEntries;
  return rawEntries.filter(
    (e) => e.group_tag === "all" || e.group_tag === groupTag
  );
}

export function computeGroupDailyLoad(rawEntries, slots, groupTag) {
  const slotById = new Map(slots.map((s) => [String(s.id), s]));
  const visible = filterEntriesForGroup(rawEntries, groupTag);

  const dayBuckets = new Map();
  visible.forEach((entry) => {
    const range = entrySortRange(entry, slotById);
    if (!range) return;
    const minutes = minutesForSortRange(range.startSort, range.endSort, slots);

    if (!dayBuckets.has(entry.day_of_week)) {
      dayBuckets.set(entry.day_of_week, {
        minutes: 0,
        minSort: range.startSort,
        maxSort: range.endSort,
        entries: [],
      });
    }
    const d = dayBuckets.get(entry.day_of_week);
    d.minutes += minutes;
    d.minSort = Math.min(d.minSort, range.startSort);
    d.maxSort = Math.max(d.maxSort, range.endSort);
    d.entries.push({ start_sort: range.startSort, end_sort: range.endSort });
  });

  const dailyLoad = [];
  for (let day = 0; day <= 6; day += 1) {
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
      .reduce((sum, s) => sum + slotDurationMinutes(s), 0);
    const gapMinutes = Math.max(0, windowMinutes - bucket.minutes);

    dailyLoad.push({
      day,
      hours: round1(bucket.minutes / 60),
      gapMinutes: Math.round(gapMinutes),
      gapEfficiencyPercent: windowMinutes > 0 ? round1((bucket.minutes / windowMinutes) * 100) : null,
      hasParallelTracks: false,
    });
  }

  return dailyLoad;
}

export function computeGroupSubjectStats(rawEntries, slots, groupTag) {
  const slotById = new Map(slots.map((s) => [String(s.id), s]));
  const visible = filterEntriesForGroup(rawEntries, groupTag);

  const byName = new Map();
  let totalMinutes = 0;

  visible.forEach((entry) => {
    const range = entrySortRange(entry, slotById);
    if (!range) return;
    const minutes = minutesForSortRange(range.startSort, range.endSort, slots);
    totalMinutes += minutes;
    const prev = byName.get(entry.subject_name) || { minutes: 0 };
    byName.set(entry.subject_name, { minutes: prev.minutes + minutes });
  });

  return Array.from(byName.entries())
    .map(([name, { minutes }]) => ({
      subjectId: name,
      name,
      weeklyHours: round1(minutes / 60),
      percentOfWeek: totalMinutes > 0 ? round1((minutes / totalMinutes) * 100) : 0,
    }))
    .sort((a, b) => b.weeklyHours - a.weeklyHours);
}

export function computeGroupFacultyStats(rawEntries, slots, groupTag) {
  const slotById = new Map(slots.map((s) => [String(s.id), s]));
  const visible = filterEntriesForGroup(rawEntries, groupTag);

  const byTeacher = new Map();

  visible.forEach((entry) => {
    const range = entrySortRange(entry, slotById);
    if (!range) return;
    const minutes = minutesForSortRange(range.startSort, range.endSort, slots);
    const prev = byTeacher.get(entry.teacher) || {
      minutes: 0,
      subjects: new Map(),
    };
    prev.minutes += minutes;
    prev.subjects.set(entry.subject_name, {
      id: entry.subject_name,
      name: entry.subject_name,
    });
    byTeacher.set(entry.teacher, prev);
  });

  return Array.from(byTeacher.entries())
    .map(([teacher, { minutes, subjects }]) => ({
      teacher,
      subjectCount: subjects.size,
      weeklyHours: round1(minutes / 60),
      subjects: Array.from(subjects.values()),
    }))
    .sort((a, b) => b.weeklyHours - a.weeklyHours);
}

export function computeGroupWeeklyHours(rawEntries, slots, groupTag) {
  const slotById = new Map(slots.map((s) => [String(s.id), s]));
  const visible = filterEntriesForGroup(rawEntries, groupTag);

  const totalMinutes = visible.reduce((sum, entry) => {
    const range = entrySortRange(entry, slotById);
    if (!range) return sum;
    return sum + minutesForSortRange(range.startSort, range.endSort, slots);
  }, 0);

  return round1(totalMinutes / 60);
}

export function computeGroupTrackFracture(rawEntries, slots, groupTag) {
  const slotById = new Map(slots.map((s) => [String(s.id), s]));
  const visible = filterEntriesForGroup(rawEntries, groupTag);

  const withMinutes = visible.map((entry) => {
    const range = entrySortRange(entry, slotById);
    const minutes = range ? minutesForSortRange(range.startSort, range.endSort, slots) : 0;
    return { entry, minutes };
  });

  const totalEntryCount = withMinutes.length;
  const splitItems = withMinutes.filter(({ entry }) => entry.group_tag !== "all");
  const totalAllMinutes = withMinutes.reduce((sum, { minutes }) => sum + minutes, 0);
  const splitMinutes = splitItems.reduce((sum, { minutes }) => sum + minutes, 0);

  return {
    fullWidthPercent: totalEntryCount > 0
      ? round1(((totalEntryCount - splitItems.length) / totalEntryCount) * 100) : 0,
    splitPercent: totalEntryCount > 0
      ? round1((splitItems.length / totalEntryCount) * 100) : 0,
    fullWidthMinutesPercent: totalAllMinutes > 0
      ? round1(((totalAllMinutes - splitMinutes) / totalAllMinutes) * 100) : 0,
    splitMinutesPercent: totalAllMinutes > 0
      ? round1((splitMinutes / totalAllMinutes) * 100) : 0,
  };
}
