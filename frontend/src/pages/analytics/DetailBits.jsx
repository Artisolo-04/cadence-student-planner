export function Pill({ children, color = "var(--color-text-muted)" }) {
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium"
      style={{
        borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
        color,
        backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
      }}
    >
      {children}
    </span>
  );
}

export function SectionTitle({ children }) {
  return <h3 className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">{children}</h3>;
}

export function Stat({ label, value, color }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-[var(--color-line)] bg-[var(--color-fill-1)] px-3 py-2.5">
      <span className="text-[11px] text-[var(--color-text-muted)]">{label}</span>
      <span
        className="font-mono text-xl font-semibold tabular-nums text-[var(--color-text)]"
        style={color ? { color } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

export function Empty({ children }) {
  return <p className="text-sm text-[var(--color-text-muted)]">{children}</p>;
}
