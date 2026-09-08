import { Folder, X } from "lucide-react";

export default function ExplorerHeader({ title, accent, onClose }) {
  return (
    <div className="relative z-10 flex shrink-0 items-center justify-between gap-4 overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-25 blur-3xl"
        style={{ backgroundColor: accent }}
      />

      <div className="relative z-10 flex min-w-0 items-center gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)]"
          style={{
            backgroundImage: `linear-gradient(155deg, color-mix(in srgb, ${accent} 40%, black 20%) 0%, color-mix(in srgb, ${accent} 15%, black 45%) 100%)`,
          }}
        >
          <Folder size={18} style={{ color: accent }} />
        </span>
        <h3 className="min-w-0 truncate text-sm font-semibold text-[var(--color-text)]">
          {title}
        </h3>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="relative z-10 shrink-0 rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-text)_8%,transparent)] hover:text-[var(--color-text)]"
      >
        <X size={18} />
      </button>
    </div>
  );
}
