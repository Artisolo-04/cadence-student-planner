import { LINK_RULES } from "./linkRules";
import { FILE_RULES } from "./fileRules";
import { LINK_FALLBACK, FILE_FALLBACK } from "./fallback";

function safeHostname(rawUrl) {
  try {
    return new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function getLinkBrand(rawUrl) {
  const hostname = safeHostname(rawUrl);
  if (!hostname) return null;
  const rule = LINK_RULES.find((r) => r.test(hostname));
  if (!rule) return null;
  const { test, ...brand } = rule;
  return brand;
}

export function deriveResourceType(rawUrl) {
  return /\.pdf(?:\?.*)?$/i.test(rawUrl.trim()) ? "pdf" : "link";
}

export function getResourceMeta(item) {
  const type = (item.resource_type || "").toLowerCase();
  const source = item.url_path || item.title || "";
  const extMatch = source.match(/\.([a-z0-9]+)(?:\?.*)?$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : "";

  if (type === "link" || (!ext && /^https?:\/\//i.test(source))) {
    const brand = getLinkBrand(source);
    if (brand) return { kind: "url", ...brand, ext };
    return { ...LINK_FALLBACK, ext };
  }

  const rule = FILE_RULES.find((r) => r.extensions.includes(ext));
  if (rule) {
    const { extensions, ...meta } = rule;
    return { ...meta, badge: meta.badge || ext.toUpperCase(), ext };
  }

  return { ...FILE_FALLBACK, badge: ext ? ext.toUpperCase() : "FILE", ext };
}
