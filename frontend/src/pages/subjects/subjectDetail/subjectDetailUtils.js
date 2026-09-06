export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_LABELS_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = ((hour + 11) % 12) + 1;
  return `${displayHour}:${m} ${suffix}`;
}

export function toMinutes(t) {
  if (!t) return null;
  const parts = t.split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1] || 0);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export function formatDuration(start, end) {
  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  if (startMin === null || endMin === null) return "";

  let diff = endMin - startMin;
  if (diff < 0) diff += 24 * 60;
  if (diff === 0) return "0m";

  return formatMinutesTotal(diff);
}

export function formatMinutesTotal(totalMinutes) {
  if (!totalMinutes) return "0m";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

export function groupEntriesByDay(entries) {
  const buckets = new Map();
  for (const entry of entries) {
    const day = entry.day_of_week;
    if (!buckets.has(day)) buckets.set(day, []);
    buckets.get(day).push(entry);
  }

  return [...buckets.keys()]
    .sort((a, b) => a - b)
    .map((day) => {
      const dayEntries = buckets.get(day);
      const totalMinutes = dayEntries.reduce((sum, entry) => {
        const startMin = toMinutes(entry.start_time);
        const endMin = toMinutes(entry.end_time);
        if (startMin === null || endMin === null) return sum;
        let diff = endMin - startMin;
        if (diff < 0) diff += 24 * 60;
        return sum + diff;
      }, 0);

      return {
        key: day,
        label: DAY_LABELS_FULL[day] || DAY_LABELS[day] || `Day ${day}`,
        totalLabel: formatMinutesTotal(totalMinutes),
        entries: dayEntries,
      };
    });
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function sumEntryMinutes(entries) {
  if (!entries || entries.length === 0) return 0;
  return entries.reduce((sum, entry) => {
    const startMin = toMinutes(entry.start_time);
    const endMin = toMinutes(entry.end_time);
    if (startMin === null || endMin === null) return sum;
    let diff = endMin - startMin;
    if (diff < 0) diff += 24 * 60;
    return sum + diff;
  }, 0);
}

export function getNextSession(entries) {
  if (!entries || entries.length === 0) return null;

  const now = new Date();
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const withMeta = entries
    .map((entry) => {
      const startMin = toMinutes(entry.start_time);
      if (startMin === null) return null;

      let dayDelta = entry.day_of_week - currentDay;
      if (dayDelta < 0) dayDelta += 7;
      if (dayDelta === 0 && startMin <= currentMinutes) dayDelta = 7;

      return { entry, dayDelta, startMin };
    })
    .filter(Boolean);

  if (withMeta.length === 0) return null;

  withMeta.sort((a, b) => a.dayDelta - b.dayDelta || a.startMin - b.startMin);

  const { entry } = withMeta[0];
  return {
    dayLabel: DAY_LABELS_FULL[entry.day_of_week] || DAY_LABELS[entry.day_of_week] || "",
    time: formatTime(entry.start_time),
    room: entry.room || null,
  };
}
