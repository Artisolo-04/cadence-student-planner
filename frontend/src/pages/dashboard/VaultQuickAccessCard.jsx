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
      className="flex min-h-0 min-w-0 flex-1 items-center gap-3 rounded-md px-3 py-1.5"
      style={{
        backgroundImage: `linear-gradient(135deg, color-mix(in srgb, ${accent} 10%, transparent) 0%, transparent 70%)`,
      }}
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded"
        style={{
          color: accent,
          backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`,
        }}
      >
        <Icon size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--color-text)]" title={item.title}>
          {stripExtension(item.title)}
        </p>
        <p className="truncate text-xs text-[var(--color-text-muted)]">
          {[item.folder_name || item.subject_name || "Vault", footer].filter(Boolean).join(" · ")}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onOpen?.(item)}
        className="flex shrink-0 items-center gap-1 rounded border border-white/10 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]"
      >
        VIEW
        <ArrowRight size={10} />
      </button>
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
          "linear-gradient(150deg, color-mix(in srgb, var(--color-primary) 18%, transparent) 0%, color-mix(in srgb, var(--color-accent) 8%, transparent) 60%, transparent 100%)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: "var(--color-primary)" }}
      />

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
          <div className="mt-4 flex min-h-0 flex-1 flex-col justify-between gap-1.5 border-t border-white/10 pt-3.5">
            {items.map((item) => (
              <VaultFileCard key={item.id} item={item} onOpen={onOpen} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
