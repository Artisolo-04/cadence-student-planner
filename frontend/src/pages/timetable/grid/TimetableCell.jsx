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

function SubjectLabel({ entry, groupTag, showTeacher, showRoom }) {
  return (
    <span
      className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-2 text-[12px] font-semibold transition-opacity duration-150 hover:opacity-90"
      style={{
        backgroundColor: `${entry.subject_color}26`,
        color: entry.subject_color,
      }}
    >
      {groupTag && (
        <span className="absolute left-1.5 top-1.5 rounded bg-[var(--color-surface)]/70 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide">
          {groupTag}
        </span>
      )}
      <span className="max-w-full truncate">{entry.subject_name}</span>
      {showTeacher && entry.subject_teacher && (
        <span className="max-w-full truncate text-[10px] font-medium opacity-80">
          {entry.subject_teacher}
        </span>
      )}
      {showRoom && entry.room && (
        <span className="max-w-full truncate text-[10px] font-medium opacity-80">
          {entry.room}
        </span>
      )}
    </span>
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
}) {
  const {
    groupVisibility = "both",
    showTeacher = false,
    showRoom = false,
  } = viewOptions || {};

  const display = getDisplayForView(
    entriesForCell,
    groupVisibility,
    myGroup
  );
  const isEmpty =
    display.mode === "empty" ||
    (display.mode === "filtered" && !display.entry);

  return (
    <td
      className={`group relative border-[var(--color-border)] ${
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
          <div
            onClick={() => onOpen("g1")}
            className={`group/half relative flex-1 cursor-pointer ${
              display.g1Entry ? "" : "hover:bg-[var(--color-surface-alt)]"
            }`}
          >
            {display.g1Entry ? (
              <SubjectLabel
                entry={display.g1Entry}
                showTeacher={showTeacher}
                showRoom={showRoom}
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]/40 opacity-0 transition-opacity duration-200 group-hover/half:opacity-100">
                G1
              </span>
            )}
          </div>

          <div
            onClick={() => onOpen("g2")}
            className={`group/half relative flex-1 cursor-pointer ${
              display.g2Entry ? "" : "hover:bg-[var(--color-surface-alt)]"
            }`}
          >
            {display.g2Entry ? (
              <SubjectLabel
                entry={display.g2Entry}
                showTeacher={showTeacher}
                showRoom={showRoom}
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]/40 opacity-0 transition-opacity duration-200 group-hover/half:opacity-100">
                G2
              </span>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={() => onOpen(display.groupTag || "all")}
          className={`relative flex h-full min-h-[56px] cursor-pointer items-center justify-center ${
            isEmpty ? "hover:bg-[var(--color-surface-alt)]" : ""
          }`}
        >
          {display.mode === "full" || display.mode === "filtered" ? (
            display.entry ? (
              <SubjectLabel
                entry={display.entry}
                groupTag={display.mode === "filtered" ? display.groupTag : null}
                showTeacher={showTeacher}
                showRoom={showRoom}
              />
            ) : (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]/40">
                {display.groupTag?.toUpperCase()}
              </span>
            )
          ) : (
            <span className="h-1 w-1 rounded-full bg-[var(--color-text-muted)]/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          )}
        </div>
      )}
    </td>
  );
}
