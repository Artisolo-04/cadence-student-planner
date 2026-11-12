import {
  Activity as ActivityIcon,
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronDown,
  Clock,
  FolderOpen as VaultIcon,
  Gauge,
} from "lucide-react";
import { useWorkspace } from "../../hooks/useWorkspace";
import SegmentedControl from "../../components/ui/SegmentedControl";
import AnalyticsTile from "./AnalyticsTile";
import StatTile from "./StatTile";
import { localDateKey } from "./MiniBars";
import { DAY_ORDER, DAY_SHORT, formatShortDate } from "./analyticsUtils";

// Same options as AnalyticsPage (kept here so this file never imports the page).
const RANGE_OPTIONS = [
  { id: 7, label: "7 days" },
  { id: 30, label: "30 days" },
  { id: 90, label: "90 days" },
];

const tint = (color, pct) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;
const TODO = tint("var(--color-text-muted)", 85);
const PROGRESS = tint("var(--color-warning)", 80);
const TODAY_CHIP =
  "bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] font-semibold text-[var(--color-primary)]";

const STATUS = [
  { key: "todo", label: "To do", color: "var(--color-text-muted)" },
  { key: "inProgress", label: "In progress", color: "var(--color-warning)" },
  { key: "done", label: "Done", color: "var(--color-primary)" },
];
const PRIORITY = [
  { key: "high", label: "High" },
  { key: "normal", label: "Normal" },
  { key: "low", label: "Low" },
];

// Inline shimmer that sits in a text line (same trick as the dashboard skeleton).
function Ink({ w = "w-24" }) {
  return (
    <span
      aria-hidden="true"
      className={`sk inline-block h-[0.72em] max-w-full rounded-[3px] align-baseline ${w}`}
    />
  );
}

// Stands in for the "text-2xl font-bold" count, with the same 2rem line height.
function Headline() {
  return (
    <span className="mr-1.5 inline-block align-middle text-2xl">
      <span aria-hidden="true" className="sk inline-block h-6 w-9 rounded-md align-middle" />
    </span>
  );
}

function MetaBlock({ w = "w-14" }) {
  return (
    <span aria-hidden="true" className={`sk inline-block h-[10px] rounded-[3px] align-middle ${w}`} />
  );
}

// Same slot and breakpoints as the real expand button.
function ExpandTwin({ show }) {
  return <span aria-hidden="true" className={`sk h-6 w-6 rounded-lg ${show}`} />;
}

// Visual twin of TileSwitch (no buttons, so nothing is focusable while loading).
function SwitchTwin({ labels }) {
  return (
    <div
      aria-hidden="true"
      className="inline-flex h-6 items-center gap-0.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-fill-1)] p-0.5"
    >
      {labels.map((l, i) => (
        <span
          key={l}
          className={`flex h-full items-center rounded-md px-2 text-[10px] font-medium ${
            i === 0
              ? "bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] text-[var(--color-primary)]"
              : "text-[var(--color-text-muted)]"
          }`}
        >
          {l}
        </span>
      ))}
    </div>
  );
}

function dayAt(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d;
}

// "ahead" = deadlines (today .. today+days-1), "back" = activity (today-days+1 .. today)
function ChartSkeleton({ days, direction }) {
  const offsets = Array.from({ length: days }, (_, i) => (direction === "ahead" ? i : i - (days - 1)));

  if (days > 7) {
    const label = (o) => formatShortDate(localDateKey(dayAt(o)));
    return (
      <div className="flex h-full min-h-[6rem] flex-col gap-2">
        <div className="flex min-h-0 flex-1 gap-px rounded-lg border border-[var(--color-line)] bg-[var(--color-fill-1)] p-1">
          <div aria-hidden="true" className="sk h-full w-full rounded-[3px]" />
        </div>
        <div className="flex shrink-0 justify-between text-[10px] leading-none text-[var(--color-text-muted)]">
          <span>{label(offsets[0])}</span>
          <span>{label(offsets[Math.floor(offsets.length / 2)])}</span>
          <span>{label(offsets[offsets.length - 1])}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[6rem] gap-1.5">
      {offsets.map((o) => (
        <div key={o} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <span className="h-3" />
          <div aria-hidden="true" className="sk min-h-0 w-full flex-1 rounded-lg" />
          <span
            className={`rounded-md px-1.5 py-0.5 text-[10px] leading-none ${
              o === 0 ? TODAY_CHIP : "text-[var(--color-text-muted)]"
            }`}
          >
            {dayAt(o).toLocaleDateString("en-US", { weekday: "short" })}
          </span>
        </div>
      ))}
    </div>
  );
}

function DeadlinesLegend() {
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

// Body only: used inside the real Deadlines card when the range changes.
export function DeadlinesBodySkeleton({ days }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <span role="status" className="sr-only">
        Loading deadlines
      </span>
      <div className="flex shrink-0 items-center justify-between gap-3">
        <p className="text-xs text-[var(--color-text-muted)]">
          <Headline />
          open tasks due
        </p>
        <DeadlinesLegend />
      </div>
      <div className="min-h-0 flex-1">
        <ChartSkeleton days={days} direction="ahead" />
      </div>
    </div>
  );
}

// Body only: used inside the real Activity card when the range changes.
export function ActivityBodySkeleton({ days, view = "added" }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <span role="status" className="sr-only">
        Loading activity
      </span>
      <p className="shrink-0 text-xs text-[var(--color-text-muted)]">
        <Headline />
        {view === "added" ? "tasks added" : "timetable edits"}
      </p>
      <div className="min-h-0 flex-1">
        <ChartSkeleton days={days} direction="back" />
      </div>
    </div>
  );
}

