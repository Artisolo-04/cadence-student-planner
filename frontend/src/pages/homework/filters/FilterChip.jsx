export default function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)] ${
        active
          ? "border-[var(--color-primary)]/60 bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
          : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
      }`}
    >
      {children}
    </button>
  );
}
