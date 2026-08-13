export default function SessionCard({ session, isCurrent }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
        isCurrent ? "bg-[var(--color-surface-alt)]" : ""
      }`}
    >
      <div className="w-14 shrink-0 text-xs text-[var(--color-text-muted)] leading-tight">
        <div>{session.start.slice(0, 5)}</div>
        <div>{session.end.slice(0, 5)}</div>
      </div>
      <div
        className="w-1 self-stretch rounded-full shrink-0"
        style={{ backgroundColor: session.color }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-[var(--color-text)] font-medium truncate">
          {session.subjectName}
          {isCurrent && (
            <span className="ml-2 text-[10px] uppercase tracking-wide text-[var(--color-primary)] font-normal">
              now
            </span>
          )}
        </div>
        <div className="text-xs text-[var(--color-text-muted)] truncate">
          {session.teacher}
          {session.room ? ` · ${session.room}` : ""}
          {session.groupTag !== "all" ? ` · ${session.groupTag.toUpperCase()}` : ""}
        </div>
      </div>
    </div>
  );
}
