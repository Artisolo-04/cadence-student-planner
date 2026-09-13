import { useEffect, useRef, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, LayoutGrid } from "lucide-react";

const DAY_LABELS = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

function timeValue(value) {
  return (value || "").slice(0, 5);
}

export default function StepPreview({ name, days = [], slots = [] }) {
  const orderedDays = [...days].sort(
    (first, second) => WEEK_ORDER.indexOf(first) - WEEK_ORDER.indexOf(second)
  );

  const orderedSlots = [...slots].sort(
    (first, second) => first.sort_order - second.sort_order
  );

  const scrollRef = useRef(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  function updateScrollFades() {
    const element = scrollRef.current;
    if (!element) return;

    setShowTopFade(element.scrollTop > 4);
    setShowBottomFade(
      element.scrollTop + element.clientHeight < element.scrollHeight - 4
    );
  }

  useEffect(() => {
    const frame = requestAnimationFrame(updateScrollFades);
    window.addEventListener("resize", updateScrollFades);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScrollFades);
    };
  }, [orderedDays.length, orderedSlots.length]);

  return (
    <div className="flex h-full w-full flex-col gap-5 p-2 lg:p-4">

      <div className="flex shrink-0 items-center justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
            Step 4
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
            Review your timetable
          </h2>
          <p className="mt-2 hidden text-sm text-[var(--color-text-muted)] lg:block">
            Your weekly structure is ready. Check it once more before generating.
          </p>
        </div>

        <span className="hidden shrink-0 items-center gap-2 rounded-full bg-[var(--color-primary)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] sm:inline-flex">
          <CheckCircle2 size={15} />
          Ready to generate
        </span>
      </div>

      <div className="relative min-h-0 flex-1 lg:flex-none lg:overflow-visible">
        <div
          ref={scrollRef}
          onScroll={updateScrollFades}
          className="grid h-full gap-4 overflow-y-auto lg:h-auto lg:overflow-visible lg:grid-cols-[minmax(240px,0.85fr)_minmax(0,1.15fr)]"
        >
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div className="flex items-center gap-2">
              <LayoutGrid size={16} className="text-[var(--color-primary)]" />
              <p className="text-sm font-semibold text-[var(--color-text)]">
                Timetable name
              </p>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-[var(--color-text)]">
              {name || "My workspace"}
            </h3>

            <div className="mt-5 border-t border-[var(--color-border)] pt-4">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-[var(--color-primary)]" />
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  Active days
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {orderedDays.map((day) => (
                  <span
                    key={day}
                    className="rounded-full bg-[var(--color-surface-alt)] px-2.5 py-1 text-xs font-medium text-[var(--color-text)]"
                  >
                    {DAY_LABELS[day]}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div className="flex items-center gap-2">
              <Clock3 size={16} className="text-[var(--color-primary)]" />
              <p className="text-sm font-semibold text-[var(--color-text)]">
                Time slots
              </p>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-2xl font-semibold text-[var(--color-text)]">
                {orderedSlots.length}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {orderedSlots.length === 1 ? "slot configured" : "slots configured"}
              </p>
            </div>

            {orderedSlots.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {orderedSlots.map((slot) => (
                  <span
                    key={slot.id}
                    className="rounded-lg bg-[var(--color-surface-alt)] px-2.5 py-1.5 text-center text-xs font-medium text-[var(--color-text)]"
                  >
                    {timeValue(slot.start_time)}–{timeValue(slot.end_time)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-[var(--color-surface)] to-transparent transition-opacity duration-200 lg:hidden ${
            showTopFade ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-[var(--color-surface)] to-transparent transition-opacity duration-200 lg:hidden ${
            showBottomFade ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
    </div>
  );
}
