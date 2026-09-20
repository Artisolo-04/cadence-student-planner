export default function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-comfy py-snug text-xs font-medium transition-colors duration-150 ${
        active
          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
          : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-white/20 hover:text-[var(--color-text)]"
      }`}
    >
      {children}
    </button>
  );
}
