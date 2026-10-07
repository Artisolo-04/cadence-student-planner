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
          "linear-gradient(155deg, color-mix(in srgb, var(--subject-color) 68%, color-mix(in srgb, var(--color-primary) 16%, black 16%)) 0%, color-mix(in srgb, var(--subject-color) 64%, color-mix(in srgb, var(--color-primary) 16%, black 20%)) 55%, color-mix(in srgb, var(--subject-color) 60%, color-mix(in srgb, var(--color-primary) 16%, black 24%)) 100%)",
      }}
      className={`group relative flex min-h-[52px] items-center gap-3 overflow-hidden rounded-lg px-3 py-2 text-left transition-[box-shadow,filter] duration-200 ease-out
        focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]
        ${
          selected
            ? "border-2 border-[var(--color-primary)] shadow-[0_24px_48px_-16px_color-mix(in_srgb,var(--subject-color)_65%,transparent)]"
            : "border-t border-white/15 hover:brightness-110"
        }
      `}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 opacity-40"
        style={{
          backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 100%)",
        }}
      />

      <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/25 bg-white/20">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-md bg-gradient-to-b from-white/25 to-transparent"
        />
        <BookOpen size={15} className="relative z-10 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]" />
      </span>

      <span className="relative z-10 min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
          {subject.name}
        </span>
        {subject.teacher && (
          <span className="block truncate text-xs font-semibold text-white/85">
            {subject.teacher}
          </span>
        )}
      </span>

      {selected && (
        <Check size={16} className="relative z-10 shrink-0 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]" />
      )}
    </button>
  );
}

export default memo(SubjectPickerRow);
