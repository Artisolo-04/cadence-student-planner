import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { sortDaysByWeekOrder } from "../../../lib/days";
import api from "../../../lib/api";
import SubjectPickerModal from "./SubjectPickerModal";
import TimetableCell from "./TimetableCell";
import SubjectsDrawer from "./SubjectsDrawer";
import { SubjectChipContent } from "./SubjectChip";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { toMinutes, entryKey, findEntryForGroup, planEntrySave } from "./timetableGridUtils";

const WEEKDAY_FULL = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

function lockPageScroll() {
  document.documentElement.style.overflow = "hidden";
}
function unlockPageScroll() {
  document.documentElement.style.overflow = "";
}

function getFullCellRect(over) {
  if (!over) return null;
  const cellKey = over.id.split("::")[1];
  if (!cellKey) return null;
  const el = document.querySelector(`[data-cell-key="${cellKey}"]`);
  return el ? el.getBoundingClientRect() : null;
}

function createMagneticModifier({ lerpFactor = 0.3, fitPadding = 0.2, maxLockedScale = 0.85 } = {}) {
  let smoothedX = null;
  let smoothedY = null;
  let smoothedScale = 1;
  let lastActiveId = null;

  return ({ transform, draggingNodeRect, over, active }) => {
    if (!draggingNodeRect) return transform;

    if (active?.id !== lastActiveId) {
      lastActiveId = active?.id ?? null;
      smoothedX = transform.x;
      smoothedY = transform.y;
      smoothedScale = 1;
    }

    const rawCenterX = draggingNodeRect.left + transform.x + draggingNodeRect.width / 2;
    const rawCenterY = draggingNodeRect.top + transform.y + draggingNodeRect.height / 2;

    const cellRect = getFullCellRect(over);
    const targetCenterX = cellRect ? cellRect.left + cellRect.width / 2 : rawCenterX;
    const targetCenterY = cellRect ? cellRect.top + cellRect.height / 2 : rawCenterY;

    const targetX = transform.x + (targetCenterX - rawCenterX);
    const targetY = transform.y + (targetCenterY - rawCenterY);

    const targetScale = cellRect
      ? Math.min(
          (cellRect.width / draggingNodeRect.width) * fitPadding,
          (cellRect.height / draggingNodeRect.height) * fitPadding,
          maxLockedScale
        )
      : 1;

    smoothedX += (targetX - smoothedX) * lerpFactor;
    smoothedY += (targetY - smoothedY) * lerpFactor;
    smoothedScale += (targetScale - smoothedScale) * lerpFactor;

    return {
      ...transform,
      x: smoothedX,
      y: smoothedY,
      scaleX: (transform.scaleX ?? 1) * smoothedScale,
      scaleY: (transform.scaleY ?? 1) * smoothedScale,
    };
  };
}

const magneticModifier = createMagneticModifier({ lerpFactor: 0.3 });

const DROP_SCALE_FADE_ANIMATION = {
  duration: 180,
  easing: "ease-out",
  sideEffects: null,
  keyframes({ transform }) {
    const base = CSS.Transform.toString(transform.initial);
    return [
      { opacity: 1, transform: `${base} scale(1)` },
      { opacity: 0, transform: `${base} scale(0.65)` },
    ];
  },
};

const CANCEL_FADE_ANIMATION = {
  duration: 160,
  easing: "ease-out",
  sideEffects: null,
  keyframes({ transform }) {
    return [
      { opacity: 1, transform: CSS.Transform.toString(transform.initial) },
      { opacity: 0, transform: CSS.Transform.toString(transform.initial) },
    ];
  },
};

