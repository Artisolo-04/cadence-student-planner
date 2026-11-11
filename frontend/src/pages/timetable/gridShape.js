import { sortDaysByWeekOrder } from "../../lib/days";

const KEY = "cadence_grid_shapes";
const LAST = "__last";

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function readGridShape(id) {
  const all = readAll();
  return all[String(id)] ?? all[LAST] ?? null;
}

export function saveGridShape(id, workspace) {
  try {
    const days = workspace?.days ?? [];
    const slots = workspace?.slots ?? [];
    if (id == null || days.length === 0 || slots.length === 0) return;
    const shape = {
      days: sortDaysByWeekOrder(days).map((d) => d.day_of_week),
      rows: slots.length,
    };
    const all = readAll();
    all[String(id)] = shape;
    all[LAST] = shape;
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable: skeleton falls back to the default shape */
  }
}
