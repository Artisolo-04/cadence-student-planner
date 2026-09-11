import Button from "../../../../../components/ui/Button";
import { ExternalLink, Download, Trash2, HardDrive, Layers } from "lucide-react";
import ThumbnailBlock from "./ThumbnailBlock";
import MetaBadge from "./MetaBadge";
import { getFileMeta, formatBytes } from "./utils";
import { downloadFile } from "../../ResourcePreviewSidebar/downloadFile";
import { stripExtension } from "../../../components/AddVaultItemForm/utils";

export default function FileCard({ item, folderTitle, onRequestDelete, onPreview }) {
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