export default function TimetableGrid({
  workspace,
  onWorkspaceChange,
  myGroup,
  viewOptions,
  isEditMode,
}) {
  const { timetable, days, slots, entries } = workspace;

  const orderedDays = sortDaysByWeekOrder(days);
  const orderedSlots = useMemo(
    () => [...slots].sort((a, b) => a.sort_order - b.sort_order),
    [slots]
  );

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const nowDow = now.getDay();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isCurrentSlot = (slot) =>
    nowMinutes >= toMinutes(slot.start_time) && nowMinutes < toMinutes(slot.end_time);

  const entriesByCell = useMemo(() => {
    const map = {};
    for (const entry of entries || []) {
      const key = entryKey(entry.slot_id, entry.day_of_week);
      if (!map[key]) map[key] = [];
      map[key].push(entry);
    }
    return map;
  }, [entries]);

  const [subjects, setSubjects] = useState([]);
  useEffect(() => {
    api
      .get("/subjects")
      .then(({ data }) => setSubjects(data.subjects))
      .catch((err) => console.error("Load subjects error:", err));
  }, []);

  const [activeCell, setActiveCell] = useState(null);
  const [pendingSave, setPendingSave] = useState(null);
  const [draggingSubject, setDraggingSubject] = useState(null);
  const [dropAnimation, setDropAnimation] = useState(() => CANCEL_FADE_ANIMATION);
  const [landing, setLanding] = useState(null);
  const landingTimeoutRef = useRef(null);

  useEffect(() => {
    return () => window.clearTimeout(landingTimeoutRef.current);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  );

  function openCell(slot, day, groupTag) {
    setActiveCell({ slotId: slot.id, dayOfWeek: day.day_of_week, slot, day, groupTag });
  }

  function closePicker() {
    setActiveCell(null);
  }

  async function refreshWorkspace() {
    const { data } = await api.get(`/timetables/${timetable.id}`);
    onWorkspaceChange?.(data);
  }

  async function commitSave(target, { subjectId, groupTag, room, deletions, swap }) {
    if (!target) return;
    try {
      for (const deleteGroupTag of deletions) {
        await api.delete(`/timetables/${timetable.id}/entries`, {
          data: {
            slotId: target.slotId,
            dayOfWeek: target.dayOfWeek,
            groupTag: deleteGroupTag,
          },
        });
      }
      await api.put(`/timetables/${timetable.id}/entries`, {
        slotId: target.slotId,
        dayOfWeek: target.dayOfWeek,
        subjectId,
        groupTag,
        room,
      });
      if (swap) {
        await api.put(`/timetables/${timetable.id}/entries`, {
          slotId: target.slotId,
          dayOfWeek: target.dayOfWeek,
          subjectId: swap.subjectId,
          groupTag: swap.groupTag,
          room: swap.room,
        });
      }
      await refreshWorkspace();
      closePicker();
    } catch (err) {
      console.error("Assign subject error:", err);
    }
  }

  function handleSelect({ subjectId, groupTag, room }) {
    if (!activeCell) return;
    const cellEntries = entriesByCell[entryKey(activeCell.slotId, activeCell.dayOfWeek)];
    const plan = planEntrySave({
      cellEntries,
      sourceGroupTag: activeCell.groupTag,
      targetGroupTag: groupTag,
      subjectId,
      room,
    });

    if (plan.noop) {
      closePicker();
      return;
    }

    const finalGroupTag = plan.finalGroupTag || groupTag;
    const target = { slotId: activeCell.slotId, dayOfWeek: activeCell.dayOfWeek };
    const payload = {
      subjectId,
      groupTag: finalGroupTag,
      room,
      deletions: plan.deletions,
      swap: plan.swap,
      actionType: plan.actionType,
      warnings: plan.warnings,
      target,
    };

    if (plan.needsConfirm) {
      setPendingSave(payload);
      return;
    }

    commitSave(target, payload);
  }

  async function handleClear() {
    if (!activeCell) return;
    try {
      const groupTag = activeCell.groupTag || "all";
      await api.delete(`/timetables/${timetable.id}/entries`, {
        data: { slotId: activeCell.slotId, dayOfWeek: activeCell.dayOfWeek, groupTag },
      });
      await refreshWorkspace();
      closePicker();
    } catch (err) {
      console.error("Clear entry error:", err);
    }
  }

  function handleDragStart(event) {
    const data = event.active?.data?.current;
    if (data) {
      setDraggingSubject({
        id: data.subjectId,
        name: data.subjectName,
        color: data.subjectColor,
        teacher: data.subjectTeacher,
      });
    }
    setDropAnimation(() => CANCEL_FADE_ANIMATION);
    lockPageScroll();
  }

  function handleDragCancel() {
    setDropAnimation(() => CANCEL_FADE_ANIMATION);
    setDraggingSubject(null);
    unlockPageScroll();
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    let dropped = false;

    if (over) {
      const subjectId = active?.data?.current?.subjectId;

      if (subjectId) {
        const parts = over.id.split("::");
        const cellKey = parts[1];
        const groupTag = parts[2] || "all";
        const [slotIdStr, dayOfWeekStr] = cellKey.split("-");
        const slotId = Number(slotIdStr);
        const dayOfWeek = Number(dayOfWeekStr);

        const slot = orderedSlots.find((s) => s.id === slotId);
        const day = orderedDays.find((d) => d.day_of_week === dayOfWeek);

        if (slot && day) {
          dropped = true;

          const landingKey = `${slotId}-${dayOfWeek}-${groupTag}`;
          setLanding({ key: landingKey, color: active.data.current.subjectColor });
          window.clearTimeout(landingTimeoutRef.current);
          landingTimeoutRef.current = window.setTimeout(() => setLanding(null), 650);

          saveDraggedSubject({ subjectId, slotId, dayOfWeek }, groupTag);
        }
      }
    }

    const animation = dropped ? DROP_SCALE_FADE_ANIMATION : CANCEL_FADE_ANIMATION;
    setDropAnimation(() => animation);
    window.setTimeout(unlockPageScroll, animation.duration + 20);
    setDraggingSubject(null);
  }

  function saveDraggedSubject(drop, groupTag) {
    const cellEntries = entriesByCell[entryKey(drop.slotId, drop.dayOfWeek)];
    const allEntry = findEntryForGroup(cellEntries, "all");
    const sourceGroupTag = allEntry ? "all" : groupTag;
    const currentEntry = allEntry || findEntryForGroup(cellEntries, groupTag);
    const room = currentEntry?.room || null;

    const plan = planEntrySave({
      cellEntries,
      sourceGroupTag,
      targetGroupTag: groupTag,
      subjectId: drop.subjectId,
      room,
    });

    if (plan.noop) return;

    const payload = {
      subjectId: drop.subjectId,
      groupTag: plan.finalGroupTag || groupTag,
      room,
      deletions: plan.deletions,
      swap: plan.swap,
      actionType: plan.actionType,
      warnings: plan.warnings,
      target: { slotId: drop.slotId, dayOfWeek: drop.dayOfWeek },
    };

    if (plan.needsConfirm) {
      setPendingSave(payload);
    } else {
      commitSave(payload.target, payload);
    }
  }


  const activeEntry = activeCell
    ? findEntryForGroup(
        entriesByCell[entryKey(activeCell.slotId, activeCell.dayOfWeek)],
        activeCell.groupTag
      )
    : null;

  function dialogConfigForAction(actionType) {
    switch (actionType) {
      case "merge":
        return { title: "Merge duplicate subjects?", confirmLabel: "Merge into All" };
      case "swap":
        return { title: "Swap subjects between groups?", confirmLabel: "Swap subjects" };
      case "overwrite":
        return { title: "Replace subject?", confirmLabel: "Replace" };
      case "convert":
        return { title: "Convert to shared slot?", confirmLabel: "Convert to All" };
      case "split":
        return { title: "Split shared slot?", confirmLabel: "Split" };
      case "noop":
        return { title: "No changes", confirmLabel: "OK" };
      default:
        return { title: "This will change more than one thing", confirmLabel: "Continue" };
    }
  }

  const dialogConfig = pendingSave ? dialogConfigForAction(pendingSave.actionType) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      autoScroll={false}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full min-h-0 w-full gap-3">
        <div className="flex h-full min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset,0_20px_40px_-24px_rgba(0,0,0,0.6)]">
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-cadence" style={{ scrollbarGutter: "auto" }}>
          <table className="h-full w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col style={{ width: "16%" }} />
              {orderedDays.map((day) => (
                <col key={day.id} style={{ width: `${84 / orderedDays.length}%` }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th className="border-b border-r border-[var(--color-border)] bg-[var(--color-surface-alt)] px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                  Time
                </th>
                {orderedDays.map((day, i) => {
                  const isToday = day.day_of_week === nowDow;
                  const isLastCol = i === orderedDays.length - 1;
                  return (
                    <th
                      key={day.id}
                      className={`relative border-b border-[var(--color-border)] ${
                        isLastCol ? "" : "border-r"
                      } bg-[var(--color-surface-alt)] px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                        isToday ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]"
                      }`}
                    >
                      {WEEKDAY_FULL[day.day_of_week]}
                      {isToday && (
                        <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-[var(--color-accent)]" />
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {orderedSlots.map((slot, rowIdx) => {
                const isLastRow = rowIdx === orderedSlots.length - 1;
                return (
                  <tr key={slot.id}>
                    <td
                      className={`border-r border-[var(--color-border)] ${
                        isLastRow ? "" : "border-b"
                      } bg-[var(--color-surface)] px-8`}
                    >
                      <div className="flex items-center gap-2">
                        {slot.label && (
                          <span className="shrink-0 rounded-lg bg-[var(--color-surface-alt)] p-1.5 text-[10px] font-medium leading-none text-[var(--color-text-muted)]">
                            {slot.label}
                          </span>
                        )}
                        <span className="h-0 flex-1 border-t border-dashed border-[var(--color-border)]" />
                        <span className="flex shrink-0 items-center gap-1.5 text-[12px] font-semibold leading-none text-[var(--color-text)] tabular-nums">
                          {slot.start_time.slice(0, 5)}
                          <span className="h-0 w-6 border-t border-dashed border-[var(--color-border)]" />
                          {slot.end_time.slice(0, 5)}
                        </span>
                      </div>
                    </td>
                    {orderedDays.map((day, i) => {
                      const isToday = day.day_of_week === nowDow;
                      const isLive = isToday && isCurrentSlot(slot);
                      const isLastCol = i === orderedDays.length - 1;
                      return (
                        <TimetableCell
                          key={day.id}
                          entriesForCell={entriesByCell[entryKey(slot.id, day.day_of_week)]}
                          isToday={isToday}
                          isLive={isLive}
                          isLastCol={isLastCol}
                          isLastRow={isLastRow}
                          onOpen={(groupTag) => openCell(slot, day, groupTag)}
                          myGroup={myGroup}
                          viewOptions={viewOptions}
                          slotId={slot.id}
                          dayOfWeek={day.day_of_week}
                          isEditMode={isEditMode}
                          landing={landing}
                        />
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>

          <SubjectPickerModal
            open={Boolean(activeCell)}
            onClose={closePicker}
            subjects={subjects}
            currentSubjectId={activeEntry?.subject_id ?? null}
            currentGroupTag={activeCell?.groupTag}
            currentRoom={activeEntry?.room}
            cellEntries={
              activeCell ? entriesByCell[entryKey(activeCell.slotId, activeCell.dayOfWeek)] : null
            }
            onSelect={handleSelect}
            onClear={handleClear}
            cellLabel={
              activeCell
                ? `${WEEKDAY_FULL[activeCell.dayOfWeek]} · ${activeCell.slot.start_time.slice(0, 5)}–${activeCell.slot.end_time.slice(0, 5)}`
                : ""
            }
          />

          <ConfirmDialog
            open={Boolean(pendingSave)}
            title={dialogConfig?.title || "This will change more than one thing"}
            messages={pendingSave?.warnings || []}
            confirmLabel={dialogConfig?.confirmLabel || "Continue"}
            onCancel={() => setPendingSave(null)}
            onConfirm={() => {
              const save = pendingSave;
              setPendingSave(null);
              commitSave(save.target, save);
            }}
          />


        </div>

        {isEditMode && <SubjectsDrawer subjects={subjects} />}
      </div>

      <DragOverlay dropAnimation={dropAnimation} modifiers={[magneticModifier]}>
        {draggingSubject ? <SubjectChipContent subject={draggingSubject} lifted /> : null}
      </DragOverlay>
    </DndContext>
  );
}
