import { resolveAssetUrl } from "./resolveAssetUrl";

export function isDownloadKind(meta) {
  if (!meta) return false;
  if (meta.kind === "sheet" && meta.ext !== "csv") return true;
  if (meta.kind === "doc" && ["doc", "docx"].includes(meta.ext)) return true;
  return false;
}

export async function downloadFile(item) {
  if (!item.url_path) return;
  try {
    const res = await fetch(resolveAssetUrl(item.url_path));
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = item.title || "download";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error("Download failed:", err);
  }
}
