import { TileLabel } from "./AnalyticsTile";

const TILE_GRADIENT =
  "linear-gradient(150deg, color-mix(in srgb, var(--color-tint) 14%, transparent) 0%, transparent 70%)";

export default function StatTile({ icon, label, value, sub, valueColor }) {
  return (
    <div
      className="flex flex-col gap-2 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 backdrop-blur-xl"
      style={{ backgroundImage: TILE_GRADIENT }}
    >
      <TileLabel icon={icon}>{label}</TileLabel>
      <span
        className="text-3xl font-bold leading-none tabular-nums text-[var(--color-text)]"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </span>
      <span className="truncate text-xs text-[var(--color-text-muted)]">{sub}</span>
    </div>
  );
}
