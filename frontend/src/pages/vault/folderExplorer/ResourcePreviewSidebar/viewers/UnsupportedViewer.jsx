import { FileWarning, ExternalLink, Download } from "lucide-react";
import Button from "../../../../../components/ui/Button";
import { resolveAssetUrl } from "../resolveAssetUrl";
import { isDownloadKind, downloadFile } from "../downloadFile";

export default function UnsupportedViewer({ item, meta }) {
  const showDownload = isDownloadKind(meta);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_3%,var(--color-surface))] p-6 text-center">
      <FileWarning size={26} className="text-[var(--color-text-muted)]" />
      <p className="max-w-[280px] text-xs text-[var(--color-text-muted)]">
        {showDownload
          ? "This file type doesn't support an inline preview yet. Download it instead."
          : "This file type doesn't support an inline preview yet. Open it in a new tab instead."}
      </p>
      <Button
        variant="secondary"
        onClick={showDownload ? () => downloadFile(item) : () => item.url_path && window.open(resolveAssetUrl(item.url_path), "_blank", "noopener,noreferrer")}
        disabled={!item.url_path}
        className="gap-1.5 px-3 py-2 text-xs"
      >
        {showDownload ? <Download size={13} /> : <ExternalLink size={13} />}
        {showDownload ? "Download" : "Open in new tab"}
      </Button>
    </div>
  );
}
