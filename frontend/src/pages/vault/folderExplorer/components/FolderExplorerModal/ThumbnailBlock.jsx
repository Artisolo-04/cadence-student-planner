export default function ThumbnailBlock({ meta }) {
  const { kind, Icon, accentVar, badge } = meta;

  return (
    <div className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-lg border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_3%,var(--color-surface))]">
      {(kind === "pdf" || kind === "sheet" || kind === "doc" || kind === "txt" || kind === "generic") && (
        <span
          className="select-none text-2xl font-extrabold tracking-tight"
          style={{ color: `var(${accentVar})` }}
        >
          {badge}
        </span>
      )}

      {kind === "url" && (
        <span
          className="flex h-12 w-12 items-center justify-center rounded-lg"
          style={{ backgroundColor: `color-mix(in srgb, var(${accentVar}) 16%, transparent)` }}
        >
          <Icon size={26} strokeWidth={2} style={{ color: `var(${accentVar})` }} />
        </span>
      )}
    </div>
  );
}
