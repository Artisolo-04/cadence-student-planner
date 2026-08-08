import { Check } from "lucide-react";

const PRESET_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#6366f1",
];

export default function ColorSwatchPicker({ label, value, onChange }) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
      )}
      <div className="grid grid-cols-[repeat(10,minmax(0,max-content))] w-full gap-y-2 justify-between items-center">
        {PRESET_COLORS.map((color) => {
          const selected = value === color;
          return (
            <button
              key={color}
              type="button"
              onClick={() => onChange(color)}
              aria-label={color}
              aria-pressed={selected}
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-150
                focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]
                ${selected ? "ring-2 ring-offset-2 ring-offset-[var(--color-surface)] ring-[var(--color-primary)]" : ""}`}
              style={{ backgroundColor: color }}
            >
              {selected && <Check size={16} className="text-white" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
