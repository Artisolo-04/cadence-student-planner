const KEY = "cadence_subjects_list_shape";
const MAX = 30;

export function readSubjectsListShape() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(list) && list.length > 0) {
      return list.slice(0, MAX).map((c) => [Boolean(c?.[0]), Boolean(c?.[1])]);
    }
  } catch {
    /* ignore: default shape is used */
  }
  return null;
}

export function saveSubjectsListShape(subjects) {
  try {
    const list = (subjects ?? [])
      .slice(0, MAX)
      .map((s) => [Boolean(s.teacher), Boolean(s.weekly_hours)]);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable */
  }
}
