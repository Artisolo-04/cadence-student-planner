import { useEffect, useState } from "react";
import { FileText, FileSpreadsheet, Globe2, ExternalLink, Download, Plus, Trash2, File as FileIcon, HardDrive, Layers, Image as ImageIcon } from "lucide-react";
import ExplorerHeader from "./ExplorerHeader";
import Button from "../../../components/ui/Button";
import ResourcePreviewSidebar from "./ResourcePreviewSidebar";
import { downloadFile } from "./ResourcePreviewSidebar/downloadFile";
import { stripExtension } from "../components/AddVaultItemForm/utils";
import { getResourceMeta } from "../resourceMeta";

export function getFileMeta(item) {
  return getResourceMeta(item);
}

export function formatBytes(rawBytes) {
  const bytes = typeof rawBytes === "string" ? Number(rawBytes) : rawBytes;
  if (typeof bytes !== "number" || Number.isNaN(bytes) || bytes < 0) return null;
  if (bytes === 0) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  const formatted = exponent === 0 ? Math.round(value) : value.toFixed(1);
  return `${formatted} ${units[exponent]}`;
}

function MetaBadge({ icon: Icon, children }) {
  return (
    <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-md border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_5%,transparent)] px-1.5 text-[10px] font-medium leading-none text-[var(--color-text-muted)]">
      {Icon && <Icon size={10} className="shrink-0" />}
      <span className="truncate">{children}</span>
    </span>
  );
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

function FileCard({ item, folderTitle, onRequestDelete, onPreview }) {
  const meta = getFileMeta(item);

  const handlePreview = () => {
    if (item.url_path) onPreview?.(item);
  };

  const handleDeleteClick = () => {
    onRequestDelete?.({ ...item, folderTitle });
  };

  const canDownload = meta.kind !== "url";

  const handleDownloadClick = (e) => {
    e.stopPropagation();
    downloadFile(item);
  };

  return (
    <div className="group relative flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-colors hover:border-[color-mix(in_srgb,var(--color-primary)_40%,var(--color-border))]">
      <ThumbnailBlock meta={meta} />

      <div className="flex min-w-0 items-center justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--color-text)]" title={item.title}>
          {stripExtension(item.title)}
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

      {(meta.kind !== "url" || item.file_size_bytes != null) && (
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {meta.kind !== "url" && formatBytes(item.file_size_bytes) && (
            <MetaBadge icon={HardDrive}>{formatBytes(item.file_size_bytes)}</MetaBadge>
          )}
          {meta.kind === "pdf" && Number.isInteger(item.page_count) && item.page_count > 0 && (
            <MetaBadge icon={Layers}>
              {item.page_count} {item.page_count === 1 ? "page" : "pages"}
            </MetaBadge>
          )}
        </div>
      )}

      <div className="mt-auto flex items-center gap-2 border-t border-[var(--color-border)] pt-3">
        <Button
          variant="secondary"
          onClick={handlePreview}
          disabled={!item.url_path}
          className="flex-1 gap-1.5 px-3 py-2 text-xs"
        >
          <ExternalLink size={13} />
          Open
        </Button>
        {canDownload && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownloadClick}
            disabled={!item.url_path}
            aria-label={`Download ${item.title}`}
            className="h-9 w-9 text-[var(--color-text-muted)] hover:bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] hover:text-[var(--color-primary)]"
          >
            <Download size={13} />
          </Button>
        )}
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
  const [previewItem, setPreviewItem] = useState(null);

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
    if (!open) setPreviewItem(null);
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                  {items.map((item) => (
                    <FileCard
                      key={item.id}
                      item={item}
                      folderTitle={folder.title}
                      onRequestDelete={onRequestDelete}
                      onPreview={setPreviewItem}
                    />
                  ))}
                </div>
              )}
            </div>

            <ResourcePreviewSidebar
              item={previewItem}
              folderTitle={folder.title}
              onClose={() => setPreviewItem(null)}
            />
          </>
        )}
      </div>
    </div>
  );
}
