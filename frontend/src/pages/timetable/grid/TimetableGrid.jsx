import { useEffect, useMemo, useState } from "react";
import { sortDaysByWeekOrder } from "../../../lib/days";
import api from "../../../lib/api";
import SubjectPickerModal from "./SubjectPickerModal";

const WEEKDAY_FULL = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

function toMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function entryKey(slotId, dayOfWeek) {
  return `${slotId}-${dayOfWeek}`;
}

function pickDisplayEntry(entriesForCell) {
  if (!entriesForCell || entriesForCell.length === 0) return null;
  return (
    entriesForCell.find((e) => e.group_tag === "all") || entriesForCell[0]
  );
}

export default function TimetableGrid({ workspace, onWorkspaceChange }) {
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

  function openCell(slot, day) {
    setActiveCell({ slotId: slot.id, dayOfWeek: day.day_of_week, slot, day });
  }

  function closePicker() {
    setActiveCell(null);
  }

  async function refreshWorkspace() {
    const { data } = await api.get(`/timetables/${timetable.id}`);
    onWorkspaceChange?.(data);
  }

  async function handleSelect({ subjectId, groupTag, room }) {
    if (!activeCell) return;
    try {
      await api.put(`/timetables/${timetable.id}/entries`, {
        slotId: activeCell.slotId,
        dayOfWeek: activeCell.dayOfWeek,
        subjectId,
        groupTag,
        room,
      });
      await refreshWorkspace();
      closePicker();
    } catch (err) {
      console.error("Assign subject error:", err);
    }
  }

  async function handleClear() {
    if (!activeCell) return;
    try {
      const groupTag = activeEntry?.group_tag || "all";
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
    ? pickDisplayEntry(entriesByCell[entryKey(activeCell.slotId, activeCell.dayOfWeek)])
    : null;

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
                  const entry = pickDisplayEntry(
                    entriesByCell[entryKey(slot.id, day.day_of_week)]
                  );
                  return (
                    <td
                      key={day.id}
                      onClick={() => openCell(slot, day)}
                      className={`group relative cursor-pointer border-[var(--color-border)] ${
                        isLastCol ? "" : "border-r"
                      } ${isLastRow ? "" : "border-b"} p-0 text-center align-middle transition-all duration-200 ease-out ${
                        isToday && !entry ? "bg-[var(--color-accent)]/[0.05]" : ""
                      } ${entry ? "" : "hover:bg-[var(--color-surface-alt)]"}`}
                    >
                      {isLive && (
                        <span className="absolute inset-1 rounded-lg ring-1 ring-[var(--color-accent)]/50 shadow-[0_0_0_3px_rgba(var(--color-accent-rgb),0.08)] pointer-events-none z-10" />
                      )}
                      <div className="relative flex h-full min-h-[56px] items-center justify-center">
                        {entry ? (
                          <span
                            className="absolute inset-0 flex items-center justify-center truncate px-2 text-[12px] font-semibold transition-opacity duration-150 hover:opacity-90"
                            style={{
                              backgroundColor: `${entry.subject_color}26`,
                              color: entry.subject_color,
                            }}
                          >
                            <span className="truncate">{entry.subject_name}</span>
                          </span>
                        ) : (
                          <span className="h-1 w-1 rounded-full bg-[var(--color-text-muted)]/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                        )}
                      </div>
                    </td>
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
        currentGroupTag={activeEntry?.group_tag}
        currentRoom={activeEntry?.room}
        onSelect={handleSelect}
        onClear={handleClear}
        cellLabel={
          activeCell
            ? `${WEEKDAY_FULL[activeCell.dayOfWeek]} · ${activeCell.slot.start_time.slice(0, 5)}–${activeCell.slot.end_time.slice(0, 5)}`
            : ""
        }
      />
    </div>
  );
}
