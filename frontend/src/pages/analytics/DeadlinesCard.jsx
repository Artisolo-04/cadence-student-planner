import { CalendarCheck, CalendarDays } from "lucide-react";
import AnalyticsTile from "./AnalyticsTile";
import { ChartEmpty, localDateKey } from "./MiniBars";
import { formatShortDate } from "./analyticsUtils";
import { DeadlinesBodySkeleton } from "./AnalyticsSkeleton";

const tint = (color, pct) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;
const TODO = tint("var(--color-text-muted)", 85);
const PROGRESS = tint("var(--color-warning)", 80);

function weekday(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short" });
}

function Legend() {
  return (
    <div className="flex shrink-0 items-center gap-3 text-[10px] text-[var(--color-text-muted)]">
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: TODO }} />
        To do
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: PROGRESS }} />
        In progress
      </span>
    </div>
  );
}

function Fill({ todo, progress }) {
  return (
    <>
      {todo > 0 && <div style={{ flex: todo, backgroundColor: TODO }} />}
      {progress > 0 && <div style={{ flex: progress, backgroundColor: PROGRESS }} />}
    </>
  );
}

function WeekBars({ items, max, today }) {
  return (
    <div className="flex h-full min-h-[6rem] gap-1.5">
      {items.map((i) => {
        const isToday = i.date === today;
        const has = i.total > 0;
        return (
          <div
            key={i.date}
            title={`${formatShortDate(i.date)}: ${i.todo} to do, ${i.progress} in progress`}
            className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
          >
            <span className="h-3 text-[10px] font-medium leading-3 tabular-nums text-[var(--color-text)]">
              {has ? i.total : ""}
            </span>
            <div
              className={`relative min-h-0 w-full flex-1 overflow-hidden rounded-lg border ${
                !has
                  ? "border-dashed border-[var(--color-line)]"
                  : isToday
                    ? "border-[var(--color-primary)] bg-[var(--color-fill-1)]"
                    : "border-[var(--color-line)] bg-[var(--color-fill-1)]"
              }`}
            >
              {has && (
                <div
                  className="absolute inset-x-[3px] bottom-[3px] flex flex-col-reverse gap-px overflow-hidden rounded-md"
                  style={{ height: `calc(${Math.max((i.total / max) * 100, 18)}% - 6px)` }}
                >
                  <Fill todo={i.todo} progress={i.progress} />
                </div>
              )}
            </div>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] leading-none ${
                isToday
                  ? "bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] font-semibold text-[var(--color-primary)]"
                  : "text-[var(--color-text-muted)]"
              }`}
            >
              {weekday(i.date)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ThinBars({ items, max }) {
  const first = items[0];
  const mid = items[Math.floor(items.length / 2)];
  const last = items[items.length - 1];
  return (
    <div className="flex h-full min-h-[6rem] flex-col gap-2">
      <div className="flex min-h-0 flex-1 gap-px rounded-lg border border-[var(--color-line)] bg-[var(--color-fill-1)] p-1">
        {items.map((i) => (
          <div
            key={i.date}
            title={`${formatShortDate(i.date)}: ${i.todo} to do, ${i.progress} in progress`}
            className="relative h-full min-w-0 flex-1"
          >
            {i.total > 0 ? (
              <div
                className="absolute inset-x-0 bottom-0 flex flex-col-reverse overflow-hidden rounded-[2px]"
                style={{ height: `${Math.max((i.total / max) * 100, 8)}%` }}
              >
                <Fill todo={i.todo} progress={i.progress} />
              </div>
            ) : (
              <div className="absolute inset-x-0 bottom-0 h-[2px] bg-[var(--color-fill-3)]" />
            )}
          </div>
        ))}
      </div>
      <div className="flex shrink-0 justify-between text-[10px] leading-none text-[var(--color-text-muted)]">
        <span>{formatShortDate(first.date)}</span>
        <span>{formatShortDate(mid.date)}</span>
        <span>{formatShortDate(last.date)}</span>
      </div>
    </div>
  );
}

export default function DeadlinesCard({ homework, days, onExpand, loading = false }) {
  const items = (homework?.dueByDate ?? []).map((d) => {
    const todo = d.todo ?? 0;
    const progress = d.inProgress ?? 0;
    return { date: d.date, todo, progress, total: todo + progress };
  });

  const openTotal = items.reduce((sum, i) => sum + i.total, 0);
  const max = Math.max(1, ...items.map((i) => i.total));
  const today = localDateKey();
  const dueToday = items.find((i) => i.date === today)?.total ?? 0;

  return (
    <AnalyticsTile icon={CalendarDays} title="Deadlines ahead" meta={`next ${days} days`} scroll={false} onExpand={onExpand}>
      {loading ? (
          <DeadlinesBodySkeleton days={days} />
        ) : openTotal === 0 ? (
        <ChartEmpty icon={CalendarCheck}>Nothing is due in the next {days} days. Enjoy the calm.</ChartEmpty>
      ) : (
        <div className="flex h-full min-h-0 flex-col gap-3">
          <div className="flex shrink-0 items-center justify-between gap-3">
            <p className="text-xs text-[var(--color-text-muted)]">
              <span className="mr-1.5 text-2xl font-bold tabular-nums text-[var(--color-text)]">{openTotal}</span>
              open {openTotal === 1 ? "task" : "tasks"} due
              {dueToday > 0 && <span className="font-medium text-[var(--color-primary)]"> · {dueToday} today</span>}
            </p>
            <Legend />
          </div>
          <div className="min-h-0 flex-1">
            {items.length > 14 ? <ThinBars items={items} max={max} /> : <WeekBars items={items} max={max} today={today} />}
          </div>
        </div>
      )}
    </AnalyticsTile>
  );
}
