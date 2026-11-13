import { ArrowLeft, Eye, Pencil, Settings2 } from "lucide-react";
import Button from "../../components/ui/Button";
import { dayShortLabel } from "../../lib/days";
import { WEEKDAY_FULL } from "./grid/layout/weekdayConstants";

const DEFAULT_DAYS = [null, null, null, null, null];
const DEFAULT_ROWS = 6;
const MAX_ROWS = 8;
const MOBILE_DAYS = 3;
const HEAD_BG =
  "bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-surface))]";
const HEAD_TEXT =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]";
const STATIC_BTN = { opacity: 1, cursor: "default" };

function Sk({ className = "", delay = 0 }) {
  return (
    <span
      aria-hidden="true"
      className={`sk inline-block align-baseline ${className}`}
      style={{ "--sk-delay": `-${delay}s` }}
    />
  );
}

export default function TimetableGridSkeleton({ shape }) {
  const days = shape?.days?.length ? shape.days : DEFAULT_DAYS;
  const rowCount = Math.min(Math.max(shape?.rows || DEFAULT_ROWS, 1), MAX_ROWS);
  const rows = Array.from({ length: rowCount }, (_, i) => i);

  return (
    <div
      role="status"
      aria-busy="true"
      className="flex h-full min-h-0 flex-col"
      style={{ gap: "12px" }}
    >
      <span className="sr-only">Loading timetable</span>

      <header
        className="relative flex h-[60px] shrink-0 items-center justify-between border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div aria-hidden="true" className="flex items-center gap-2">
          <Button
            variant="secondary"
            disabled
            tabIndex={-1}
            style={STATIC_BTN}
            className="!h-9 !w-9 !p-0 sm:!h-9 sm:!w-auto sm:!px-4 whitespace-nowrap"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">All timetables</span>
          </Button>
          <Button
            variant="secondary"
            disabled
            tabIndex={-1}
            style={STATIC_BTN}
            className="!h-9 !w-9 !p-0"
          >
            <Settings2 size={15} />
          </Button>
          <div
            className="hidden h-5 w-px sm:block"
            style={{ background: "var(--color-border)" }}
          />
          <Button
            variant="secondary"
            disabled
            tabIndex={-1}
            style={STATIC_BTN}
            className="!h-9 !w-9 !p-0 sm:!h-9 sm:!w-auto sm:!px-4"
          >
            <Eye size={16} />
            <span className="hidden sm:inline">View</span>
          </Button>
        </div>

        <Button
          variant="primary"
          disabled
          tabIndex={-1}
          aria-hidden="true"
          style={STATIC_BTN}
          className="!h-9 !w-9 !p-0 sm:!h-9 sm:!w-auto sm:!px-4 whitespace-nowrap"
        >
          <Pencil size={15} />
          <span className="hidden sm:inline">Edit</span>
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-full min-h-0 w-full">
          <div className="relative flex h-full min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset,0_20px_40px_-24px_rgba(0,0,0,0.6)]">
            <div className="min-h-0 flex-1 overflow-hidden">
              <div
                className="grid h-full w-full text-sm [--time-col-w:60px] sm:[--time-col-w:170px] grid-cols-[var(--time-col-w)_repeat(var(--m-cols),minmax(0,1fr))] sm:grid-cols-[var(--time-col-w)_repeat(var(--d-cols),minmax(0,1fr))]"
                style={{
                  "--d-cols": days.length,
                  "--m-cols": Math.min(days.length, MOBILE_DAYS),
                  gridTemplateRows: `auto repeat(${rowCount}, minmax(min-content, 1fr))`,
                }}
              >
                <div
                  className={`border-b border-r border-[var(--color-border)] ${HEAD_BG} px-2 py-3 text-center ${HEAD_TEXT}`}
                >
                  Time
                </div>
                {days.map((dow, c) => (
                  <div
                    key={`h-${c}`}
                    className={`border-b border-[var(--color-border)] ${
                      c === days.length - 1 ? "" : "border-r"
                    } ${HEAD_BG} px-2 py-3 text-center ${HEAD_TEXT} ${
                      c >= MOBILE_DAYS ? "hidden sm:block" : ""
                    }`}
                  >
                    {dow == null ? (
                      <Sk className="h-[0.72em] w-16 rounded-[3px]" delay={c * 0.15} />
                    ) : (
                      <>
                        <span className="hidden sm:inline">{WEEKDAY_FULL[dow]}</span>
                        <span className="sm:hidden">{dayShortLabel(dow)}</span>
                      </>
                    )}
                  </div>
                ))}

                {rows.map((r) => {
                  const isLastRow = r === rowCount - 1;
                  return (
                    <div key={`r-${r}`} className="contents">
                      <div
                        className={`flex h-full items-center justify-center overflow-hidden border-r border-[var(--color-border)] px-1 sm:px-3 ${
                          isLastRow ? "" : "border-b"
                        } ${HEAD_BG}`}
                      >
                        <div className="flex items-center justify-center gap-2 py-1">
                          <span className="hidden sm:block">
                            <Sk className="h-8 w-8 rounded-md" delay={r * 0.2} />
                          </span>
                          <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-1.5">
                            <Sk className="h-3 w-9 rounded-[3px]" delay={r * 0.2} />
                            <Sk className="h-3 w-9 rounded-[3px]" delay={r * 0.2} />
                          </div>
                        </div>
                      </div>
                      {days.map((_, c) => (
                        <div
                          key={`c-${r}-${c}`}
                          className={`border-[var(--color-border)] ${
                            isLastRow ? "" : "border-b"
                          } ${c === days.length - 1 ? "" : "border-r"} ${
                            c >= MOBILE_DAYS ? "hidden sm:block" : ""
                          }`}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
