const KEY = "cadence_homework_list_shape";
const MAX = 30;
const STATUS_INDEX = { todo: 0, in_progress: 1, done: 2 };

function dueTime(item) {
  const t = new Date(item?.due_date).getTime();
  return Number.isNaN(t) ? Infinity : t;
}

// null = never saved (caller uses a default guess)
// []   = saved, there really was no homework
// Row = [hasNotes, hasSubject, statusIndex]  (statusIndex: 0 todo, 1 in_progress, 2 done)
export function readHomeworkListShape() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (!Array.isArray(raw)) return null;
    return raw.slice(0, MAX).map((r) => {
      const s = Number(r?.[2]);
      return [Boolean(r?.[0]), Boolean(r?.[1]), s === 1 || s === 2 ? s : 0];
    });
  } catch {
    return null;
  }
}

// One entry per row, in the default sort order (due date, soonest first).
export function saveHomeworkListShape(items) {
  try {
    const rows = [...(items ?? [])]
      .sort((a, b) => {
        const x = dueTime(a);
        const y = dueTime(b);
        return x === y ? 0 : x < y ? -1 : 1;
      })
      .slice(0, MAX)
      .map((h) => [Boolean(h.notes), Boolean(h.subject_name), STATUS_INDEX[h.status] ?? 0]);
    localStorage.setItem(KEY, JSON.stringify(rows));
  } catch {
    /* storage unavailable */
  }
}
