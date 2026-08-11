import { useEffect, useState } from "react";
import { useDroppable, useDndContext } from "@dnd-kit/core";
import { getCellDisplay } from "./timetableGridUtils";

function getDisplayForView(entriesForCell, groupVisibility, myGroup) {
  const display = getCellDisplay(entriesForCell);

  if (display.mode !== "split" || groupVisibility === "both" || !myGroup) {
    return display;
  }

  const groupTag =
    groupVisibility === "my"
      ? myGroup
      : myGroup === "g1"
        ? "g2"
        : "g1";

  return {
    mode: "filtered",
    entry: groupTag === "g1" ? display.g1Entry : display.g2Entry,
    groupTag,
  };
}

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

function SubjectLabel({ entry, groupTag, showTeacher, showRoom, pulseColor, dimmed }) {
  const [popped, setPopped] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setPopped(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const teacherText = showTeacher && entry.subject_teacher ? entry.subject_teacher : null;
  const roomText = showRoom && entry.room ? entry.room : null;

  return (
    <span
      key={`${entry.subject_id}-${groupTag || "all"}-${entry.room || ""}`}
      style={{
        "--subject-color": entry.subject_color,
        backgroundImage:
          "linear-gradient(155deg, color-mix(in srgb, var(--subject-color) 55%, var(--color-surface) 45%) 0%, color-mix(in srgb, var(--subject-color) 26%, var(--color-surface) 74%) 55%, color-mix(in srgb, var(--subject-color) 14%, var(--color-surface) 86%) 100%)",
        opacity: dimmed ? undefined : popped ? 1 : 0,
        transform: popped ? "scale(1)" : "scale(0.65)",
        transitionProperty: "transform, opacity",
        transitionDuration: "220ms",
        transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        transitionDelay: pulseColor ? "40ms" : "0ms",
      }}
      className={`absolute inset-0 flex flex-col justify-center overflow-hidden border-t border-white/15 px-2 py-1.5 shadow-[0_1px_0_0_rgba(255,255,255,0.12)_inset,inset_0_0_0_1px_color-mix(in_srgb,var(--subject-color)_45%,transparent),0_0_16px_-4px_color-mix(in_srgb,var(--subject-color)_70%,transparent)] backdrop-blur-md transition-opacity duration-150 hover:opacity-90 ${
        dimmed ? "opacity-60" : ""
      }`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 opacity-40"
        style={{
          backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 100%)",
        }}
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

function DropZone({
  id,
  disabled,
  isFilled,
  children,
  className,
  onClick,
  highlightClass,
}) {
  const { setNodeRef, isOver, active } = useDroppable({ id, disabled });
  const isHighlighted = Boolean(active) && !disabled && isOver;

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={`relative transition-colors duration-150 ease-out ${className || ""}`}
    >
      {isHighlighted && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute z-30 ${highlightClass || "inset-0"} bg-orange-400/10 ring-2 ring-inset ring-orange-400 shadow-[inset_0_0_0_1px_rgba(251,146,60,0.25)]`}
        />
      )}
      {children}
    </div>
  );
}


function DragIntentTargets({ cellKey }) {
  const g1 = useDroppable({ id: `cell::${cellKey}::g1` });
  const all = useDroppable({ id: `cell::${cellKey}::all` });
  const g2 = useDroppable({ id: `cell::${cellKey}::g2` });

  const activeZone = g1.isOver ? "g1" : g2.isOver ? "g2" : all.isOver ? "all" : null;

  const highlightClassByZone = {
    g1: "inset-y-0 left-0 w-1/2",
    all: "inset-0",
    g2: "inset-y-0 right-0 w-1/2",
  };

  return (
    <div className="absolute inset-0 z-20">
      <div className="grid h-full grid-cols-[1fr_3fr_1fr]">
        <div ref={g1.setNodeRef} className="h-full" />
        <div ref={all.setNodeRef} className="h-full" />
        <div ref={g2.setNodeRef} className="h-full" />
      </div>
      {activeZone && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute z-30 ${highlightClassByZone[activeZone]} bg-orange-400/10 ring-2 ring-inset ring-orange-400 shadow-[inset_0_0_0_1px_rgba(251,146,60,0.25)]`}
        />
      )}
    </div>
  );
}

