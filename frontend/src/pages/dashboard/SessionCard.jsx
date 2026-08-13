import { BookOpen } from "lucide-react";

export default function SessionCard({ session, isCurrent }) {
  return (
    <div
      className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
        isCurrent ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
      }`}
      style={
        isCurrent
          ? { boxShadow: `inset 2px 0 0 0 ${session.color}` }
          : undefined
      }
    >
      <div className="w-14 shrink-0 text-xs text-[var(--color-text-muted)] leading-tight">
        <div className={isCurrent ? "font-medium text-[var(--color-text)]" : ""}>
          {session.start.slice(0, 5)}
        </div>
        <div>{session.end.slice(0, 5)}</div>
      </div>

      <span
        className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10"
        style={{
          backgroundImage: `linear-gradient(155deg, color-mix(in srgb, ${session.color} 35%, black 20%) 0%, color-mix(in srgb, ${session.color} 12%, black 45%) 100%)`,
        }}
      >
        <BookOpen size={13} style={{ color: session.color }} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-[var(--color-text)]">
          {session.subjectName}
          {isCurrent && (
            <span
              className="ml-2 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
              style={{
                backgroundColor: `color-mix(in srgb, ${session.color} 25%, transparent)`,
                color: session.color,
              }}
            >
              now
            </span>
          )}
        </div>
        <div className="truncate text-xs text-[var(--color-text-muted)]">
          {session.teacher}
          {session.room ? ` · ${session.room}` : ""}
          {session.groupTag !== "all" ? ` · ${session.groupTag.toUpperCase()}` : ""}
        </div>
      </div>
    </div>
  );
}
