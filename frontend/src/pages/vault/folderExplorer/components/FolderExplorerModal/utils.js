import { getResourceMeta } from "../../../resourceMeta";

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
