import { memo } from "react";
import { GripVertical } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";

export function SubjectChipContent({ subject, lifted, size, bare }) {
  return (
    <div
      style={{
        "--subject-color": subject.color,
        backgroundImage:
          "linear-gradient(155deg, color-mix(in srgb, var(--subject-color) 68%, color-mix(in srgb, var(--color-primary) 16%, black 16%)) 0%, color-mix(in srgb, var(--subject-color) 64%, color-mix(in srgb, var(--color-primary) 16%, black 20%)) 55%, color-mix(in srgb, var(--subject-color) 60%, color-mix(in srgb, var(--color-primary) 16%, black 24%)) 100%)",
        ...(size ? { width: size.width, height: size.height } : null),
      }}
      className={`group relative flex items-center gap-2.5 overflow-hidden rounded-md ${
        bare ? "border-0" : "border-t border-white/15"
      } ${
        size ? "justify-center p-3" : "py-2.5 pl-3.5 pr-3"
      } transition-[box-shadow,transform${size ? ",width,height" : ""}] duration-200 ease-out ${
        lifted
          ? "scale-105 shadow-[0_24px_48px_-16px_color-mix(in_srgb,var(--subject-color)_65%,transparent)]"
          : ""
      }`}
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

      <div className={`relative z-10 min-w-0 flex-1 ${size ? "text-center" : ""}`}>
        <span className="block truncate text-[13px] font-bold leading-snug text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
          {subject.name}
        </span>
        {subject.teacher && (
          <span className="block truncate text-[11px] font-semibold text-white/85">
            {subject.teacher}
          </span>
        )}
      </div>

      {!size && (
        <GripVertical size={14} className="relative z-10 shrink-0 text-white/50" />
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
