const STOP = new Set([
  "read", "write", "chapter", "the", "for", "and", "with", "finish", "complete",
  "review", "make", "study", "homework", "exercise", "exercises",
]);

const norm = (s = "") =>
  String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ");

export const keywords = (s) => norm(s).split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));

export function flattenVault(bySubject = [], byFolder = []) {
  const map = new Map();
  for (const group of [...bySubject, ...byFolder]) {
    for (const item of group.items || []) if (!map.has(item.id)) map.set(item.id, item);
  }
  return [...map.values()];
}

const stamp = (i) => {
  const t = Date.parse(i.created_at ?? i.createdAt ?? "");
  return Number.isNaN(t) ? 0 : t;
};

export function recentFiles(files = [], n = 3) {
  return [...files].sort((a, b) => stamp(b) - stamp(a) || Number(b.id) - Number(a.id)).slice(0, n);
}

export function findVaultMatch(taskTitle, files = []) {
  const kw = keywords(taskTitle);
  if (kw.length === 0) return null;
  const need = Math.min(2, kw.length);
  return (
    files.find((f) => {
      const hay = norm(f.title);
      return kw.filter((w) => hay.includes(w)).length >= need;
    }) || null
  );
}

export function timeAgo(item) {
  const t = stamp(item);
  if (!t) return "";
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return `${Math.floor(s / (86400 * 30))}mo ago`;
}

export function kindOf(item) {
  const rt = String(item.resource_type || "").toLowerCase();
  const p = String(item.url_path || "").toLowerCase();
  if (rt.includes("folder")) return "folder";
  if (rt.includes("link") || rt.includes("url") || /^https?:\/\//.test(p)) return "link";
  return "file";
}

function formatSize(b) {
  if (!b) return "";
  if (b < 1024 * 1024) return `${Math.max(1, Math.round(b / 1024))} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function metaLine(item) {
  return [
    item.folder_name || item.subject_name,
    item.page_count ? `${item.page_count} pages` : "",
    formatSize(item.file_size_bytes),
  ].filter(Boolean).join(" · ");
}

export function openVaultItem(item, navigate) {
  const path = item?.url_path || "";
  if (/^https?:\/\//.test(path)) {
    window.open(path, "_blank", "noopener,noreferrer");
    return;
  }
  navigate("/vault");
}
