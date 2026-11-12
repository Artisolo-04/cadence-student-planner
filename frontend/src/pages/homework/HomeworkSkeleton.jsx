import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowUpDown,
  ChevronDown,
  Clock,
  Flag,
  LayoutGrid,
  List as ListIcon,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import Button from "../../components/ui/Button";
import { CustomScrollbar } from "../../components/ui/CustomScrollbar";
import useScrollFade from "../../hooks/useScrollFade";
import { DUE_FILTERS, STATUS_OPTIONS } from "./homeworkUtils";
import { ROW_GRID } from "./list/HomeworkTable";

const DEFAULT_SHAPE = [
  [true, true, 0],
  [false, true, 1],
  [true, true, 0],
  [false, true, 2],
  [true, true, 1],
  [false, true, 0],
];

const STATUS_LABELS = ["To do", "In progress", "Done"];
const DUE_VALUES = ["overdue", "today", "week", "later", "none"];
const STATUS_VALUES = STATUS_OPTIONS.map((o) => o.value);
const TITLE_W = ["w-3/5", "w-1/2", "w-2/3", "w-2/5"];
const NOTE_W = ["w-2/5", "w-1/3", "w-1/2", "w-3/5"];
const ROW_WASH =
  "linear-gradient(155deg, color-mix(in srgb, var(--color-primary) 16%, transparent) 0%, color-mix(in srgb, var(--color-tint) 5%, transparent) 55%, transparent 100%)";

// Same URL parsing as useHomeworkFilters, so the bar already shows the right filter.
function readUrlFilters(params) {
  const due = params.get("due");
  const statuses = (params.get("status") || "").split(",").filter((s) => STATUS_VALUES.includes(s));
  return { due: DUE_VALUES.includes(due) ? due : "all", statusCount: statuses.length };
}

function useIsSm() {
  const query = "(min-width: 640px)";
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return matches;
}

function Block({ className = "" }) {
  return <div aria-hidden="true" className={`sk ${className}`} />;
}

function Bar({ className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`sk inline-block h-[0.72em] max-w-full rounded-[3px] align-baseline ${className}`}
    />
  );
}

function Chip({ className = "", children }) {
  return (
    <span
      aria-hidden="true"
      className={`sk inline-flex w-fit shrink-0 items-center whitespace-nowrap border border-[var(--color-line)] ${className}`}
    >
      <span className="invisible inline-flex items-center gap-1.5">{children}</span>
    </span>
  );
}

// Twin of <Dropdown size="sm">: same padding, gap-8 and chevron space, so the width matches.
function StatusPill({ label, height }) {
  return (
    <span
      aria-hidden="true"
      style={{ height }}
      className="sk box-border flex w-auto items-center gap-8 whitespace-nowrap rounded-lg border border-[var(--color-line)] px-2 text-[11px] font-medium leading-none"
    >
      <span className="invisible">{label}</span>
      <span className="inline-block w-[11px]" />
    </span>
  );
}

function DesktopRow({ index, hasNotes, hasSubject, statusIdx }) {
  return (
    <div
      aria-hidden="true"
      style={{ backgroundImage: ROW_WASH, "--sk-delay": `-${index * 0.2}s` }}
      className={`row-elevated relative hidden sm:grid ${ROW_GRID} items-center gap-4 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-fill-1)] px-3.5 py-3 backdrop-blur-xl`}
    >
      <div className="flex items-center">
        <Block className="h-5 w-5 rounded-md" />
      </div>

      <div className="flex items-center">
        <Chip className="rounded-lg px-2 py-1 text-[11px] font-medium">
          <Flag size={12} />
          Normal
        </Chip>
      </div>

      <div className="flex min-w-0 flex-col justify-center gap-0.5">
        <p className="truncate text-sm font-semibold">
          <Bar className={TITLE_W[index % 4]} />
        </p>
        {hasNotes && (
          <p className="truncate text-xs">
            <Bar className={NOTE_W[index % 4]} />
          </p>
        )}
      </div>

      <div />

      <div className="flex min-w-0 items-center">
        <Chip className="rounded-lg px-2 py-1 text-[11px] font-medium">
          {hasSubject ? "Mathematics" : "No subject"}
        </Chip>
      </div>

      <div className="flex items-center">
        <Chip className="rounded-lg px-2 py-1 text-[11px] font-medium">
          <Clock size={12} />
          Mon, Jan 00
        </Chip>
      </div>

      <div className="flex items-center">
        <StatusPill label={STATUS_LABELS[statusIdx]} height="30px" />
      </div>

      <div />
    </div>
  );
}

