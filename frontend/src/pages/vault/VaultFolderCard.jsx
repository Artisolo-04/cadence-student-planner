import { useState } from "react";
import { ChevronDown, ExternalLink, FileText, Folder, Link2, Trash2 } from "lucide-react";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

export default function VaultFolderCard({ title, itemCount, items, accent, onDeleteItem, layout = "grid" }) {
  const [open, setOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await onDeleteItem(pendingDelete.id);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const itemRows = (compact) => (
    <div className={`relative z-10 flex flex-col ${compact ? "" : "border-t border-[var(--color-border)]"}`}>
      {items.length === 0 ? (
        <p className="px-5 py-3 text-sm text-[var(--color-text-muted)]">No items yet.</p>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-2 border-t border-[var(--color-border)] px-5 first:border-t-0 ${
              compact ? "py-2" : "py-2.5"
            }`}
          >
            <span className="shrink-0 text-[var(--color-text-muted)]">
              {item.resource_type === "pdf" ? <FileText size={14} /> : <Link2 size={14} />}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-[var(--color-text)]">
              {item.title}
            </span>

            <a

              href={item.url_path}
              target="_blank"
              rel="noreferrer"
              aria-label="Open"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex shrink-0 rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-white/10 hover:text-[var(--color-text)]"
            >
              <ExternalLink size={14} />
            </a>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPendingDelete({ id: item.id, title: item.title });
              }}
              aria-label="Delete"
              className="inline-flex shrink-0 rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))
      )}
    </div>
  );

  if (layout === "list") {
    return (
      <>
        <article
          style={{ "--folder-color": accent }}
          className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_3%,var(--color-surface))] transition-colors duration-200 hover:border-[color-mix(in_srgb,var(--folder-color)_55%,transparent)]"
        >
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <Folder size={15} style={{ color: accent }} className="shrink-0" />
              <span className="min-w-0 truncate text-sm font-medium text-[var(--color-text)]">
                {title}
              </span>
              <span className="shrink-0 text-xs font-medium" style={{ color: accent }}>
                {itemCount} {itemCount === 1 ? "resource" : "resources"}
              </span>
            </div>
            <ChevronDown
              size={14}
              className={`shrink-0 text-[var(--color-text-muted)] transition-transform duration-150 ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>
          {open && itemRows(true)}
        </article>

        <ConfirmDialog
          open={!!pendingDelete}
          title="Delete this file?"
          messages={[
            pendingDelete ? `"${pendingDelete.title}" will be removed from ${title}.` : "",
            "This can't be undone — the hosted file or link record is permanently wiped from disk.",
          ]}
          confirmLabel={deleting ? "Deleting…" : "Delete"}
          cancelLabel="Keep it"
          onConfirm={handleConfirmDelete}
          onCancel={() => !deleting && setPendingDelete(null)}
        />
      </>
    );
  }

  return (
    <>
      <article
        style={{
          "--folder-color": accent,
          backgroundImage:
            "linear-gradient(155deg, color-mix(in srgb, var(--folder-color) 22%, transparent) 0%, color-mix(in srgb, var(--color-accent) 10%, transparent) 55%, transparent 100%)",
        }}
        className="group relative flex flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_3%,var(--color-surface))] backdrop-blur-xl transition-all duration-300 ease-out hover:border-[color-mix(in_srgb,var(--folder-color)_55%,transparent)] hover:shadow-[0_20px_45px_-18px_color-mix(in_srgb,var(--folder-color)_35%,transparent)]"
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

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="relative z-10 flex items-center justify-between gap-3 p-5 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]"
        >
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
            <div className="min-w-0">
              <span className="block text-base font-semibold leading-snug text-[var(--color-text)] line-clamp-2">
                {title}
              </span>
              <span
                className="mt-1 inline-flex w-fit items-center gap-1.5 text-xs font-medium"
                style={{ color: accent }}
              >
                {itemCount} {itemCount === 1 ? "resource" : "resources"}
              </span>
            </div>
          </div>
          <ChevronDown
            size={16}
            className={`shrink-0 text-[var(--color-text-muted)] transition-transform duration-150 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && itemRows(false)}
      </article>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this file?"
        messages={[
          pendingDelete ? `"${pendingDelete.title}" will be removed from ${title}.` : "",
          "This can't be undone — the hosted file or link record is permanently wiped from disk.",
        ]}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        cancelLabel="Keep it"
        onConfirm={handleConfirmDelete}
        onCancel={() => !deleting && setPendingDelete(null)}
      />
    </>
  );
}
