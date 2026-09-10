import { X, ExternalLink, Download, HardDrive, Layers } from "lucide-react";
import Button from "../../../../components/ui/Button";
import { formatBytes } from "../FolderExplorerModal";
import { resolveAssetUrl } from "./resolveAssetUrl";
import { isDownloadKind, downloadFile } from "./downloadFile";

export default function PreviewHeader({ item, meta, onClose }) {
  const { Icon, accentVar, badge } = meta;
  const sizeLabel = formatBytes(item.file_size_bytes);

  const showDownload = isDownloadKind(meta);

  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_3%,var(--color-surface))] p-4">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
          style={{
            borderColor: `color-mix(in srgb, var(${accentVar}) 45%, transparent)`,
            backgroundColor: `color-mix(in srgb, var(${accentVar}) 12%, transparent)`,
          }}
        >
          <Icon size={16} style={{ color: `var(${accentVar})` }} />
        </span>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--color-text)]" title={item.title}>
            {item.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              className="w-fit shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide"
              style={{
                borderColor: `color-mix(in srgb, var(${accentVar}) 45%, transparent)`,
                color: `var(${accentVar})`,
                backgroundColor: `color-mix(in srgb, var(${accentVar}) 10%, transparent)`,
              }}
            >
              {badge}
            </span>
            {sizeLabel && (
              <span className="inline-flex h-5 items-center gap-1 rounded-md border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_5%,transparent)] px-1.5 text-[10px] font-medium leading-none text-[var(--color-text-muted)]">
                <HardDrive size={10} />
                {sizeLabel}
              </span>
            )}
            {Number.isInteger(item.page_count) && item.page_count > 0 && (
              <span className="inline-flex h-5 items-center gap-1 rounded-md border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_5%,transparent)] px-1.5 text-[10px] font-medium leading-none text-[var(--color-text-muted)]">
                <Layers size={10} />
                {item.page_count} {item.page_count === 1 ? "page" : "pages"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {!showDownload && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => item.url_path && window.open(resolveAssetUrl(item.url_path), "_blank", "noopener,noreferrer")}
            disabled={!item.url_path}
            aria-label="Open in new tab"
            className="h-8 w-8 text-[var(--color-text-muted)] hover:bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] hover:text-[var(--color-primary)]"
          >
            <ExternalLink size={14} />
          </Button>
        )}
        {meta.kind !== "url" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => downloadFile(item)}
            disabled={!item.url_path}
            aria-label="Download file"
            className="h-8 w-8 text-[var(--color-text-muted)] hover:bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] hover:text-[var(--color-primary)]"
          >
            <Download size={14} />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close preview"
          className="h-8 w-8 text-[var(--color-text-muted)] hover:bg-[color-mix(in_srgb,var(--color-danger)_12%,transparent)] hover:text-[var(--color-danger)]"
        >
          <X size={14} />
        </Button>
      </div>
    </div>
  );
}
