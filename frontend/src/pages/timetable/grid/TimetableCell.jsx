import { getCellDisplay } from "./timetableGridUtils";

function SubjectLabel({ entry }) {
  return (
    <span
      className="absolute inset-0 flex items-center justify-center truncate px-2 text-[12px] font-semibold transition-opacity duration-150 hover:opacity-90"
      style={{
        backgroundColor: `${entry.subject_color}26`,
        color: entry.subject_color,
      }}
    >
      <span className="truncate">{entry.subject_name}</span>
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
}) {
  const display = getCellDisplay(entriesForCell);
  const isEmpty = display.mode === "empty";

  return (
    <td
      className={`group relative border-[var(--color-border)] ${
        isLastCol ? "" : "border-r"
      } ${isLastRow ? "" : "border-b"} p-0 text-center align-middle transition-all duration-200 ease-out ${
        isToday && isEmpty ? "bg-[var(--color-accent)]/[0.05]" : ""
      }`}
    >
      {isLive && (
        <span className="absolute inset-1 rounded-lg ring-1 ring-[var(--color-accent)]/50 shadow-[0_0_0_3px_rgba(var(--color-accent-rgb),0.08)] pointer-events-none z-10" />
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
              <SubjectLabel entry={display.g1Entry} />
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
              <SubjectLabel entry={display.g2Entry} />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]/40 opacity-0 transition-opacity duration-200 group-hover/half:opacity-100">
                G2
              </span>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={() => onOpen("all")}
          className={`relative flex h-full min-h-[56px] cursor-pointer items-center justify-center ${
            isEmpty ? "hover:bg-[var(--color-surface-alt)]" : ""
          }`}
        >
          {display.mode === "full" ? (
            <SubjectLabel entry={display.entry} />
          ) : (
            <span className="h-1 w-1 rounded-full bg-[var(--color-text-muted)]/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          )}
        </div>
      )}
    </td>
  );
}
