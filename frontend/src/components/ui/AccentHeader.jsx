import { X } from "lucide-react";

export function AccentHeaderShell({ accent, children, className = "" }) {
  return (
    <div
      className={`relative z-10 flex h-[76px] shrink-0 items-center justify-between gap-4 overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-25 blur-3xl"
        style={{ backgroundColor: accent }}
      />
      {children}
    </div>
  );
}

export function AccentIconBox({ accent, icon: Icon, size = 18 }) {
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)]"
      style={{
        backgroundImage: `linear-gradient(155deg, color-mix(in srgb, ${accent} 40%, black 20%) 0%, color-mix(in srgb, ${accent} 15%, black 45%) 100%)`,
      }}
    >
      <Icon size={size} style={{ color: accent }} />
    </span>
  );
}

export function HeaderCloseButton({ onClose, ariaLabel = "Close", size = 18 }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label={ariaLabel}
      className="relative z-10 shrink-0 rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-text)_8%,transparent)] hover:text-[var(--color-text)]"
    >
      <X size={size} />
    </button>
  );
}
