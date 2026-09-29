import { useMemo, useState } from "react";
import { Clock3, Flame, SplitSquareHorizontal, AlertCircle } from "lucide-react";
import useAnalyticsData from "./useAnalyticsData";
import DailyLoadChart from "./DailyLoadChart";
import SubjectDonut from "./SubjectDonut";
import FacultyBars from "./FacultyBars";
import TrackFractureBar from "./TrackFractureBar";
import {
  filterEntriesForGroup,
  computeGroupDailyLoad,
  computeGroupSubjectStats,
  computeGroupFacultyStats,
  computeGroupWeeklyHours,
  computeGroupTrackFracture,
} from "./groupAnalytics";
import { DAY_LABELS_FULL, hoursToLabel } from "./chartTokens";

const TABS = [
  { id: "time", label: "Time & Load Structures" },
  { id: "curriculum", label: "Curriculum & Faculty" },
];

const GROUP_VIEWS = [
  { id: "all", label: "All" },
  { id: "g1", label: "G1" },
  { id: "g2", label: "G2" },
];

const EMPTY_TRACK_FRACTURE = {
  fullWidthMinutesPercent: 0,
  splitMinutesPercent: 0,
  fullWidthPercent: 0,
  splitPercent: 0,
};

export default function AnalyticsPanel({ workspace, slots = [] }) {
  const { status, data } = useAnalyticsData(
    workspace?.timetable?.id,
    workspace?.timetable?.my_group
  );
  const [tab, setTab] = useState("time");
  const [activeGroupFilter, setActiveGroupFilter] = useState("all");

  const serverDailyLoad = data?.dailyLoad ?? [];
  const serverSubjectStats = data?.subjectDurationRatios ?? [];
  const serverFacultyStats = data?.facultyAllocation ?? [];
  const serverTotalWeeklyHours = data?.totalWeeklyHours ?? 0;
  const serverTrackFracture = data?.trackFracture ?? EMPTY_TRACK_FRACTURE;
  const rawEntries = data?.rawEntries ?? [];

  const isFiltered = activeGroupFilter !== "all";
  const scopeLabel = GROUP_VIEWS.find((g) => g.id === activeGroupFilter)?.label ?? "All groups";

  const filteredEntries = useMemo(
    () => filterEntriesForGroup(rawEntries, activeGroupFilter),
    [rawEntries, activeGroupFilter]
  );

  const displayedDailyLoad = useMemo(() => {
    if (!isFiltered) return serverDailyLoad;
    return computeGroupDailyLoad(rawEntries, slots, activeGroupFilter);
  }, [isFiltered, serverDailyLoad, rawEntries, slots, activeGroupFilter]);

  const displayedSubjectStats = useMemo(() => {
    if (!isFiltered) return serverSubjectStats;
    return computeGroupSubjectStats(rawEntries, slots, activeGroupFilter);
  }, [isFiltered, serverSubjectStats, rawEntries, slots, activeGroupFilter]);

  const displayedFacultyStats = useMemo(() => {
    if (!isFiltered) return serverFacultyStats;
    return computeGroupFacultyStats(rawEntries, slots, activeGroupFilter);
  }, [isFiltered, serverFacultyStats, rawEntries, slots, activeGroupFilter]);

  const displayedTotalWeeklyHours = useMemo(() => {
    if (!isFiltered) return serverTotalWeeklyHours;
    return computeGroupWeeklyHours(rawEntries, slots, activeGroupFilter);
  }, [isFiltered, serverTotalWeeklyHours, rawEntries, slots, activeGroupFilter]);

  const displayedTrackFracture = useMemo(() => {
    if (!isFiltered) return serverTrackFracture;
    return computeGroupTrackFracture(rawEntries, slots, activeGroupFilter);
  }, [isFiltered, serverTrackFracture, rawEntries, slots, activeGroupFilter]);

  if (status === "loading") {
    return (
      <Shell>
        <p className="text-sm text-[var(--color-text-muted)]">Loading analytics…</p>
      </Shell>
    );
  }

  if (status === "error") {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-2 text-center">
          <AlertCircle size={22} className="text-[var(--color-text-muted)]" />
          <p className="text-sm text-[var(--color-text)]">
            Couldn't load analytics right now.
          </p>
        </div>
      </Shell>
    );
  }

  if (!data) return null;

  const { longestDay } = data;

  return (
    <div className="flex flex-1 flex-col gap-4 lg:min-h-0">
      <section className="grid shrink-0 grid-cols-1 divide-y divide-[var(--color-border)] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/60 shadow-lg sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Stat
          icon={<Clock3 size={16} />}
          tint="#5eead4"
          label="Weekly hours"
          value={hoursToLabel(displayedTotalWeeklyHours)}
        />
        <Stat
          icon={<Flame size={16} />}
          tint="#fbbf24"
          label="Busiest day"
          value={longestDay ? DAY_LABELS_FULL[longestDay.day] : "—"}
          sub={longestDay ? `${hoursToLabel(longestDay.hours)} scheduled` : "No entries yet"}
        />
        <Stat
          icon={<SplitSquareHorizontal size={16} />}
          tint="#fb7185"
          label="Split tracks"
          value={`${displayedTrackFracture.splitMinutesPercent}%`}
          sub="of scheduled time"
        />
      </section>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Analytics categories"
          className="inline-flex self-start rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-1"
        >
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                tab === item.id
                  ? "bg-[var(--color-surface-alt)] text-[var(--color-text)] shadow-sm"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div
          role="tablist"
          aria-label="Group view"
          className="inline-flex shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-1"
        >
          {GROUP_VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={activeGroupFilter === item.id}
              onClick={() => setActiveGroupFilter(item.id)}
              className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                activeGroupFilter === item.id
                  ? "bg-[var(--color-surface-alt)] text-[var(--color-text)] shadow-sm"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "time" ? (
        <div className="grid flex-1 grid-cols-1 gap-4 lg:min-h-0 lg:[grid-template-columns:65fr_35fr]">
          <section className="relative min-h-[320px] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-4 shadow-lg sm:p-6 lg:min-h-0">
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-20 blur-3xl"
              style={{ background: "radial-gradient(circle, #5eead4 0%, transparent 70%)" }}
            />
            <div className="relative h-full min-h-[260px] lg:min-h-0">
              <DailyLoadChart dailyLoad={displayedDailyLoad} viewMode={activeGroupFilter} />
            </div>
          </section>

          <section className="min-h-[200px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/40 p-4 sm:p-6 lg:min-h-0">
            <TrackFractureBar trackFracture={displayedTrackFracture} scopeLabel={scopeLabel} />
          </section>
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-1 gap-4 lg:min-h-0 lg:grid-cols-2">
          <section className="flex min-h-[320px] flex-col rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/40 p-4 sm:p-6 lg:min-h-0">
            <h3 className="mb-5 shrink-0 text-[15px] font-medium text-[var(--color-text)]">
              Time Invested per Subject
            </h3>
            <div className="min-h-[240px] flex-1 lg:min-h-0">
              <SubjectDonut
                subjects={displayedSubjectStats}
                totalWeeklyHours={displayedTotalWeeklyHours}
                rawEntries={filteredEntries}
                slots={slots}
              />
            </div>
          </section>

          <section className="flex min-h-[320px] flex-col rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/40 p-4 sm:p-6 lg:min-h-0">
            <h3 className="mb-5 shrink-0 text-[15px] font-medium text-[var(--color-text)]">
              Faculty load
            </h3>
            <div className="min-h-[240px] flex-1 lg:min-h-0">
              <FacultyBars
                faculty={displayedFacultyStats}
                rawEntries={filteredEntries}
                slots={slots}
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Shell({ children }) {
  return (
    <div className="flex flex-1 min-h-0 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 shadow-lg">
      {children}
    </div>
  );
}

function Stat({ icon, tint, label, value, sub }) {
  return (
    <div className="flex items-center gap-3.5 px-4 py-4 sm:px-6 sm:py-5">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${tint}1f`, color: tint }}
      >
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
        <p className="truncate text-2xl font-semibold tracking-tight text-[var(--color-text)] tabular-nums">
          {value}
        </p>
        {sub && <p className="truncate text-[11px] text-[var(--color-text-muted)]">{sub}</p>}
      </div>
    </div>
  );
}
