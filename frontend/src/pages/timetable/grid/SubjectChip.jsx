import { GripVertical } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";

export function SubjectChipContent({ subject, lifted, size }) {
  return (
    <div
      style={{
        "--subject-color": subject.color,
        ...(size ? { width: size.width, height: size.height } : null),
      }}
      className={`relative flex items-center gap-2.5 overflow-hidden rounded-md border bg-[var(--color-surface-alt)] py-2.5 pl-3.5 pr-3 transition-all duration-150 ease-out
        ${size ? "justify-center" : ""}
        ${
          lifted
            ? "scale-105 border-[color-mix(in_srgb,var(--subject-color)_45%,var(--color-border))] shadow-[0_20px_40px_-16px_color-mix(in_srgb,var(--subject-color)_60%,transparent)]"
            : "border-[var(--color-border)] shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]"
        }
      `}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: "var(--subject-color)" }}
      />

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

      {!size && <GripVertical size={14} className="shrink-0 text-[var(--color-text-muted)]/40" />}
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
