import { Folder, Trash2 } from "lucide-react";

const EXTENSION_LABELS = {
  pdf: "PDF",
  doc: "Word",
  docx: "Word",
  xls: "Excel",
  xlsx: "Excel",
  csv: "Excel",
  ppt: "PowerPoint",
  pptx: "PowerPoint",
  txt: "Text",
  png: "Image",
  jpg: "Image",
  jpeg: "Image",
  gif: "Image",
  webp: "Image",
};

function resolveKind(item) {
  const type = (item.resource_type || "").toLowerCase();
  if (type === "link" || type === "url") return "Link";
  if (type && EXTENSION_LABELS[type]) return EXTENSION_LABELS[type];

  const source = item.title || item.url_path || "";
  const match = /\.([a-zA-Z0-9]+)(?:[?#].*)?$/.exec(source);
  if (match) {
    const ext = match[1].toLowerCase();
    if (EXTENSION_LABELS[ext]) return EXTENSION_LABELS[ext];
    return ext.toUpperCase();
  }

  return "Link";
}

function pluralize(label, count) {
  if (count === 1) return label;
  return label.endsWith("s") ? label : `${label}s`;
}

function buildBreakdown(items) {
  const counts = new Map();
  for (const item of items) {
    const kind = resolveKind(item);
    counts.set(kind, (counts.get(kind) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => ({ label: pluralize(label, count), count }));
}

function Chip({ children }) {
  return (
    <span className="inline-flex h-6 items-center rounded-md border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_5%,transparent)] px-2 text-[11px] font-medium leading-none text-[var(--color-text-muted)]">
      {children}
    </span>
  );
}

function CountBadge({ count, accent, className = "" }) {
  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-md px-2.5 text-[11px] font-semibold leading-none ${className}`}
      style={{
        color: accent,
        backgroundColor: "color-mix(in srgb, var(--folder-color) 16%, transparent)",
        border: "1px solid color-mix(in srgb, var(--folder-color) 32%, transparent)",
      }}
    >
      {count} {count === 1 ? "resource" : "resources"}
    </span>
  );
}

export default function VaultFolderCard({
  title,
  itemCount,
  items,
  accent,
  layout = "grid",
  onOpen,
  onDeleteFolder,
  deletable = false,
}) {
  const breakdown = buildBreakdown(items);

  if (layout === "list") {
    return (
      <article
        style={{ "--folder-color": accent }}
        role="button"
        tabIndex={0}
        onClick={() => onOpen?.({ title, items })}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen?.({ title, items });
          }
        }}
        className="cursor-pointer overflow-hidden rounded-lg border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_3%,var(--color-surface))] transition-colors duration-200 hover:border-[color-mix(in_srgb,var(--folder-color)_55%,transparent)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]"
      >
        <div className="flex w-full flex-nowrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <Folder size={15} style={{ color: accent }} className="shrink-0" />
            <span className="min-w-0 w-full truncate text-sm font-medium text-[var(--color-text)]">
              {title}
            </span>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            {breakdown.map(({ label, count }) => (
              <Chip key={label}>
                {count} {label}
              </Chip>
            ))}
            <CountBadge count={itemCount} accent={accent} />
            {deletable && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFolder?.({ title, items });
                }}
                className="rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]"
                aria-label={`Delete ${title}`}
                title="Delete folder"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      style={{
        "--folder-color": accent,
        backgroundImage:
          "linear-gradient(155deg, color-mix(in srgb, var(--folder-color) 22%, transparent) 0%, color-mix(in srgb, var(--color-accent) 10%, transparent) 55%, transparent 100%)",
      }}
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.({ title, items })}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.({ title, items });
        }
      }}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_3%,var(--color-surface))] backdrop-blur-xl transition-all duration-300 ease-out hover:border-[color-mix(in_srgb,var(--folder-color)_55%,transparent)] hover:shadow-[0_20px_45px_-18px_color-mix(in_srgb,var(--folder-color)_35%,transparent)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full opacity-20 blur-3xl transition-opacity duration-300 group-hover:opacity-35"
        style={{ backgroundColor: "var(--folder-color)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-[color-mix(in_srgb,var(--color-text)_4%,transparent)] to-transparent"
      />

      <div className="relative z-10 flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/15 backdrop-blur-md"
              style={{
                backgroundImage: `linear-gradient(155deg, color-mix(in srgb, ${accent} 40%, black 20%) 0%, color-mix(in srgb, ${accent} 15%, black 45%) 100%)`,
                boxShadow:
                  "0 1px 0 0 rgba(255,255,255,0.15) inset, 0 -1px 3px 0 rgba(0,0,0,0.35) inset, 0 2px 6px -2px rgba(0,0,0,0.4)",
              }}
              aria-hidden="true"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-md bg-gradient-to-b from-white/10 to-transparent"
              />
              <Folder
                size={16}
                style={{ color: accent }}
                className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
              />
            </span>
            <span
              title={title}
              className="block w-full min-w-0 truncate text-base font-semibold leading-snug text-[var(--color-text)]"
            >
              {title}
            </span>
          </div>

          {deletable && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFolder?.({ title, items });
              }}
              className="shrink-0 rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]"
              aria-label={`Delete ${title}`}
              title="Delete folder"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div>
            <CountBadge
              count={itemCount}
              accent={accent}
              className="h-auto px-2.5 py-1 text-xs"
            />
          </div>

          {breakdown.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {breakdown.map(({ label, count }) => (
                <Chip key={label}>
                  {count} {label}
                </Chip>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
