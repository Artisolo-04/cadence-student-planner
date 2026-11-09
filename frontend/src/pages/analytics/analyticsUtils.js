export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
export const DAY_SHORT = { 0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" };
export const GROUP_LABELS = { all: "All groups", g1: "Group 1", g2: "Group 2" };

export function formatMinutes(total) {
  const m = Math.max(0, Math.round(Number(total) || 0));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h > 0 && r > 0) return `${h}h ${r}m`;
  if (h > 0) return `${h}h`;
  return `${r}m`;
}

export function formatBytes(value) {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatShortDate(iso) {
  const [y, m, d] = String(iso).split("-").map(Number);
  if (!y || !m || !d) return String(iso);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function findWorkspace(data, activeId) {
  const list = data?.workspaces ?? [];
  return list.find((w) => String(w.timetableId) === String(activeId)) ?? null;
}

export function findSchedule(workspace, groupTag) {
  const list = workspace?.schedules ?? [];
  return (
    list.find((s) => s.groupTag === groupTag) ??
    list.find((s) => s.groupTag === workspace?.selectedGroup) ??
    list[0] ??
    null
  );
}
