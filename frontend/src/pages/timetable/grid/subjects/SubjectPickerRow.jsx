import { memo } from "react";
import { BookOpen, Check } from "lucide-react";

function SubjectPickerRow({ subject, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        "--subject-color": subject.color,
        backgroundImage:
          "linear-gradient(155deg, color-mix(in srgb, var(--subject-color) 20%, color-mix(in srgb, var(--color-accent) 8%, var(--color-surface) 92%)) 0%, color-mix(in srgb, var(--subject-color) 10%, color-mix(in srgb, var(--color-accent) 6%, var(--color-surface) 94%)) 100%)",
      }}
      className={`group relative flex min-h-[52px] items-center gap-3 overflow-hidden rounded-lg border px-3 py-2 text-left backdrop-blur-2xl backdrop-saturate-150 transition-[background-color,border-color,box-shadow] duration-200 ease-out
        focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]
        ${
          selected
            ? "border-[var(--color-primary)] border-2 shadow-[0_24px_48px_-16px_color-mix(in_srgb,var(--subject-color)_65%,transparent)]"
            : "border-white/15 shadow-[0_1px_0_0_rgba(255,255,255,0.12)_inset,0_10px_24px_-16px_rgba(0,0,0,0.45),0_0_14px_-6px_color-mix(in_srgb,var(--subject-color)_55%,transparent)] hover:border-white/25"
        }
      `}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-y-4 -left-8 w-1/2 -skew-x-12 bg-gradient-to-r from-white/[0.12] to-transparent opacity-70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.08] via-transparent to-black/[0.06]"
      />

      <span
        className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/20 backdrop-blur-md"
        style={{
          backgroundImage: `linear-gradient(155deg, color-mix(in srgb, ${subject.color} 35%, white 10%) 0%, color-mix(in srgb, ${subject.color} 18%, transparent) 100%)`,
          boxShadow:
            "0 1px 0 0 rgba(255,255,255,0.25) inset, 0 -1px 2px 0 rgba(0,0,0,0.15) inset, 0 2px 6px -2px rgba(0,0,0,0.3)",
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-md bg-gradient-to-b from-white/25 to-transparent"
        />
        <BookOpen size={15} style={{ color: subject.color }} className="relative z-10 drop-shadow-sm" />
      </span>

      <span className="relative z-10 min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-[var(--color-text)]">
          {subject.name}
        </span>
        {subject.teacher && (
          <span className="block truncate text-xs text-[var(--color-text-muted)]">
            {subject.teacher}
          </span>
        )}
      </span>

      {selected && (
        <Check size={16} className="relative z-10 shrink-0 text-[var(--color-primary)]" />
      )}
    </button>
  );
}

export default memo(SubjectPickerRow);
