import { ZoomIn, ZoomOut } from "lucide-react";

export default function ZoomSlider({
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled = false,
  className = "",
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className={`flex items-center gap-2 w-full ${className}`}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={disabled || value <= min}
        className="flex items-center justify-center w-7 h-7 rounded-md shrink-0 text-[var(--color-text-muted)]
          hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]
          disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
      >
        <ZoomOut size={15} />
      </button>

      <div className="relative flex-1 flex items-center h-5">
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-[var(--color-border)]" />
        <div
          className="absolute h-1.5 rounded-full bg-[var(--color-primary)]"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="zoom-slider relative w-full appearance-none bg-transparent cursor-pointer disabled:cursor-not-allowed"
        />
      </div>

      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={disabled || value >= max}
        className="flex items-center justify-center w-7 h-7 rounded-md shrink-0 text-[var(--color-text-muted)]
          hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]
          disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
      >
        <ZoomIn size={15} />
      </button>
    </div>
  );
}
