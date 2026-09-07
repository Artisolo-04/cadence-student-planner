export default function SegmentedControl({
  options,
  value,
  onChange,
  variant = "labeled",
  size = "md",
  ariaLabel,
  className = "",
}) {
  const heightClass = size === "sm" ? "h-8" : "h-9";

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex ${heightClass} items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-1 ${className}`}
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
            className={`flex h-full items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-colors duration-150 ${
              variant === "icon" ? "aspect-square px-0" : "px-3"
            } ${
              active
                ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)] shadow-sm"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
            }`}
          >
            {Icon && <Icon size={14} strokeWidth={2.25} />}
            {variant === "labeled" && label}
          </button>
        );
      })}
    </div>
  );
}
