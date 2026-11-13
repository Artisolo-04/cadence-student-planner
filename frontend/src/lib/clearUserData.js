// Removes every per-user key (cadence_*). UI prefs use a hyphen
// (cadence-theme, sidebar-collapsed) and are intentionally kept.
export function clearUserData() {
  Object.keys(localStorage)
    .filter((key) => key.startsWith("cadence_"))
    .forEach((key) => localStorage.removeItem(key));
}
