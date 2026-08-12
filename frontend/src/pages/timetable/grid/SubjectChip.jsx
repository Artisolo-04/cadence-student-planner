import { memo } from "react";
import { GripVertical } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";

export function SubjectChipContent({ subject, lifted, size }) {
  return (
    <div
      style={{
        "--subject-color": subject.color,
        backgroundImage:
          "linear-gradient(155deg, color-mix(in srgb, var(--subject-color) 20%, color-mix(in srgb, var(--color-accent) 8%, var(--color-surface) 92%)) 0%, color-mix(in srgb, var(--subject-color) 10%, color-mix(in srgb, var(--color-accent) 6%, var(--color-surface) 94%)) 100%)",
        ...(size ? { width: size.width, height: size.height } : null),
      }}
      className={`group relative flex items-center gap-2.5 overflow-hidden rounded-md border backdrop-blur-2xl backdrop-saturate-150 py-2.5 pl-3.5 pr-3 transition-[background-color,border-color,box-shadow] duration-200 ease-out
        ${size ? "justify-center" : ""}
        ${
          lifted
            ? "scale-105 border-white/30 shadow-[0_24px_48px_-16px_color-mix(in_srgb,var(--subject-color)_65%,transparent)]"
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

      <div className="relative z-10 min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold leading-snug text-[var(--color-text)]">
          {subject.name}
        </span>
        {subject.teacher && (
          <span className="block truncate text-[11px] text-[var(--color-text-muted)]">
            {subject.teacher}
          </span>
        )}
      </div>

      {!size && (
        <GripVertical size={14} className="relative z-10 shrink-0 text-[var(--color-text-muted)]/40" />
      )}
    </div>
  );
}

function SubjectChip({ subject }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `subject-${subject.id}`,
    data: {
      subjectId: subject.id,
      subjectName: subject.name,
      subjectColor: subject.color,
      subjectTeacher: subject.teacher,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`touch-none transition-opacity duration-150 ${
        isDragging ? "cursor-grabbing opacity-30" : "cursor-grab hover:opacity-95"
      }`}
    >
      <SubjectChipContent subject={subject} />
    </div>
  );
}

export default memo(SubjectChip);
