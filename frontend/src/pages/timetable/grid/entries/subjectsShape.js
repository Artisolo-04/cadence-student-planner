const KEY = "cadence_subjects_shape";

export function readSubjectsShape() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(list) && list.length > 0) return list.slice(0, 12).map(Boolean);
  } catch {
    /* ignore: default shape is used */
  }
  return null;
}

export function saveSubjectsShape(subjects) {
  try {
    const list = (subjects ?? []).slice(0, 12).map((s) => Boolean(s.teacher));
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable */
  }
}
