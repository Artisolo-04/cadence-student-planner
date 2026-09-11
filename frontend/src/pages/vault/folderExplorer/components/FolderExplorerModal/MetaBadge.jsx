export default function MetaBadge({ icon: Icon, children }) {
  return (
    <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-md border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_5%,transparent)] px-1.5 text-[10px] font-medium leading-none text-[var(--color-text-muted)]">
      {Icon && <Icon size={10} className="shrink-0" />}
      <span className="truncate">{children}</span>
    </span>
  );
}
