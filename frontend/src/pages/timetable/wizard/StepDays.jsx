import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import Checkbox from "../../../components/ui/Checkbox";

const DAYS = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
  { value: 0, label: "Sunday", short: "Sun" },
];

const FULL_WEEK = DAYS.map((day) => day.value);
const WEEKDAYS = [1, 2, 3, 4, 5];
const PREVIEW_TIMES = ["08 : 30", "10 : 00", "11 : 30"];

const StepDays = forwardRef(function StepDays(
  { initialValue, workspaceName, onNext },
  ref
) {
  const formRef = useRef(null);
  const destinationRef = useRef(3);
  const [selected, setSelected] = useState(
    initialValue?.length ? initialValue : WEEKDAYS
  );
  const [touched, setTouched] = useState(false);

  const isValid = selected.length > 0;
  const previewDays = DAYS.filter((day) => selected.includes(day.value));
  const previewName = workspaceName || "My workspace";
  const gridStyle = {
    gridTemplateColumns: `64px repeat(${Math.max(previewDays.length, 1)}, minmax(0, 1fr))`,
  };

  useImperativeHandle(ref, () => ({
    next: (nextStep = 3) => {
      destinationRef.current = nextStep;
      formRef.current?.requestSubmit();
    },
  }));

  function toggleDay(value) {
    setSelected((current) =>
      current.includes(value)
        ? current.filter((day) => day !== value)
        : [...current, value]
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    setTouched(true);
    if (!isValid) return;
    onNext(selected, destinationRef.current);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="h-full w-full p-4">
      <div className="grid h-full grid-rows-[minmax(0,1fr)] items-stretch gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <section className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
              Step 2
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
              Choose your active days
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
              Pick the days you will actually use in this timetable.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-2 gap-y-1">
            <button
              type="button"
              onClick={() => setSelected(FULL_WEEK)}
              className="text-xs font-medium text-[var(--color-primary)] hover:underline"
            >
              Full week
            </button>
            <span className="text-xs text-[var(--color-text-muted)]">·</span>
            <button
              type="button"
              onClick={() => setSelected(WEEKDAYS)}
              className="text-xs font-medium text-[var(--color-primary)] hover:underline"
            >
              Weekdays only
            </button>
            <span className="text-xs text-[var(--color-text-muted)]">·</span>
            <button
              type="button"
              onClick={() => setSelected([])}
              className="text-xs text-[var(--color-text-muted)] hover:underline"
            >
              Clear
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {DAYS.map((day) => (
              <Checkbox
                key={day.value}
                id={`day-${day.value}`}
                label={day.label}
                checked={selected.includes(day.value)}
                onChange={() => toggleDay(day.value)}
              />
            ))}
          </div>

          {touched && !isValid && (
            <span className="text-xs text-[var(--color-danger)]">
              Select at least one day
            </span>
          )}
        </section>

        <aside className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--color-text-muted)]">
                Active days preview
              </p>
              <h3 className="mt-0.5 truncate text-sm font-semibold text-[var(--color-text)]">
                {previewName}
              </h3>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <CalendarDays size={18} />
            </span>
          </div>

          <div className="flex flex-1 items-center justify-center overflow-hidden p-4">
            <div className="w-full overflow-hidden rounded-xl border border-[var(--color-border)]">
              <div
                className="grid bg-[var(--color-surface-alt)] text-xs font-medium text-[var(--color-text-muted)]"
                style={gridStyle}
              >
                <span className="border-r border-[var(--color-border)] px-3 py-2.5">Time</span>
                {previewDays.length > 0 ? (
                  previewDays.map((day) => (
                    <span
                      key={day.value}
                      className="border-r border-[var(--color-border)] px-3 py-2.5 text-center last:border-r-0"
                    >
                      {day.short}
                    </span>
                  ))
                ) : (
                  <span className="px-3 py-2.5 text-center">No days selected</span>
                )}
              </div>

              {PREVIEW_TIMES.map((time, rowIndex) => (
                <div
                  key={time}
                  className="grid border-t border-[var(--color-border)]"
                  style={gridStyle}
                >
                  <span className="border-r border-[var(--color-border)] px-3 py-3 text-xs font-medium text-[var(--color-text-muted)]">
                    {time}
                  </span>

                  {previewDays.length > 0 ? (
                    previewDays.map((day, columnIndex) => (
                      <div
                        key={`${time}-${day.value}`}
                        className="flex items-center border-r border-[var(--color-border)] px-3 last:border-r-0"
                      >
                        <span
                          className={`h-2.5 rounded-full bg-[var(--color-primary)]/20 ${
                            rowIndex === 1 && columnIndex % 2 === 0
                              ? "w-4/5 bg-[var(--color-primary)]/35"
                              : columnIndex % 3 === 0
                                ? "w-3/4"
                                : columnIndex % 3 === 1
                                  ? "w-2/3"
                                  : "w-1/2"
                          }`}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-3 text-center text-xs text-[var(--color-text-muted)]">
                      —
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="shrink-0 border-t border-[var(--color-border)] px-5 py-3">
            <p className="text-xs text-[var(--color-text-muted)]">
              {previewDays.length === 0
                ? "Select at least one day to build your weekly timetable."
                : `${previewDays.length} active ${previewDays.length === 1 ? "day" : "days"} selected.`}
            </p>
          </div>
        </aside>
      </div>
    </form>
  );
});

export default StepDays;
