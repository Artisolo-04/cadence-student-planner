import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  ClipboardList,
  Coffee,
  FolderOpen,
  Gauge,
  Target,
  Wifi,
} from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const LABEL =
  "flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]";

const CARD =
  "relative overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] backdrop-blur-xl";

const STUDENT_WASH =
  "linear-gradient(140deg, color-mix(in srgb, var(--color-primary) 26%, transparent) 0%, color-mix(in srgb, var(--color-tint) 12%, transparent) 60%, transparent 100%)";
const PRIMARY_WASH =
  "linear-gradient(150deg, color-mix(in srgb, var(--color-primary) 18%, transparent) 0%, color-mix(in srgb, var(--color-tint) 8%, transparent) 60%, transparent 100%)";
const TINT_WASH =
  "linear-gradient(150deg, color-mix(in srgb, var(--color-tint) 14%, transparent) 0%, transparent 70%)";
const NEXT_WASH =
  "linear-gradient(150deg, color-mix(in srgb, var(--color-primary) 22%, transparent) 0%, color-mix(in srgb, var(--color-primary) 10%, transparent) 60%, transparent 100%)";
const ROW_WASH =
  "linear-gradient(135deg, color-mix(in srgb, var(--color-text-muted) 10%, transparent) 0%, transparent 70%)";

const TRACK_STYLE = {
  backgroundColor: "color-mix(in srgb, var(--color-primary) 13%, transparent)",
  borderColor: "color-mix(in srgb, var(--color-primary) 22%, transparent)",
};

function Block({ className = "", style }) {
  const radius = className.includes("rounded") ? "" : "rounded-md";
  return <div aria-hidden="true" className={`sk ${radius} ${className}`} style={style} />;
}

function T({ as: Tag = "p", size = "text-sm", w = "w-24", className = "" }) {
  return (
    <Tag className={`${size} ${className}`}>
      <span
        aria-hidden="true"
        className={`sk inline-block h-[0.72em] max-w-full rounded-[3px] align-baseline ${w}`}
      />
    </Tag>
  );
}

function Pill({ children, className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`sk inline-flex shrink-0 items-center whitespace-nowrap border border-[var(--color-line)] ${className}`}
    >
      <span className="invisible">{children}</span>
    </span>
  );
}

function Card({ className = "", wash, delay = 0, children }) {
  return (
    <div
      className={`${CARD} ${className}`}
      style={{ backgroundImage: wash, "--sk-delay": `-${delay}s` }}
    >
      {children}
    </div>
  );
}

