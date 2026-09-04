import { GraduationCap, Wifi } from "lucide-react";
import { API_ORIGIN } from "../../lib/api";

function getInitials(name, email) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email ? email.slice(0, 2).toUpperCase() : "?";
}

function formatStudentId(userId) {
  const base = String(userId ?? 0).padStart(6, "0");
  return `CAD-${base.slice(0, 3)}-${base.slice(3)}`;
}

function formatIssueDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "2-digit", year: "numeric" });
}

export default function StudentCard({ user, profile, groupTag }) {
  const fullName = profile?.full_name || "Student";
  const initials = getInitials(profile?.full_name, user?.email);
  const avatarSrc = profile?.avatar_url ? `${API_ORIGIN}${profile.avatar_url}` : null;
  const studentId = formatStudentId(user?.id);
  const validThru = formatIssueDate(profile?.updated_at) !== "—"
    ? formatIssueDate(new Date(new Date(profile.updated_at).setFullYear(new Date(profile.updated_at).getFullYear() + 1)))
    : "—";
  const showGroupField = groupTag && groupTag !== "all";

  return (
    <div
      className="relative flex w-full h-full overflow-hidden rounded-2xl border border-white/10 backdrop-blur-xl"
      style={{
        backgroundImage:
          "linear-gradient(140deg, color-mix(in srgb, var(--color-primary) 26%, transparent) 0%, color-mix(in srgb, var(--color-accent) 12%, transparent) 60%, transparent 100%)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-14 h-44 w-44 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: "var(--color-primary)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, var(--color-text) 0px, var(--color-text) 1px, transparent 1px, transparent 14px)",
        }}
      />

      <div className="relative z-10 flex w-full flex-col p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">
            Cadence
          </div>
          <Wifi size={16} className="rotate-90 text-[var(--color-text-muted)] opacity-60" />
        </div>

        <div className="mt-3 flex flex-1 items-center gap-5">
          <span
            className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 text-2xl font-semibold text-[var(--color-primary)] shadow-lg"
            style={{
              backgroundImage:
                "linear-gradient(155deg, color-mix(in srgb, var(--color-primary) 40%, black 20%) 0%, color-mix(in srgb, var(--color-primary) 15%, black 45%) 100%)",
              boxShadow:
                "0 1px 0 0 rgba(255,255,255,0.15) inset, 0 -1px 3px 0 rgba(0,0,0,0.35) inset, 0 4px 12px -2px rgba(0,0,0,0.45)",
            }}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt={fullName} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent"
            />
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold leading-tight text-[var(--color-text)]">
              {fullName}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
              <GraduationCap size={14} className="shrink-0" />
              <span className="truncate">
                {[profile?.faculty, profile?.class_year, showGroupField ? groupTag.toUpperCase() : null]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-white/10 pt-3">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-[var(--color-text-muted)]">
              Student ID
            </p>
            <p className="font-mono text-sm tracking-wide text-[var(--color-text)]">
              {studentId}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-wider text-[var(--color-text-muted)]">
              Valid thru
            </p>
            <p className="font-mono text-sm tracking-wide text-[var(--color-text)]">
              {validThru}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
