export default function SegmentedControl({
  options,
  value,
  onChange,
  variant = "labeled",
  tone = "solid",
  size = "md",
  ariaLabel,
  className = "",
}) {
  const heightClass = size === "sm" ? "h-8" : "h-9";
  const soft = tone === "soft";

  const trackClass = soft
    ? "rounded-lg border border-[var(--color-line)] bg-[var(--color-fill-1)]"
    : `${variant === "pill" ? "rounded-full" : "rounded-lg"} border border-[var(--color-border)] bg-[var(--color-surface-alt)]`;

  const activeClass = soft
    ? "bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] text-[var(--color-primary)]"
    : "bg-[var(--color-primary)] text-[var(--color-primary-fg)] shadow-sm";

  const idleClass = soft
    ? "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]";

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex ${heightClass} items-center gap-1 ${trackClass} p-1 ${className}`}
    >
      {options.map(({ id, label, Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={variant === "icon" ? label : undefined}
            title={variant === "icon" ? label : undefined}
            onClick={() => onChange(id)}
            className={`flex h-full items-center justify-center gap-1.5 ${
              soft ? "rounded-md" : variant === "pill" ? "rounded-full" : "rounded-md"
            } text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)] ${
              variant === "icon" ? "aspect-square px-0" : "px-3"
            } ${active ? activeClass : idleClass}`}
          >
            {Icon && <Icon size={14} strokeWidth={2.25} />}
            {variant === "labeled" && label}
          </button>
        );
      })}
    </div>
  );
}