function Glow({ className = "-right-10 -top-10 h-36 w-36" }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-full opacity-20 blur-3xl ${className}`}
      style={{ backgroundColor: "var(--color-primary)" }}
    />
  );
}

function StudentSkeleton() {
  return (
    <Card className="flex h-full w-full" wash={STUDENT_WASH} delay={0}>
      <Glow className="-right-12 -top-14 h-44 w-44" />
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
          <div className={LABEL}>Cadence</div>
          <Wifi size={16} className="rotate-90 text-[var(--color-text-muted)] opacity-60" />
        </div>

        <div className="mt-3 flex flex-1 items-center gap-5">
          <Block className="h-24 w-24 shrink-0 rounded-xl" />

          <div className="min-w-0 flex-1">
            <T size="text-lg font-semibold leading-tight" w="w-4/5" />
            <div className="mt-1 flex flex-col gap-0.5 text-sm">
              <span className="flex items-center gap-1.5">
                <Block className="h-3.5 w-3.5 shrink-0 rounded" />
                <T as="span" size="text-sm" w="w-28" />
              </span>
              <T as="span" size="text-xs" w="w-14" className="pl-[20px]" />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-[var(--color-line)] pt-3">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-[var(--color-text-muted)]">
              Student ID
            </p>
            <T size="font-mono text-sm tracking-wide" w="w-24" />
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-wider text-[var(--color-text-muted)]">
              Valid thru
            </p>
            <T size="font-mono text-sm tracking-wide" w="w-16" />
          </div>
        </div>
      </div>
    </Card>
  );
}

const STATS = [
  { label: "Completed", color: "var(--color-primary)" },
  { label: "Overdue", color: "var(--color-danger)" },
  { label: "Pending", color: "var(--color-text-muted)" },
];

function VelocitySkeleton() {
  return (
    <Card className="flex h-full flex-col justify-between gap-2 p-5" wash={TINT_WASH} delay={0.12}>
      <div className="flex shrink-0 items-center justify-between">
        <div className={LABEL}>
          <Gauge size={12} />
          Velocity Ring
        </div>
        <T as="span" size="text-[10px] font-mono" w="w-14" />
      </div>

      <div className="flex flex-row items-baseline gap-2">
        <T as="span" size="text-5xl font-bold leading-none" w="w-24" />
        <span className="text-xs text-[var(--color-text-muted)]">of tasks done</span>
      </div>

      <div className="grid shrink-0 grid-cols-3 gap-1.5">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-1 rounded-lg border border-[var(--color-line)] px-1.5 py-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
            style={{
              backgroundImage: `linear-gradient(150deg, color-mix(in srgb, ${stat.color} 22%, transparent) 0%, color-mix(in srgb, ${stat.color} 6%, transparent) 100%)`,
            }}
          >
            <span className="flex items-center justify-center gap-1">
              <T as="span" size="font-mono text-sm font-semibold" w="w-5" />
            </span>
            <span className="text-center text-[8px] uppercase tracking-wide text-[var(--color-text-muted)]">
              {stat.label}
            </span>
            <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--color-fill-3)]" />
          </div>
        ))}
      </div>
    </Card>
  );
}

const BAR_HEIGHTS = [72, 100, 48, 76, 66, 38, 52];

export function WeeklySkeleton() {
  return (
    <Card className="flex h-full flex-col p-5" wash={TINT_WASH} delay={0.24}>
      <div className="flex items-center justify-between">
        <div className={LABEL}>
          <BarChart3 size={12} />
          Weekly Intensity
        </div>
        <T as="span" size="text-[10px] font-mono" w="w-16" />
      </div>

      <div className="mt-3 flex min-h-0 flex-1 items-stretch justify-between gap-2">
        {DAYS.map((label, i) => (
          <div key={label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <div
              className="relative w-full flex-1 overflow-hidden rounded-[5px] border"
              style={TRACK_STYLE}
            >
              <Block
                className="absolute inset-x-0 bottom-0 rounded-[4px]"
                style={{ height: `${BAR_HEIGHTS[i]}%` }}
              />
            </div>
            <span className="text-[9px] leading-none text-[var(--color-text-muted)]">{label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function NextUpSkeleton() {
  return (
    <Card className="flex h-full flex-col p-5" wash={NEXT_WASH} delay={0.06}>
      <Glow />
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center justify-between">
          <div className={LABEL}>
            <ArrowUpRight size={12} />
            Next Up
          </div>
          <div className="flex items-center gap-2">
            <Pill className="rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wide">
              {"ALL\u00A0\u00A0\u00A0"}
            </Pill>
            <Pill className="rounded-md px-2 py-1 font-mono text-[11px] font-semibold">
              08:30–10:00
            </Pill>
            <Pill className="rounded-md px-2 py-1 text-[11px] font-bold">in 6h 10m</Pill>
          </div>
        </div>

        <T size="mt-3 text-xl font-semibold leading-tight" w="w-3/5 max-w-[22rem]" />
        <T size="mt-1 text-xs" w="w-2/5 max-w-[12rem]" />
        <div className="mt-auto pt-3" />
      </div>
    </Card>
  );
}

const DUE_WIDTHS = ["w-3/5", "w-2/3", "w-1/2"];
const DUE_SUB = ["w-24", "w-20", "w-28"];

function DueSoonSkeleton() {
  return (
    <Card className="flex flex-col p-5 lg:h-full" wash={PRIMARY_WASH} delay={0.18}>
      <Glow />
      <div className="relative z-10 flex flex-col lg:min-h-0 lg:flex-1">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className={LABEL}>
            <ClipboardList size={12} />
            Intercept Queue
          </div>
          <div className="flex items-center gap-3">
            <Block className="h-8 w-44 rounded-lg" />
            <T as="span" size="text-xs" w="w-[74px]" />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-[var(--color-line)] pt-3.5 lg:min-h-0 lg:flex-1">
          <div
            className="flex flex-col gap-1.5 lg:grid lg:min-h-0 lg:flex-1"
            style={{ gridTemplateRows: "repeat(3, minmax(0, 1fr))", alignContent: "stretch" }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex min-w-0 items-center gap-3 rounded-md px-3 py-2 lg:h-full lg:min-h-0"
                style={{ backgroundImage: ROW_WASH }}
              >
                <div className="min-w-0 flex-1">
                  <T size="text-[13px] font-medium leading-tight" w={DUE_WIDTHS[i]} />
                  <div className="flex min-w-0 items-center gap-1.5">
                    <T as="span" size="mt-0.5 text-[11px] leading-tight" w={DUE_SUB[i]} />
                  </div>
                </div>
                <Pill className="rounded px-2 py-0.5 text-[10px] font-bold">30d overdue</Pill>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

const VAULT_WIDTHS = ["w-1/2", "w-3/5", "w-2/5"];
const VAULT_SUB = ["w-28", "w-24", "w-32"];

function VaultSkeleton() {
  return (
    <Card className="flex flex-col p-5 lg:h-full lg:min-h-0" wash={PRIMARY_WASH} delay={0.3}>
      <Glow />
      <div className="relative z-10 flex flex-col lg:min-h-0 lg:flex-1">
        <div className="flex shrink-0 items-center justify-between">
          <div className={LABEL}>
            <FolderOpen size={12} />
            Quick Vault Access
          </div>
          <span className="flex items-center gap-1 text-xs font-medium text-[var(--color-text-muted)]">
            Open vault
            <ArrowRight size={12} />
          </span>
        </div>

        <div
          className="mt-4 flex flex-col gap-1.5 border-t border-[var(--color-line)] pt-3.5 lg:grid lg:min-h-0 lg:flex-1"
          style={{ gridTemplateRows: "repeat(3, minmax(0, 1fr))", alignContent: "stretch" }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex min-w-0 items-center gap-3 rounded-md px-3 py-1.5 lg:h-full lg:min-h-0"
              style={{ backgroundImage: ROW_WASH }}
            >
              <Block className="h-7 w-7 shrink-0 rounded" />
              <div className="min-w-0 flex-1">
                <T size="text-sm font-medium" w={VAULT_WIDTHS[i]} />
                <T size="text-xs" w={VAULT_SUB[i]} />
              </div>
              <Pill className="gap-1 rounded px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider">
                <>VIEW<span className="inline-block w-[14px]" /></>
              </Pill>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

const SCRUBBER = [
  ["w-[34%]", ""],
  ["w-[8%]", "bg-[var(--color-fill-4)]"],
  ["w-[34%]", ""],
  ["w-[8%]", "bg-[var(--color-fill-4)]"],
  ["w-[16%]", ""],
];

function FocusItem({ last, line1, line2 }) {
  return (
    <div className="flex gap-2">
      <div className="flex flex-col items-center">
        <Block className="h-5 w-5 shrink-0 rounded-md" />
        {!last && <Block className="my-1 w-[2px] flex-1 rounded-full" />}
      </div>

      <div className={`min-w-0 flex-1 ${last ? "pb-0.5" : "pb-4"}`}>
        <div className="w-full min-w-0 rounded-lg py-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <T as="span" size="font-mono text-[11px]" w="w-24" />
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <Pill className="rounded-md px-1.5 py-0.5 font-mono text-[9px]">1h 30m</Pill>
              <Pill className="rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                All
              </Pill>
            </span>
          </div>
          <T size="mt-0.5 text-sm" w={line1} />
          <T size="text-[11px]" w={line2} />
        </div>

        {!last && (
          <div className="mt-2 w-full">
            <div className="flex w-full items-center justify-between gap-3 rounded-md border border-dashed border-[var(--color-line-strong)] px-2 py-1 font-mono text-[10px] text-[var(--color-text-muted)]">
              <span className="inline-flex min-w-0 items-center gap-1">
                <Coffee size={10} />
                <span>Break</span>
              </span>
              <T as="span" size="shrink-0" w="w-12" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function FocusSkeleton() {
  const todayIdx = (new Date().getDay() + 6) % 7;

  return (
    <Card className="flex h-full w-full flex-col p-5" wash={PRIMARY_WASH} delay={0.1}>
      <div className="relative z-10 flex h-full flex-col">
        <div className={LABEL}>
          <Target size={12} />
          Focus
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-fill-1)] p-1">
          {DAYS.map((d, i) => (
            <div
              key={d}
              className={`rounded-md py-1.5 text-center text-[9px] font-bold uppercase tracking-wide ${
                i === todayIdx
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)] opacity-60"
                  : "text-[var(--color-text-muted)]"
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between font-mono text-[10px] text-[var(--color-text-muted)]">
            <T as="span" size="" w="w-14" />
            <T as="span" size="" w="w-14" />
          </div>
          <div className="relative mt-1.5 flex h-2 w-full overflow-hidden rounded-full bg-[var(--color-fill-3)]">
            {SCRUBBER.map(([w, extra], i) => (
              <div key={i} className={`sk h-full rounded-none ${w} ${extra}`} />
            ))}
          </div>
        </div>

        <div className="mt-4 flex min-h-0 flex-1 border-t border-[var(--color-line)] pt-2">
          <div className="relative min-w-0 flex-1 overflow-hidden pl-1 pr-1 pt-1">
            <FocusItem line1="w-3/5" line2="w-2/5" />
            <FocusItem line1="w-2/3" line2="w-1/3" />
            <FocusItem last line1="w-1/2" line2="w-2/5" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function DashboardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading dashboard"
      aria-busy="true"
      className="pointer-events-none grid select-none grid-cols-1 gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[360px_minmax(0,1fr)_380px] lg:overflow-hidden"
    >
      <span className="sr-only">Loading dashboard…</span>

      <aside aria-hidden="true" className="flex flex-col gap-4 lg:min-h-0 lg:overflow-hidden">
        <div className="shrink-0">
          <StudentSkeleton />
        </div>
        <div className="min-h-[9rem] flex-1">
          <VelocitySkeleton />
        </div>
        <div className="min-h-[9rem] flex-1">
          <WeeklySkeleton />
        </div>
      </aside>

      <main aria-hidden="true" className="flex min-h-0 flex-col gap-4 lg:overflow-hidden">
        <div className="shrink-0">
          <NextUpSkeleton />
        </div>
        <div className="lg:min-h-0 lg:flex-1">
          <div className="grid grid-cols-1 gap-4 lg:h-full lg:min-h-0 lg:grid-rows-[repeat(2,minmax(0,1fr))]">
            <DueSoonSkeleton />
            <VaultSkeleton />
          </div>
        </div>
      </main>

      <aside aria-hidden="true" className="min-h-[28rem] lg:min-h-0 lg:overflow-hidden">
        <FocusSkeleton />
      </aside>
    </div>
  );
}

