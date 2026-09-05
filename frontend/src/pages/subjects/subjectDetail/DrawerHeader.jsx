import { X, BookOpen } from "lucide-react";

export default function DrawerHeader({ subject, onClose }) {
  return (
    <div className="relative z-10 flex shrink-0 items-start justify-between gap-3 overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-25 blur-3xl"
        style={{ backgroundColor: subject.color }}
      />

      <div className="relative z-10 flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)]"
          style={{
            backgroundImage: `linear-gradient(155deg, color-mix(in srgb, ${subject.color} 40%, black 20%) 0%, color-mix(in srgb, ${subject.color} 15%, black 45%) 100%)`,
          }}
        >
          <BookOpen size={18} style={{ color: subject.color }} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text)]">{subject.name}</h3>
          {subject.teacher && (
            <p className="text-xs text-[var(--color-text-muted)]">{subject.teacher}</p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="relative z-10 rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-text)_8%,transparent)] hover:text-[var(--color-text)]"
      >
        <X size={18} />
      </button>
    </div>
  );
}
