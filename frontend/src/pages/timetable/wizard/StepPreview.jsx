import { useEffect, useRef, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, LayoutGrid } from "lucide-react";
import { CustomScrollbar } from "../../../components/ui/CustomScrollbar";

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

  const outerScrollRef = useRef(null);
  const [showOuterTopFade, setShowOuterTopFade] = useState(false);
  const [showOuterBottomFade, setShowOuterBottomFade] = useState(false);

  const slotsScrollRef = useRef(null);
  const [showSlotsTopFade, setShowSlotsTopFade] = useState(false);
  const [showSlotsBottomFade, setShowSlotsBottomFade] = useState(false);

  function updateOuterScrollFades() {
    const element = outerScrollRef.current;
    if (!element) return;

    setShowOuterTopFade(element.scrollTop > 4);
    setShowOuterBottomFade(
      element.scrollTop + element.clientHeight < element.scrollHeight - 4
    );
  }

  function updateSlotsScrollFades() {
    const element = slotsScrollRef.current;
    if (!element) return;

    setShowSlotsTopFade(element.scrollTop > 4);
    setShowSlotsBottomFade(
      element.scrollTop + element.clientHeight < element.scrollHeight - 4
    );
  }

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      updateOuterScrollFades();
      updateSlotsScrollFades();
    });
    window.addEventListener("resize", updateOuterScrollFades);
    window.addEventListener("resize", updateSlotsScrollFades);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateOuterScrollFades);
      window.removeEventListener("resize", updateSlotsScrollFades);
    };
  }, [orderedDays.length, orderedSlots.length]);

  return (
    <div className="flex h-full w-full flex-col gap-plush p-base lg:p-roomy">

      <div className="flex shrink-0 items-center justify-between gap-plush">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
            Step 4
          </p>
          <h2 className="mt-base text-xl font-semibold text-[var(--color-text)]">
            Review your timetable
          </h2>
          <p className="mt-base hidden text-sm text-[var(--color-text-muted)] lg:block">
            Your weekly structure is ready. Check it once more before generating.
          </p>
        </div>

        <span className="hidden shrink-0 items-center gap-inline rounded-full bg-[var(--color-primary)]/10 px-comfy py-snug text-xs font-semibold text-[var(--color-primary)] sm:inline-flex">
          <CheckCircle2 size={15} />
          Ready to generate
        </span>
      </div>

      <div className="relative flex min-h-0 flex-1">
        <div
          ref={outerScrollRef}
          onScroll={updateOuterScrollFades}
          className="scrollbar-hidden grid min-w-0 flex-1 gap-roomy overflow-y-auto lg:overflow-visible lg:grid-rows-1 lg:grid-cols-[minmax(240px,0.85fr)_minmax(0,1.15fr)]"
        >
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-plush">
            <div className="flex items-center gap-inline">
              <LayoutGrid size={16} className="text-[var(--color-primary)]" />
              <p className="text-sm font-semibold text-[var(--color-text)]">
                Timetable name
              </p>
            </div>
            <h3 className="mt-base text-lg font-semibold text-[var(--color-text)]">
              {name || "My workspace"}
            </h3>

            <div className="mt-plush border-t border-[var(--color-border)] pt-roomy">
              <div className="flex items-center gap-inline">
                <CalendarDays size={16} className="text-[var(--color-primary)]" />
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  Active days
                </p>
              </div>

              <div className="mt-comfy flex flex-wrap gap-snug">
                {orderedDays.map((day) => (
                  <span
                    key={day}
                    className="rounded-full bg-[var(--color-surface-alt)] px-cozy py-tight text-xs font-medium text-[var(--color-text)]"
                  >
                    {DAY_LABELS[day]}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-plush lg:h-full lg:min-h-0">
            <div className="flex shrink-0 items-center gap-inline">
              <Clock3 size={16} className="text-[var(--color-primary)]" />
              <p className="text-sm font-semibold text-[var(--color-text)]">
                Time slots
              </p>
            </div>

            <div className="mt-base flex shrink-0 items-baseline gap-inline">
              <p className="text-2xl font-semibold text-[var(--color-text)]">
                {orderedSlots.length}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {orderedSlots.length === 1 ? "slot configured" : "slots configured"}
              </p>
            </div>

            {orderedSlots.length > 0 && (
              <div className="relative mt-roomy flex min-h-0 lg:flex-1">
                <div
                  ref={slotsScrollRef}
                  onScroll={updateSlotsScrollFades}
                  className="scrollbar-hidden grid min-w-0 flex-1 grid-cols-2 gap-inline sm:grid-cols-3 lg:h-full lg:overflow-y-auto"
                >
                  {orderedSlots.map((slot) => (
                    <span
                      key={slot.id}
                      className="rounded-lg bg-[var(--color-surface-alt)] px-cozy py-snug text-center text-xs font-medium text-[var(--color-text)] flex items-center justify-center"
                    >
                      {timeValue(slot.start_time)} – {timeValue(slot.end_time)}
                    </span>
                  ))}
                </div>

                <div className="hidden lg:block">
                  <CustomScrollbar scrollRef={slotsScrollRef} />
                </div>

                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-x-0 top-0 z-10 hidden h-10 bg-gradient-to-b from-[var(--color-surface)] to-transparent transition-opacity duration-200 lg:block ${
                    showSlotsTopFade ? "opacity-100" : "opacity-0"
                  }`}
                />

                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden h-10 bg-gradient-to-t from-[var(--color-surface)] to-transparent transition-opacity duration-200 lg:block ${
                    showSlotsBottomFade ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
            )}
          </div>
        </div>

        <div className="lg:hidden">
          <CustomScrollbar scrollRef={outerScrollRef} />
        </div>

        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-[var(--color-surface)] to-transparent transition-opacity duration-200 lg:hidden ${
            showOuterTopFade ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-[var(--color-surface)] to-transparent transition-opacity duration-200 lg:hidden ${
            showOuterBottomFade ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
    </div>
  );
}
