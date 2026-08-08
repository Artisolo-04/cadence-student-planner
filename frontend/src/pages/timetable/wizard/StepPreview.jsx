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

  return (
    <div className="flex h-full w-full flex-col gap-5 p-4">
      
      <div className="flex items-center justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
            Step 4
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
            Review your timetable
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Your weekly structure is ready. Check it once more before generating.
          </p>
        </div>

        <span className="hidden shrink-0 items-center gap-2 rounded-full bg-[var(--color-primary)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] sm:inline-flex">
          <CheckCircle2 size={15} />
          Ready to generate
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(240px,0.85fr)_minmax(0,1.15fr)]">
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
    </div>
  );
}
