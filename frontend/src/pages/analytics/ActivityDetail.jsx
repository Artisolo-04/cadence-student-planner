import { useState } from "react";
import { formatLongDate, todayIso } from "./analyticsUtils";
import { Empty, Pill, Stat } from "./DetailBits";
import ScrollArea from "./ScrollArea";
import TileSwitch from "./TileSwitch";

const P = "var(--color-primary)";
const tint = (pct) => `color-mix(in srgb, ${P} ${pct}%, transparent)`;

const VIEWS = [
  { id: "added", label: "Homework", title: "Homework added" },
  { id: "edits", label: "Timetable", title: "Timetable edits" },
];

function parseKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function ActivityDetail({ homework, timetableActivity, days }) {
  const [view, setView] = useState("added");
  const today = todayIso();

  const added = (homework?.createdByDate ?? []).map((d) => ({ date: d.date, value: d.count ?? 0 }));
  const edits = (timetableActivity ?? []).map((d) => ({ date: d.date, value: d.snapshotCount ?? 0 }));
  const all = view === "added" ? added : edits;

  const noun = view === "added" ? ["task added", "tasks added"] : ["timetable edit", "timetable edits"];
  const total = all.reduce((sum, r) => sum + r.value, 0);
  const max = Math.max(1, ...all.map((r) => r.value));
  const activeDays = all.filter((r) => r.value > 0).length;
  const peak = all.reduce((a, b) => (b.value > (a?.value ?? 0) ? b : a), null);
  const share = (n) => (total > 0 ? Math.round((n / total) * 100) : 0);

  // 7 days: whole week. 30/90 days: only days with activity. Newest first.
  const rows = (all.length <= 14 ? all : all.filter((r) => r.value > 0)).slice().reverse();

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <section className="grid shrink-0 grid-cols-3 gap-2">
        <Stat label="Total" value={total} color={total > 0 ? P : undefined} />
        <Stat label="Active days" value={activeDays} />
        <Stat label="Peak day" value={peak && peak.value > 0 ? peak.value : "-"} />
      </section>

      <div className="flex shrink-0 items-center justify-between gap-3 text-xs text-[var(--color-text-muted)]">
        <TileSwitch ariaLabel="Activity type" options={VIEWS} value={view} onChange={setView} />
        <span className="font-mono text-[10px]">last {days} days</span>
      </div>

      {all.length === 0 || total === 0 ? (
        <Empty>
          {view === "added" ? "No tasks were added" : "No timetable edits"} in the last {days} days.
        </Empty>
      ) : (
        <ScrollArea watch={`${view}-${rows.length}`}>
          <ul className="flex flex-col gap-2 py-1">
            {rows.map((r) => {
              const free = r.value === 0;
              const isToday = r.date === today;
              const top = !free && peak && r.date === peak.date && activeDays > 1;
              const d = parseKey(r.date);
              return (
                <li
                  key={r.date}
                  className={`flex flex-col gap-2.5 rounded-xl border px-3.5 py-3 ${
                    free
                      ? "border-dashed border-[var(--color-line)]"
                      : isToday
                        ? "border-[var(--color-primary)]"
                        : "border-transparent"
                  }`}
                  style={{
                    background: free
                      ? "var(--color-fill-1)"
                      : `linear-gradient(120deg, ${tint(top ? 20 : 12)} 0%, ${tint(4)} 100%)`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg leading-none"
                      style={{
                        color: free ? "var(--color-text-muted)" : P,
                        backgroundColor: free ? "var(--color-fill-3)" : tint(20),
                      }}
                    >
                      <span className="text-[9px] font-semibold uppercase tracking-wide">
                        {d.toLocaleDateString("en-US", { weekday: "short" })}
                      </span>
                      <span className="text-sm font-bold tabular-nums">{d.getDate()}</span>
                    </span>

                    <div className="min-w-0 flex-1">
                      <h4 className="flex items-center gap-2 truncate text-[13px] font-semibold text-[var(--color-text)]">
                        {formatLongDate(r.date)}
                        {isToday && <Pill color={P}>Today</Pill>}
                      </h4>
                      <p className="mt-0.5 truncate text-[11px] text-[var(--color-text-muted)]">
                        {free ? (
                          "No activity"
                        ) : (
                          <>
                            {r.value} {r.value === 1 ? noun[0] : noun[1]} ·{" "}
                            <span style={{ color: P }}>{share(r.value)}%</span>
                            {top && " · peak"}
                          </>
                        )}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 font-mono text-sm font-bold tabular-nums ${
                        free ? "text-[var(--color-text-muted)]" : "text-[var(--color-text)]"
                      }`}
                    >
                      {free ? "-" : r.value}
                    </span>
                  </div>

                  {!free && (
                    <div className="h-1.5 w-full overflow-hidden rounded-md" style={{ backgroundColor: tint(14) }}>
                      <div
                        className="h-full rounded-md"
                        style={{
                          width: `${(r.value / max) * 100}%`,
                          background: `linear-gradient(90deg, ${tint(60)}, ${P})`,
                        }}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
}
