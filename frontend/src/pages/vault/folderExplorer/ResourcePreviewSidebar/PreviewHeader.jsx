import { ExternalLink, Download, HardDrive, Layers } from "lucide-react";
import { formatBytes } from "../FolderExplorerModal";
import { resolveAssetUrl } from "./resolveAssetUrl";
import { isDownloadKind, downloadFile } from "./downloadFile";
import { AccentHeaderShell, AccentIconBox, HeaderCloseButton } from "../../../../components/ui/AccentHeader";

export default function PreviewHeader({ item, meta, onClose }) {
  const { Icon, accentVar, badge } = meta;
  const sizeLabel = formatBytes(item.file_size_bytes);
  const showDownload = isDownloadKind(meta);
  const accent = `var(${accentVar})`;

  return (
    <AccentHeaderShell accent={accent}>
      <div className="relative z-10 flex min-w-0 flex-1 items-center gap-4">
        <AccentIconBox accent={accent} icon={Icon} />

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h3
            className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--color-text)]"
            title={item.title}
          >
            {item.title}
          </h3>

          <span
            className="w-fit shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide"
            style={{
              borderColor: `color-mix(in srgb, ${accent} 45%, transparent)`,
              color: accent,
              backgroundColor: `color-mix(in srgb, ${accent} 10%, transparent)`,
            }}
          >
            {badge}
          </span>
          {sizeLabel && (
            <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-md border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_5%,transparent)] px-1.5 text-[10px] font-medium leading-none text-[var(--color-text-muted)]">
              <HardDrive size={10} />
              {sizeLabel}
            </span>
          )}
          {Number.isInteger(item.page_count) && item.page_count > 0 && (
            <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-md border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_5%,transparent)] px-1.5 text-[10px] font-medium leading-none text-[var(--color-text-muted)]">
              <Layers size={10} />
              {item.page_count} {item.page_count === 1 ? "page" : "pages"}
            </span>
          )}
        </div>
      </div>

      <div className="relative z-10 flex shrink-0 items-center gap-2">
        {!showDownload && (
          <button
            type="button"
            onClick={() =>
              item.url_path &&
              window.open(resolveAssetUrl(item.url_path), "_blank", "noopener,noreferrer")
            }
            disabled={!item.url_path}
            aria-label="Open in new tab"
            className="rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] hover:text-[var(--color-primary)] disabled:pointer-events-none disabled:opacity-40"
          >
            <ExternalLink size={16} />
          </button>
        )}

        {meta.kind !== "url" && (
          <button
            type="button"
            onClick={() => downloadFile(item)}
            disabled={!item.url_path}
            aria-label="Download file"
            className="rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] hover:text-[var(--color-primary)] disabled:pointer-events-none disabled:opacity-40"
          >
            <Download size={16} />
          </button>
        )}

        <HeaderCloseButton onClose={onClose} ariaLabel="Close preview" />
      </div>
    </AccentHeaderShell>
  );
}