export function DueHeaderSkeleton() {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <Block className="h-8 w-44 rounded-lg" />
      <T as="span" size="text-xs" w="w-[74px]" />
    </div>
  );
}

export function DueRowsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading tasks"
      className="mt-4 flex flex-col gap-3 border-t border-[var(--color-line)] pt-3.5 lg:min-h-0 lg:flex-1"
    >
      <div
        aria-hidden="true"
        className="flex flex-col gap-1.5 lg:grid lg:min-h-0 lg:flex-1"
        style={{ gridTemplateRows: "repeat(3, minmax(0, 1fr))", alignContent: "stretch" }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex min-w-0 items-center gap-3 rounded-md px-3 py-2 lg:h-full lg:min-h-0"
            style={{ backgroundImage: ROW_WASH }}
          >
            <div className="min-w-0 flex-1">
              <T size="text-[13px] font-medium leading-tight" w={DUE_WIDTHS[i]} />
              <div className="flex min-w-0 items-center gap-1.5">
                <T as="span" size="mt-0.5 text-[11px] leading-tight" w={DUE_SUB[i]} />
              </div>
            </div>
            <Pill className="rounded px-2 py-0.5 text-[10px] font-bold">30d overdue</Pill>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VaultRowsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading vault"
      className="mt-4 flex flex-col gap-1.5 border-t border-[var(--color-line)] pt-3.5 lg:grid lg:min-h-0 lg:flex-1"
      style={{ gridTemplateRows: "repeat(3, minmax(0, 1fr))", alignContent: "stretch" }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          aria-hidden="true"
          className="flex min-w-0 items-center gap-3 rounded-md px-3 py-1.5 lg:h-full lg:min-h-0"
          style={{ backgroundImage: ROW_WASH }}
        >
          <Block className="h-7 w-7 shrink-0 rounded" />
          <div className="min-w-0 flex-1">
            <T size="text-sm font-medium" w={VAULT_WIDTHS[i]} />
            <T size="text-xs" w={VAULT_SUB[i]} />
          </div>
          <Pill className="gap-1 rounded px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider">
            <>VIEW<span className="inline-block w-[14px]" /></>
          </Pill>
        </div>
      ))}
    </div>
  );
}
