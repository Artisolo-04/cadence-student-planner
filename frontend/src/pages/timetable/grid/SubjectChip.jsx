import { BookOpen, GripVertical } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";

export function SubjectChipContent({ subject, lifted }) {
  return (
    <div
      style={{ "--subject-color": subject.color }}
      className={`flex items-center gap-2.5 overflow-hidden rounded-xl border border-white/10 bg-[var(--color-surface)] px-3 py-2.5 backdrop-blur-xl transition-all duration-150 ease-out
        ${lifted ? "scale-105 shadow-[0_20px_40px_-16px_color-mix(in_srgb,var(--subject-color)_60%,transparent)]" : "shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset]"}
      `}
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ring-white/10"
        style={{ backgroundColor: "color-mix(in srgb, var(--subject-color) 18%, transparent)" }}
        aria-hidden="true"
      >
        <BookOpen size={14} style={{ color: subject.color }} />
      </span>

      <div className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold leading-snug text-[var(--color-text)]">
          {subject.name}
        </span>
        {subject.teacher && (
          <span className="block truncate text-[11px] text-[var(--color-text-muted)]">
            {subject.teacher}
          </span>
        )}
      </div>

      <GripVertical size={14} className="shrink-0 text-[var(--color-text-muted)]/40" />
    </div>
  );
}

export default function SubjectChip({ subject }) {
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