function MobileCard({ index, hasNotes, hasSubject, statusIdx }) {
  const iconBtn =
    "flex h-[26px] w-[26px] items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-fill-1)] text-[var(--color-text-muted)]";
  return (
    <article
      aria-hidden="true"
      style={{ backgroundImage: ROW_WASH, "--sk-delay": `-${index * 0.2}s` }}
      className="row-elevated relative flex flex-col gap-3 overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-fill-1)] p-3.5 backdrop-blur-xl sm:hidden"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <Chip className="h-[26px] rounded-lg px-2 text-[11px] font-medium">
            {hasSubject ? "Mathematics" : "No subject"}
          </Chip>
          <Chip className="h-[26px] rounded-lg px-2 text-[11px] font-medium">
            <Flag size={11} />
            Normal
          </Chip>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className={iconBtn}>
            <Pencil size={11} />
          </span>
          <span className={iconBtn}>
            <Trash2 size={11} />
          </span>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-5 items-center">
          <Block className="h-5 w-5 rounded-md" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-sm font-semibold leading-5">
            <Bar className={TITLE_W[index % 4]} />
          </p>
          {hasNotes && (
            <p className="text-xs">
              <Bar className={NOTE_W[index % 4]} />
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Chip className="h-[26px] rounded-lg px-2 text-[11px] font-medium">
          <Clock size={11} />
          Mon, Jan 00
        </Chip>
        <div className="flex h-[26px] items-center">
          <StatusPill label={STATUS_LABELS[statusIdx]} height="26px" />
        </div>
      </div>
    </article>
  );
}

export default function HomeworkSkeleton({ shape }) {
  const rows = shape?.length ? shape : DEFAULT_SHAPE;
  const { scrollRef, showTopFade, showBottomFade, updateScrollFades } = useScrollFade(rows);
  const [searchParams] = useSearchParams();
  const isSm = useIsSm();

  const { due, statusCount } = readUrlFilters(searchParams);
  const dueName = due === "all" ? "All dates" : DUE_FILTERS.find((o) => o.value === due)?.label ?? "All dates";
  const dueTone =
    due === "all"
      ? "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
      : due === "overdue"
        ? "border-[var(--color-danger)] bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
        : "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]";
  const panelCount = isSm ? statusCount : statusCount + (due !== "all" ? 1 : 0);
  const highlighted = panelCount > 0;

  return (
    <div role="status" aria-busy="true" className="flex h-full w-full min-h-0 flex-col gap-5">
      <span className="sr-only">Loading homework</span>

      <header className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Your homework</h2>
          <p className="mt-1 hidden text-sm text-[var(--color-text-muted)] sm:block">
            Track what's due and mark it off as you go.
          </p>
        </div>
        <div className="flex w-full flex-nowrap items-center gap-2 sm:w-auto sm:shrink-0">
          <div
            aria-hidden="true"
            className="hidden h-9 items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-1 sm:flex"
          >
            <span className="flex h-full items-center justify-center gap-1.5 rounded-md bg-[var(--color-primary)] px-3 text-xs font-medium text-[var(--color-primary-fg)] shadow-sm">
              <ListIcon size={14} strokeWidth={2.25} />
              List
            </span>
            <span className="flex h-full items-center justify-center gap-1.5 rounded-md px-3 text-xs font-medium text-[var(--color-text-muted)]">
              <LayoutGrid size={14} strokeWidth={2.25} />
              Board
            </span>
          </div>
          <Button
            type="button"
            disabled
            tabIndex={-1}
            aria-hidden="true"
            style={{ opacity: 1, cursor: "default" }}
            className="h-9 flex-1 justify-center px-2.5 sm:flex-none sm:px-4"
          >
            <Plus size={16} />
            <span className="text-xs sm:text-sm">New homework</span>
          </Button>
        </div>
      </header>

      <div aria-hidden="true" className="flex shrink-0 items-stretch gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <div className="w-full truncate rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-9 pr-9 text-sm text-[var(--color-text-muted)]">
            Search homework...
          </div>
        </div>

        <div className="relative hidden w-48 shrink-0 sm:block">
          <div
            className={`flex h-full w-full items-center justify-between gap-2 whitespace-nowrap rounded-lg border px-3 py-2 text-sm ${dueTone}`}
          >
            <span className="min-w-0 flex-1 truncate text-left">{dueName}</span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="sk inline-block h-5 min-w-[22px] rounded-md" />
              <ChevronDown size={14} />
            </span>
          </div>
        </div>

        <div className="relative flex shrink-0">
          <div className="inline-flex aspect-square items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-0 text-sm text-[var(--color-text)] md:aspect-auto md:w-60 md:justify-between md:px-3 md:py-2">
            <span className="flex min-w-0 items-center gap-2">
              <ArrowUpDown size={14} className="shrink-0 text-[var(--color-text-muted)]" />
              <span className="hidden truncate md:inline">Due date</span>
            </span>
            <span className="hidden shrink-0 items-center gap-2 md:flex">
              <span className="inline-flex items-center whitespace-nowrap rounded-md bg-[var(--color-primary)]/15 px-1.5 py-0.5 text-xs font-semibold text-[var(--color-primary)]">
                Soonest
              </span>
              <ChevronDown size={14} />
            </span>
          </div>
        </div>

        <div
          className={`relative inline-flex aspect-square items-center justify-center gap-2 rounded-lg border p-0 text-sm font-medium sm:aspect-auto sm:px-3 sm:py-2 ${
            highlighted
              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
              : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]"
          }`}
        >
          <SlidersHorizontal size={14} />
          <span className="hidden sm:inline">Filters</span>
          {panelCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-bold text-[var(--color-primary-fg)] sm:static">
              {panelCount}
            </span>
          )}
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">
        <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 backdrop-blur-xl sm:p-4">
          <div className="relative flex min-h-0 flex-1 p-0 sm:p-2">
            <div
              ref={scrollRef}
              onScroll={updateScrollFades}
              className="scrollbar-hidden h-full min-w-0 flex-1 overflow-y-scroll rounded-xl"
            >
              <div className="flex flex-col gap-2">
                {rows.map(([hasNotes, hasSubject, statusIdx], i) => (
                  <div key={i} className="contents">
                    <DesktopRow index={i} hasNotes={hasNotes} hasSubject={hasSubject} statusIdx={statusIdx} />
                    <MobileCard index={i} hasNotes={hasNotes} hasSubject={hasSubject} statusIdx={statusIdx} />
                  </div>
                ))}
              </div>
            </div>

            <div aria-hidden="true" className="contents">
              <CustomScrollbar scrollRef={scrollRef} />
            </div>

            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-12 bg-gradient-to-b from-[var(--color-surface)] to-transparent transition-opacity duration-200 sm:h-16 ${
                showTopFade ? "opacity-100 sm:opacity-70" : "opacity-0"
              }`}
            />
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-[var(--color-surface)] to-transparent transition-opacity duration-200 sm:h-16 ${
                showBottomFade ? "opacity-100 sm:opacity-70" : "opacity-0"
              }`}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
