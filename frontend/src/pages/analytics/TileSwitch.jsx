// Compact header switch. Same border, radius and teal tint as the expand button.
export default function TileSwitch({ options, value, onChange, ariaLabel }) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex h-6 items-center gap-0.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-fill-1)] p-0.5"
    >
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            title={o.title ?? o.label}
            aria-pressed={active}
            onClick={() => onChange(o.id)}
            className={`h-full rounded-md px-2 text-[10px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)] ${
              active
                ? "bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] text-[var(--color-primary)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
