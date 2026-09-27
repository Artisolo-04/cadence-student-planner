import {
  FolderOpen, ArrowRight, File, FileText, FileSpreadsheet, FileType, Link2, Image as ImageIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getResourceMeta } from "../vault/resourceMeta";
import { stripExtension } from "../vault/components/AddVaultItemForm/utils";
import { formatBytes } from "../vault/folderExplorer/components/FolderExplorerModal/utils";
import { recentFiles, timeAgo } from "./vaultAccess";

const ICON_BY_BADGE = {
  PDF: FileText, TXT: FileText, MD: FileText,
  DOCX: FileType, DOC: FileType,
  XLSX: FileSpreadsheet, XLS: FileSpreadsheet, CSV: FileSpreadsheet,
  PNG: ImageIcon, JPG: ImageIcon, JPEG: ImageIcon, WEBP: ImageIcon,
  URL: Link2, LINK: Link2,
};

function VaultFileCard({ item, onOpen }) {
  const meta = getResourceMeta(item);
  const accent = `var(${meta.accentVar})`;
  const Icon = meta.kind === "url" ? Link2 : ICON_BY_BADGE[String(meta.badge).toUpperCase()] || File;
  const size = meta.kind !== "url" ? formatBytes(item.file_size_bytes) : null;
  const footer = [timeAgo(item), size].filter(Boolean).join(" · ");

  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 flex-col justify-between rounded-lg border px-3 py-2.5"
      style={{
        borderColor: `color-mix(in srgb, ${accent} 22%, var(--color-border))`,
        backgroundImage: `linear-gradient(135deg, color-mix(in srgb, ${accent} 10%, transparent) 0%, transparent 70%)`,
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border"
          style={{
            color: accent,
            borderColor: `color-mix(in srgb, ${accent} 40%, transparent)`,
            backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`,
          }}
        >
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--color-text)]" title={item.title}>
            {stripExtension(item.title)}
          </p>
          <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
            {item.folder_name || item.subject_name || "Vault"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-2">
        <span className="truncate font-mono text-[10px] text-[var(--color-text-muted)]">{footer}</span>
        <button
          type="button"
          onClick={() => onOpen?.(item)}
          className="flex shrink-0 items-center gap-1 rounded border border-white/10 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]"
        >
          VIEW
          <ArrowRight size={10} />
        </button>
      </div>
    </div>
  );
}

export default function VaultQuickAccessCard({ files = [], loading, onOpen }) {
  const navigate = useNavigate();
  const items = recentFiles(files, 3);

  return (
    <div
      className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 p-5 backdrop-blur-xl"
      style={{
        backgroundImage:
          "linear-gradient(150deg, color-mix(in srgb, var(--color-accent) 12%, transparent) 0%, color-mix(in srgb, var(--color-primary) 6%, transparent) 60%, transparent 100%)",
      }}
    >
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">
            <FolderOpen size={12} />
            Quick Vault Access
          </div>
          <button
            type="button"
            onClick={() => navigate("/vault")}
            className="flex items-center gap-1 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]"
          >
            Open vault
            <ArrowRight size={12} />
          </button>
        </div>

        {loading ? (
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">Loading…</p>
        ) : items.length === 0 ? (
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">No files in your Vault yet.</p>
        ) : (
          <div className="mt-4 flex min-h-0 flex-1 flex-col gap-2.5 border-t border-white/10 pt-3.5">
            {items.map((item) => (
              <VaultFileCard key={item.id} item={item} onOpen={onOpen} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
