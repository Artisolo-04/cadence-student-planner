import { API_ORIGIN } from "../../../../lib/api";

export function resolveAssetUrl(urlPath) {
  if (!urlPath) return "";
  if (/^https?:\/\//i.test(urlPath)) return urlPath;
  const path = urlPath.startsWith("/") ? urlPath : `/${urlPath}`;
  return `${API_ORIGIN}${path}`;
}
