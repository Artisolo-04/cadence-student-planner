const KEY = "cadence_subjects_list_shapes";
const MAX = 30;
const MAX_WORKSPACES = 20;

function readAll() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw;
  } catch {
    /* ignore: default shape is used */
  }
  return {};
}

// null = never saved for this workspace (caller uses a default guess)
// []   = saved, the workspace really had no subjects
export function readSubjectsListShape(id) {
  const list = readAll()[String(id)];
  if (!Array.isArray(list)) return null;
  return list.slice(0, MAX).map((c) => [Boolean(c?.[0]), Boolean(c?.[1])]);
}

export function saveSubjectsListShape(id, subjects) {
  try {
    const all = readAll();
    const k = String(id);
    delete all[k];
    all[k] = (subjects ?? [])
      .slice(0, MAX)
      .map((s) => [Boolean(s.teacher), Boolean(s.weekly_hours)]);
    const keys = Object.keys(all);
    for (const old of keys.slice(0, Math.max(0, keys.length - MAX_WORKSPACES))) {
      delete all[old];
    }
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable */
  }
}
