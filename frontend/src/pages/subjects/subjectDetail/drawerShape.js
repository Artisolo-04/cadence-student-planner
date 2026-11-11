const KEY = "cadence_subject_drawer_shape";
const MAX_SUBJECTS = 20;
const MAX_DAYS = 7;
const MAX_ROWS = 6;
const MAX_HW = 8;

function clamp(n, max) {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 0) return 0;
  return Math.min(Math.floor(v), max);
}

function readAll() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw;
  } catch {
    /* ignore: default shape is used */
  }
  return {};
}

export function readDrawerShape(key) {
  if (!key) return null;
  const entry = readAll()[key];
  if (!entry || !Array.isArray(entry.days)) return null;
  return {
    days: entry.days
      .slice(0, MAX_DAYS)
      .map((n) => clamp(n, MAX_ROWS))
      .filter((n) => n > 0),
    hw: clamp(entry.hw, MAX_HW),
    nextLines: entry.nextLines === 2 ? 2 : 1,
  };
}

export function saveDrawerShape(key, shape) {
  if (!key || !shape) return;
  try {
    const all = readAll();
    delete all[key];
    all[key] = {
      days: (shape.days ?? []).slice(0, MAX_DAYS).map((n) => clamp(n, MAX_ROWS)),
      hw: clamp(shape.hw, MAX_HW),
      nextLines: shape.nextLines === 2 ? 2 : 1,
    };
    const keys = Object.keys(all);
    for (const k of keys.slice(0, Math.max(0, keys.length - MAX_SUBJECTS))) {
      delete all[k];
    }
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable */
  }
}
