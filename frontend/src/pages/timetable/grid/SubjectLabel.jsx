import { useEffect, useState, memo } from "react";
import { useDraggable } from "@dnd-kit/core";

function LandingPulse({ color }) {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-[inherit] transition-all duration-500 ease-out"
      style={{
        backgroundColor: color,
        opacity: settled ? 0 : 0.35,
        transform: settled ? "scale(1.2)" : "scale(1)",
      }}
    />
  );
}

function SubjectLabel({
  entry,
  groupTag,
  showTeacher,
  showRoom,
  pulseColor,
  dimmed,
  slotId,
  dayOfWeek,
  dragGroupTag,
  isEditMode,
}) {
  const [popped, setPopped] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setPopped(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const teacherText = showTeacher && entry.subject_teacher ? entry.subject_teacher : null;
  const roomText = showRoom && entry.room ? entry.room : null;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `cell-subject::${slotId}-${dayOfWeek}::${dragGroupTag || "all"}`,
    disabled: !isEditMode,
    data: {
      subjectId: entry.subject_id,
      subjectName: entry.subject_name,
      subjectColor: entry.subject_color,
      subjectTeacher: entry.subject_teacher,
      source: "cell",
      sourceSlotId: slotId,
      sourceDayOfWeek: dayOfWeek,
      sourceGroupTag: dragGroupTag || "all",
      sourceRoom: entry.room || null,
    },
  });

  return (
    <span
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      key={`${entry.subject_id}-${groupTag || "all"}-${entry.room || ""}`}
      style={{
        "--subject-color": entry.subject_color,
        backgroundImage:
          "linear-gradient(155deg, color-mix(in srgb, var(--subject-color) 26%, color-mix(in srgb, var(--color-accent) 8%, var(--color-surface) 92%)) 0%, color-mix(in srgb, var(--subject-color) 14%, color-mix(in srgb, var(--color-accent) 6%, var(--color-surface) 94%)) 55%, color-mix(in srgb, var(--subject-color) 7%, var(--color-surface) 93%) 100%)",
        opacity: isDragging ? 0.3 : dimmed ? undefined : popped ? 1 : 0,
        transform: popped ? "scale(1)" : "scale(0.65)",
        transitionProperty: "transform, opacity",
        transitionDuration: "220ms",
        transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        transitionDelay: pulseColor ? "40ms" : "0ms",
      }}
      className={`group/label absolute inset-0 flex flex-col justify-center overflow-hidden border-t border-white/15 px-2 py-1.5 shadow-[0_1px_0_0_rgba(255,255,255,0.12)_inset,inset_0_0_0_1px_rgba(255,255,255,0.08),0_0_16px_-4px_color-mix(in_srgb,var(--subject-color)_65%,transparent)] backdrop-blur-md backdrop-saturate-150 transition-opacity duration-150 hover:opacity-90 ${
        dimmed ? "opacity-60" : ""
      } ${isEditMode ? "touch-none cursor-grab active:cursor-grabbing" : ""}`}
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
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-y-4 -left-8 w-1/2 -skew-x-12 bg-gradient-to-r from-white/[0.12] to-transparent opacity-70"
      />
      {pulseColor && <LandingPulse color={pulseColor} />}

      {groupTag && (
        <span className="absolute left-1 top-1 z-10 rounded bg-black/30 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white/90">
          {groupTag}
        </span>
      )}

      {roomText && (
        <span className="absolute right-1 top-1 z-10 max-w-[45%] truncate rounded bg-black/30 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white/90">
          {roomText}
        </span>
      )}

      <span className="relative z-10 flex-1 flex items-center justify-center px-1 text-center text-[12px] font-bold leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
        <span className="max-w-full truncate">{entry.subject_name}</span>
      </span>

      {teacherText && (
        <span className="relative z-10 truncate text-left text-[9px] font-semibold leading-tight text-white/85">
          {teacherText}
        </span>
      )}
    </span>
  );
}

export default memo(SubjectLabel);
