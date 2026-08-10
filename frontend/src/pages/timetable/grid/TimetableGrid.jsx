import { useEffect, useMemo, useState } from "react";
import { sortDaysByWeekOrder } from "../../../lib/days";
import api from "../../../lib/api";
import SubjectPickerModal from "./SubjectPickerModal";
import TimetableCell from "./TimetableCell";
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

export default function TimetableGrid({
  workspace,
  onWorkspaceChange,
  myGroup,
  viewOptions,
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

  async function commitSave({ subjectId, groupTag, room, deletions, swap }) {
    if (!activeCell) return;
    try {
      for (const deleteGroupTag of deletions) {
        await api.delete(`/timetables/${timetable.id}/entries`, {
          data: {
            slotId: activeCell.slotId,
            dayOfWeek: activeCell.dayOfWeek,
            groupTag: deleteGroupTag,
          },
        });
      }
      await api.put(`/timetables/${timetable.id}/entries`, {
        slotId: activeCell.slotId,
        dayOfWeek: activeCell.dayOfWeek,
        subjectId,
        groupTag,
        room,
      });
      if (swap) {
        await api.put(`/timetables/${timetable.id}/entries`, {
          slotId: activeCell.slotId,
          dayOfWeek: activeCell.dayOfWeek,
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

    console.log("[planEntrySave] decision:", {
      sourceGroupTag: activeCell.groupTag,
      requestedTargetGroupTag: groupTag,
      subjectId,
      plan,
    });

    if (plan.noop) {
      closePicker();
      return;
    }

    const finalGroupTag = plan.finalGroupTag || groupTag;
    const payload = { subjectId, groupTag: finalGroupTag, room, deletions: plan.deletions, swap: plan.swap, actionType: plan.actionType, warnings: plan.warnings };

    if (plan.needsConfirm) {
      setPendingSave(payload);
      return;
    }

    commitSave(payload);
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
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset,0_20px_40px_-24px_rgba(0,0,0,0.6)]">
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
          commitSave(save);
        }}
      />
    </div>
  );
}
