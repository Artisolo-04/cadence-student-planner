export const DEFAULT_VAULT_FILTERS = { query: "", types: [], contents: [], sort: "date" };

export const TYPE_OPTIONS = [
  { id: "link", label: "Links" },
  { id: "pdf", label: "PDFs" },
  { id: "doc", label: "Documents" },
  { id: "sheet", label: "Sheets" },
];

export const CONTENT_OPTIONS = [
  { id: "filled", label: "With resources" },
  { id: "empty", label: "Empty workspaces" },
];

export const SORT_OPTIONS = [
  { id: "date", label: "Date added", hint: "Newest first" },
  { id: "alpha", label: "Alphabetical", hint: "A – Z" },
];

const EXT_KIND = {
  pdf: "pdf",
  doc: "doc", docx: "doc", txt: "doc", md: "doc", ppt: "doc", pptx: "doc",
  xls: "sheet", xlsx: "sheet", csv: "sheet",
};

export function classifyItem(item) {
  const type = (item.resource_type || "").toLowerCase();
  if (type === "link" || type === "url") return "link";
  if (EXT_KIND[type]) return EXT_KIND[type];
  const match = /\.([a-zA-Z0-9]+)(?:[?#].*)?$/.exec(item.title || item.url_path || "");
  if (!match) return "link";
  return EXT_KIND[match[1].toLowerCase()] || "other";
}

const groupTitle = (g) => g.subjectName ?? g.folderName ?? "";

function groupTime(group) {
  let latest = 0;
  for (const item of group.items || []) {
    const t = Date.parse(item.created_at ?? item.createdAt ?? "");
    if (!Number.isNaN(t) && t > latest) latest = t;
  }
  return latest;
}

export function applyVaultFilters(groups, filters) {
  const q = filters.query.trim().toLowerCase();
  const types = new Set(filters.types);
  const wantFilled = filters.contents.includes("filled");
  const wantEmpty = filters.contents.includes("empty");
  const contentsActive = wantFilled !== wantEmpty;

  const kept = (groups || []).filter((group) => {
    const items = group.items || [];
    if (contentsActive && (wantFilled ? items.length === 0 : items.length > 0)) return false;
    if (types.size && !items.some((i) => types.has(classifyItem(i)))) return false;
    if (q) {
      const inTitle = groupTitle(group).toLowerCase().includes(q);
      const inItems = items.some((i) => (i.title || "").toLowerCase().includes(q));
      if (!inTitle && !inItems) return false;
    }
    return true;
  });

  if (filters.sort === "alpha") {
    return [...kept].sort((a, b) =>
      groupTitle(a).localeCompare(groupTitle(b), undefined, { sensitivity: "base", numeric: true })
    );
  }
  return [...kept].sort((a, b) => groupTime(b) - groupTime(a));
}

export function countActiveFilters(f) {
  return f.types.length + f.contents.length + (f.sort !== "date" ? 1 : 0);
}

export function isFilterActive(f) {
  return f.query.trim() !== "" || f.types.length > 0 || f.contents.length > 0;
}