export default function TimetableCell({
  entriesForCell,
  isToday,
  isLive,
  isLastCol,
  isLastRow,
  onOpen,
  myGroup,
  viewOptions,
  slotId,
  dayOfWeek,
  isEditMode,
  landing,
}) {
  const {
    groupVisibility = "both",
    showTeacher = false,
    showRoom = false,
  } = viewOptions || {};

  const display = getDisplayForView(
    entriesForCell,
    isEditMode ? "both" : groupVisibility,
    myGroup
  );
  const isEmpty =
    display.mode === "empty" ||
    (display.mode === "filtered" && !display.entry);

  const cellKey = `${slotId}-${dayOfWeek}`;
  const { active: activeDrag } = useDndContext();
  const isDragging = Boolean(activeDrag);

  function pulseFor(groupTag) {
    if (!landing) return null;
    return landing.key === `${cellKey}-${groupTag}` ? landing.color : null;
  }


  return (
    <td
      data-cell-key={cellKey}
      className={`group relative overflow-hidden border-[var(--color-border)] ${
        isLastCol ? "" : "border-r"
      } ${isLastRow ? "" : "border-b"} p-0 text-center align-middle transition-all duration-200 ease-out ${
        isToday && isEmpty ? "bg-[var(--color-accent)]/[0.05]" : ""
      }`}
    >
      {isLive && (
        <span className="pointer-events-none absolute inset-1 z-10 rounded-lg ring-1 ring-[var(--color-accent)]/50 shadow-[0_0_0_3px_rgba(var(--color-accent-rgb),0.08)]" />
      )}

      {display.mode === "split" ? (
        <div className="flex h-full min-h-[56px] divide-x divide-[var(--color-border)]">
          <DropZone
            id={`cell::${cellKey}::g1`}
            disabled={!isEditMode || isDragging}
            isFilled={Boolean(display.g1Entry)}
            className="group/half flex-1 cursor-pointer"
            onClick={() => onOpen("g1")}
          >
            {display.g1Entry ? (
              <SubjectLabel
                entry={display.g1Entry}
                showTeacher={showTeacher}
                showRoom={showRoom}
                pulseColor={pulseFor("g1")}
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]/40 opacity-0 transition-opacity duration-200 group-hover/half:opacity-100">
                G1
              </span>
            )}
          </DropZone>

          <DropZone
            id={`cell::${cellKey}::g2`}
            disabled={!isEditMode || isDragging}
            isFilled={Boolean(display.g2Entry)}
            className="group/half flex-1 cursor-pointer"
            onClick={() => onOpen("g2")}
          >
            {display.g2Entry ? (
              <SubjectLabel
                entry={display.g2Entry}
                showTeacher={showTeacher}
                showRoom={showRoom}
                pulseColor={pulseFor("g2")}
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]/40 opacity-0 transition-opacity duration-200 group-hover/half:opacity-100">
                G2
              </span>
            )}
          </DropZone>
        </div>
      ) : (
        <DropZone
          id={`cell::${cellKey}::${display.groupTag || "all"}`}
          disabled={!isEditMode || isDragging}
          isFilled={!isEmpty}
          className={`flex h-full min-h-[56px] cursor-pointer items-center justify-center ${
            isEmpty ? "hover:bg-[var(--color-surface-alt)]" : ""
          }`}
          onClick={() => onOpen(display.groupTag || "all")}
        >
          {display.mode === "full" || display.mode === "filtered" ? (
            display.entry ? (
              <SubjectLabel
                entry={display.entry}
                groupTag={display.mode === "filtered" ? display.groupTag : null}
                showTeacher={showTeacher}
                showRoom={showRoom}
                pulseColor={pulseFor(display.groupTag || "all")}
              />
            ) : (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]/40">
                {display.groupTag?.toUpperCase()}
              </span>
            )
          ) : (
            <span className="h-1 w-1 rounded-full bg-[var(--color-text-muted)]/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          )}

        </DropZone>
      )}


      {isEditMode && isDragging && (
        <DragIntentTargets cellKey={cellKey} />
      )}
    </td>
  );
}