function SubjectRowSk({ i }) {
  const w = ["w-24", "w-32", "w-20", "w-28", "w-24"][i % 5];
  return (
    <li className="flex h-7 items-center gap-3 text-xs lg:h-auto lg:max-h-9 lg:min-h-0 lg:flex-1">
      <span aria-hidden="true" className="sk h-2 w-2 shrink-0 rounded-full" />
      <span className="min-w-0 flex-[5]">
        <Ink w={w} />
      </span>
      <span aria-hidden="true" className="sk h-1.5 min-w-8 flex-[2] rounded-full" />
      <span className="flex w-14 shrink-0 justify-end">
        <Ink w="w-10" />
      </span>
      <span className="flex w-8 shrink-0 justify-end">
        <Ink w="w-6" />
      </span>
    </li>
  );
}

function SubjectsBody() {
  return (
    <div className="flex flex-col gap-3 lg:h-full lg:min-h-0">
      <div className="shrink-0">
        <div aria-hidden="true" className="sk h-2.5 w-full rounded-full" />
        <div className="mt-1.5 flex items-baseline justify-between text-[10px] text-[var(--color-text-muted)]">
          <span>Weekly split</span>
          <Ink w="w-12" />
        </div>
      </div>
      <div className="relative lg:min-h-0 lg:flex-1">
        <ul className="flex flex-col gap-2 lg:absolute lg:inset-0 lg:justify-between lg:gap-1.5 lg:overflow-hidden">
          {[0, 1, 2, 3, 4].map((i) => (
            <SubjectRowSk key={i} i={i} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function DaysBody() {
  const todayN = new Date().getDay();
  return (
    <div className="flex h-full min-h-[9rem] items-stretch justify-between gap-2">
      {DAY_ORDER.map((n) => (
        <div key={n} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <span className="flex h-4 items-center">
            <span aria-hidden="true" className="sk block h-2.5 w-7 rounded-[3px]" />
          </span>
          <div aria-hidden="true" className="sk w-full flex-1 rounded-lg" />
          <span
            className={`rounded-md px-1.5 py-0.5 text-[10px] leading-none ${
              n === todayN ? TODAY_CHIP : "text-[var(--color-text-muted)]"
            }`}
          >
            {DAY_SHORT[n]}
          </span>
        </div>
      ))}
    </div>
  );
}

function HomeworkBody() {
  return (
    <div className="flex h-full min-h-0 flex-col justify-between">
      <div className="flex flex-col gap-2.5">
        <div aria-hidden="true" className="sk h-2.5 w-full rounded-full" />
        <div className="grid grid-cols-3 gap-2">
          {STATUS.map((s) => (
            <div
              key={s.key}
              className="flex flex-col gap-2 rounded-xl px-2.5 py-1.5"
              style={{ backgroundColor: tint(s.color, 10) }}
            >
              <span className="truncate text-[10px] font-medium" style={{ color: s.color }}>
                {s.label}
              </span>
              <span aria-hidden="true" className="sk block h-4 w-12 rounded-[3px]" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-medium text-[var(--color-text-muted)]">By priority</p>
        <ul className="flex flex-col gap-2">
          {PRIORITY.map((p) => (
            <li key={p.key} className="flex items-center gap-4 text-xs">
              <span className="w-14 shrink-0 text-[var(--color-text)]">{p.label}</span>
              <span aria-hidden="true" className="sk h-1.5 min-w-8 flex-1 rounded-full" />
              <span className="flex w-7 shrink-0 justify-end">
                <Ink w="w-4" />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function VaultRowSk({ w }) {
  return (
    <div className="grid grid-cols-[minmax(0,34%)_minmax(0,1fr)_5.5rem] items-center gap-3 text-xs">
      <span className="flex min-w-0 items-center gap-2">
        <span aria-hidden="true" className="sk h-2 w-2 shrink-0 rounded-sm" />
        <Ink w={w} />
      </span>
      <div aria-hidden="true" className="sk h-1.5 rounded-sm" />
      <span className="flex justify-end">
        <Ink w="w-10" />
      </span>
    </div>
  );
}

function VaultBody() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <p className="shrink-0 text-xs text-[var(--color-text-muted)]">
        <Headline />
        <Ink w="w-40" />
      </p>
      <div aria-hidden="true" className="sk h-2 w-full shrink-0 rounded-md" />
      <div className="flex min-h-0 flex-1 flex-col justify-evenly overflow-hidden">
        <VaultRowSk w="w-12" />
        <VaultRowSk w="w-16" />
        <VaultRowSk w="w-14" />
      </div>
    </div>
  );
}

export default function AnalyticsSkeleton({ days = 30, onDaysChange }) {
  const { activeWorkspace } = useWorkspace();
  // The real page shows the group dropdown when the workspace has no fixed group.
  const showGroup = activeWorkspace?.my_group == null;

  return (
    <div
      role="status"
      aria-busy="true"
      className="flex flex-col gap-4 lg:h-full lg:min-h-0 lg:overflow-hidden"
    >
      <span className="sr-only">Loading analytics</span>

      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-[var(--color-text)]">Analytics</h1>
          <p className="mt-0.5 hidden truncate text-sm text-[var(--color-text-muted)] sm:block">
            Insights for {activeWorkspace?.name ?? "your workspace"}
          </p>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          {showGroup && (
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-none">
              <div
                aria-hidden="true"
                className="sk box-border inline-flex h-8 w-full items-center justify-between gap-2 whitespace-nowrap rounded-lg border border-[var(--color-line)] px-3 text-xs font-medium sm:w-auto"
              >
                <span className="invisible">Shared classes</span>
                <ChevronDown size={13} className="invisible" />
              </div>
            </div>
          )}
          <SegmentedControl
            tone="soft"
            size="sm"
            ariaLabel="Time range"
            options={RANGE_OPTIONS}
            value={days}
            onChange={onDaysChange ?? (() => {})}
          />
        </div>
      </header>

      <div className="grid shrink-0 grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          icon={Gauge}
          label="Completed"
          value={<span aria-hidden="true" className="sk block h-[30px] w-16 rounded-md" />}
          sub={<Ink w="w-28" />}
        />
        <StatTile
          icon={Clock}
          label="Overdue"
          value={<span aria-hidden="true" className="sk block h-[30px] w-10 rounded-md" />}
          sub={<Ink w="w-32" />}
        />
        <StatTile
          icon={CalendarDays}
          label="Due in 7 days"
          value={<span aria-hidden="true" className="sk block h-[30px] w-10 rounded-md" />}
          sub={<Ink w="w-24" />}
        />
        <StatTile
          icon={BookOpen}
          label="Class time"
          value={<span aria-hidden="true" className="sk block h-[30px] w-20 rounded-md" />}
          sub={<Ink w="w-36" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-3 lg:grid-rows-[repeat(2,minmax(0,1fr))]">
        <AnalyticsTile icon={BookOpen} title="Time by subject" scroll={false} meta={<MetaBlock />}>
          <SubjectsBody />
        </AnalyticsTile>

        <AnalyticsTile
          icon={BarChart3}
          title="Time by day"
          scroll={false}
          meta={<MetaBlock w="w-20" />}
          actions={<ExpandTwin show="hidden lg:inline-block" />}
        >
          <DaysBody />
        </AnalyticsTile>

        <AnalyticsTile icon={Gauge} title="Homework status" scroll={false} meta={<MetaBlock w="w-12" />}>
          <HomeworkBody />
        </AnalyticsTile>

        <AnalyticsTile
          icon={CalendarDays}
          title="Deadlines ahead"
          scroll={false}
          meta={`next ${days} days`}
          actions={<ExpandTwin show="hidden sm:inline-block" />}
        >
          <DeadlinesBodySkeleton days={days} />
        </AnalyticsTile>

        <AnalyticsTile
          icon={ActivityIcon}
          title="Activity"
          scroll={false}
          meta={`last ${days} days`}
          actions={
            <>
              <SwitchTwin labels={["Homework", "Timetable"]} />
              <ExpandTwin show="hidden sm:inline-block" />
            </>
          }
        >
          <ActivityBodySkeleton days={days} />
        </AnalyticsTile>

        <AnalyticsTile
          icon={VaultIcon}
          title="Vault"
          scroll={false}
          meta={<MetaBlock w="w-12" />}
          actions={<ExpandTwin show="hidden sm:inline-block" />}
        >
          <VaultBody />
        </AnalyticsTile>
      </div>
    </div>
  );
}
