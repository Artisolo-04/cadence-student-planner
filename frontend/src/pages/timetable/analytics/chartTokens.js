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

export const CHART_ACCENTS = [
  "#5eead4",
  "#fbbf24",
  "#a78bfa",
  "#fb7185",
  "#60a5fa",
  "#a3e635",
  "#22c55e",
  "#f97316",
];

export function accentFor(index) {
  return CHART_ACCENTS[index % CHART_ACCENTS.length];
}

export function subjectTint(hex) {
  if (!hex) return "var(--color-success)";
  return `color-mix(in srgb, ${hex} 72%, color-mix(in srgb, var(--color-accent) 25%, var(--color-surface) 75%) 28%)`;
}

export function hoursToLabel(decimalHours) {
  if (decimalHours == null || Number.isNaN(Number(decimalHours))) return "—";

  const totalMinutes = Math.round(Number(decimalHours) * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0 && minutes > 0) return `${minutes}m`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export function polarPoint(cx, cy, radius, angleDeg) {
  const radians = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

export function donutSlicePath(cx, cy, outerRadius, innerRadius, startPct, endPct) {
  const span = endPct - startPct;

  if (span >= 99.999) {
    return [
      `M ${cx} ${cy - outerRadius}`,
      `A ${outerRadius} ${outerRadius} 0 1 1 ${cx - 0.01} ${cy - outerRadius}`,
      `A ${outerRadius} ${outerRadius} 0 1 1 ${cx} ${cy - outerRadius}`,
      `M ${cx} ${cy - innerRadius}`,
      `A ${innerRadius} ${innerRadius} 0 1 0 ${cx - 0.01} ${cy - innerRadius}`,
      `A ${innerRadius} ${innerRadius} 0 1 0 ${cx} ${cy - innerRadius}`,
      "Z",
    ].join(" ");
  }

  const startAngle = (startPct / 100) * 360;
  const endAngle = (endPct / 100) * 360;
  const largeArc = span > 50 ? 1 : 0;

  const p1 = polarPoint(cx, cy, outerRadius, startAngle);
  const p2 = polarPoint(cx, cy, outerRadius, endAngle);
  const p3 = polarPoint(cx, cy, innerRadius, endAngle);
  const p4 = polarPoint(cx, cy, innerRadius, startAngle);

  return [
    `M ${p1.x} ${p1.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
    "Z",
  ].join(" ");
}

export function entryTimeLabel(entry, slots = []) {
  const slotById = new Map(slots.map((slot) => [String(slot.id), slot]));
  const startSlot = slotById.get(String(entry.start_slot_id));
  const endSlot = slotById.get(String(entry.end_slot_id));

  if (!startSlot || !endSlot) return "Time unavailable";

  const startTime = String(startSlot.start_time || "").slice(0, 5);
  const endTime = String(endSlot.end_time || "").slice(0, 5);

  if (startTime && endTime) return `${startTime} – ${endTime}`;

  if (startSlot.name && endSlot.name) {
    return startSlot.id === endSlot.id
      ? startSlot.name
      : `${startSlot.name} – ${endSlot.name}`;
  }

  return "Time unavailable";
}

export function entrySortValue(entry, slots = []) {
  const slot = slots.find((item) => String(item.id) === String(entry.start_slot_id));
  return `${entry.day_of_week}-${slot?.start_time || slot?.name || ""}`;
}
