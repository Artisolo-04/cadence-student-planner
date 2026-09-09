import { useEffect, useState } from "react";
import { FileText, FileSpreadsheet, Globe2, ExternalLink, Plus, Trash2, File as FileIcon } from "lucide-react";
import ExplorerHeader from "./ExplorerHeader";
import Button from "../../../components/ui/Button";

function getFileMeta(item) {
  const type = (item.resource_type || "").toLowerCase();
  const source = item.url_path || item.title || "";
  const extMatch = source.match(/\.([a-z0-9]+)(?:\?.*)?$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : "";

  if (type === "link" || (!ext && /^https?:\/\//i.test(source))) {
    return { kind: "url", badge: "URL", Icon: Globe2, accentVar: "--color-primary" };
  }
  if (ext === "pdf" || type === "pdf") {
    return { kind: "pdf", badge: "PDF", Icon: FileText, accentVar: "--color-danger" };
  }
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return { kind: "sheet", badge: ext.toUpperCase(), Icon: FileSpreadsheet, accentVar: "--color-success" };
  }
  if (["doc", "docx", "txt", "md"].includes(ext)) {
    return { kind: "doc", badge: ext.toUpperCase(), Icon: FileText, accentVar: "--color-success" };
  }
  return { kind: "generic", badge: ext ? ext.toUpperCase() : "FILE", Icon: FileIcon, accentVar: "--color-text-muted" };
}

function ThumbnailBlock({ meta }) {
  const { kind, Icon, accentVar } = meta;

  return (
    <div className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-lg border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_3%,var(--color-surface))]">
      {kind === "pdf" && (
        <div className="relative flex h-16 w-12 flex-col justify-end gap-1 rounded-[3px] border-2 p-1.5" style={{ borderColor: `var(${accentVar})` }}>
          <span className="absolute -top-px -right-px h-3 w-3 border-b-2 border-l-2 rounded-bl-[3px]" style={{ borderColor: `var(${accentVar})` }} />
          <span className="h-[3px] w-full rounded-full" style={{ backgroundColor: `var(${accentVar})`, opacity: 0.85 }} />
          <span className="h-[3px] w-3/4 rounded-full" style={{ backgroundColor: `var(${accentVar})`, opacity: 0.6 }} />
          <span className="h-[3px] w-full rounded-full" style={{ backgroundColor: `var(${accentVar})`, opacity: 0.4 }} />
        </div>
      )}

      {(kind === "sheet" || kind === "doc") && (
        <div className="grid h-16 w-14 grid-cols-3 grid-rows-4 gap-[2px] rounded-[3px] border border-[var(--color-border)] p-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="rounded-[1px]"
              style={{
                backgroundColor: i % 4 === 0 ? `var(${accentVar})` : "var(--color-border)",
                opacity: i % 4 === 0 ? 0.85 : 0.5,
              }}
            />
          ))}
        </div>
      )}

      {kind === "url" && (
        <span
          className="flex h-14 w-14 items-center justify-center rounded-full border"
          style={{ borderColor: `var(${accentVar})`, backgroundColor: `color-mix(in srgb, var(${accentVar}) 12%, transparent)` }}
        >
          <Icon size={26} style={{ color: `var(${accentVar})` }} />
        </span>
      )}

      {kind === "generic" && <Icon size={28} style={{ color: `var(${accentVar})` }} />}
    </div>
  );
}

function FileCard({ item, folderTitle, onRequestDelete }) {
  const meta = getFileMeta(item);

  const handleOpen = () => {
    if (item.url_path) window.open(item.url_path, "_blank", "noopener,noreferrer");
  };

  const handleDeleteClick = () => {
    onRequestDelete?.({ ...item, folderTitle });
  };

  return (
    <div className="group relative flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-colors hover:border-[color-mix(in_srgb,var(--color-primary)_40%,var(--color-border))]">
      <ThumbnailBlock meta={meta} />

      <div className="flex min-w-0 items-center justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--color-text)]" title={item.title}>
          {item.title}
        </p>
        <span
          className="w-fit shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide"
          style={{
            borderColor: `color-mix(in srgb, var(${meta.accentVar}) 45%, transparent)`,
            color: `var(${meta.accentVar})`,
            backgroundColor: `color-mix(in srgb, var(${meta.accentVar}) 10%, transparent)`,
          }}
        >
          {meta.badge}
        </span>
      </div>

      <div className="mt-1 flex items-center gap-2 border-t border-[var(--color-border)] pt-3">
        <Button
          variant="secondary"
          onClick={handleOpen}
          disabled={!item.url_path}
          className="flex-1 gap-1.5 px-3 py-2 text-xs"
        >
          <ExternalLink size={13} />
          Open
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDeleteClick}
          aria-label={`Delete ${item.title}`}
          className="h-9 w-9 text-[var(--color-text-muted)] hover:bg-[color-mix(in_srgb,var(--color-danger)_12%,transparent)] hover:text-[var(--color-danger)]"
        >
          <Trash2 size={13} />
        </Button>
      </div>
    </div>
  );
}

export default function FolderExplorerModal({
  folder,
  accent,
  onClose,
  onRequestDelete,
  onAddResource,
  isCustomWorkspace,
  onRenameFolder,
  existingFolderNames = [],
}) {
  const open = Boolean(folder);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf1, raf2;
    if (open) {
      setMounted(true);
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const timeout = setTimeout(() => setMounted(false), 220);
      return () => clearTimeout(timeout);
    }
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  const items = folder?.items || [];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`relative flex h-full w-full max-w-[1400px] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] shadow-[0_0_80px_-20px_rgba(0,0,0,0.5)] transition-all duration-200 ease-out md:h-[90vh] ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {folder && (
          <>
            <ExplorerHeader
              title={folder.title}
              accent={accent}
              onClose={onClose}
              onAddResource={onAddResource ? () => onAddResource(folder.target) : undefined}
              isCustomWorkspace={isCustomWorkspace}
              onRenameFolder={onRenameFolder}
              existingFolderNames={existingFolderNames}
            />

            <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto p-5 scrollbar-cadence">
              {items.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_3%,var(--color-surface))]">
                  <p className="text-sm text-[var(--color-text-muted)]">
                    No resources yet in this folder.
                  </p>
                  {onAddResource && (
                    <Button
                      variant="secondary"
                      onClick={() => onAddResource(folder.target)}
                      className="gap-1.5 px-3 py-2 text-xs"
                    >
                      <Plus size={14} />
                      Add the first resource
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                  {items.map((item) => (
                    <FileCard
                      key={item.id}
                      item={item}
                      folderTitle={folder.title}
                      onRequestDelete={onRequestDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
