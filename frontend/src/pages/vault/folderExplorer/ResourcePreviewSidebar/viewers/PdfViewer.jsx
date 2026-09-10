import { resolveAssetUrl } from "../resolveAssetUrl";

export default function PdfViewer({ item }) {
  if (!item.url_path) return null;
  return (
    <iframe
      src={resolveAssetUrl(item.url_path)}
      title={item.title}
      className="min-h-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)]"
    />
  );
}
