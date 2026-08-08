export const DAYS_ORDERED = [
  { value: 1, short: "Mon", label: "Monday" },
  { value: 2, short: "Tue", label: "Tuesday" },
  { value: 3, short: "Wed", label: "Wednesday" },
  { value: 4, short: "Thu", label: "Thursday" },
  { value: 5, short: "Fri", label: "Friday" },
  { value: 6, short: "Sat", label: "Saturday" },
  { value: 0, short: "Sun", label: "Sunday" },
];

export function sortDaysByWeekOrder(days) {
  const order = DAYS_ORDERED.map((d) => d.value);
  return [...days].sort(
    (a, b) => order.indexOf(a.day_of_week) - order.indexOf(b.day_of_week)
  );
}

export function dayShortLabel(dayOfWeek) {
  return DAYS_ORDERED.find((d) => d.value === dayOfWeek)?.short ?? "?";
}
