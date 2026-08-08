import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import Input from "../../../components/ui/Input";

const PREVIEW_ROWS = [
  { time: "08:30", lengths: ["w-4/5", "w-2/3", "w-3/4"] },
  { time: "10:00", lengths: ["w-3/5", "w-4/5", "w-1/2"] },
  { time: "11:30", lengths: ["w-2/3", "w-1/2", "w-4/5"] },
];

const StepName = forwardRef(function StepName({ initialValue, onNext }, ref) {
  const formRef = useRef(null);
  const destinationRef = useRef(2);
  const [name, setName] = useState(initialValue || "My workspace");
  const [touched, setTouched] = useState(false);

  const trimmed = name.trim();
  const isValid = trimmed.length > 0;
  const previewName = trimmed || "My workspace";

  useImperativeHandle(ref, () => ({
    next: (nextStep = 2) => {
      destinationRef.current = nextStep;
      formRef.current?.requestSubmit();
    },
  }));

  function handleSubmit(event) {
    event.preventDefault();
    setTouched(true);
    if (!isValid) return;
    onNext(trimmed, destinationRef.current);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="h-full w-full p-4">
      <div className="grid h-full grid-rows-[minmax(0,1fr)] items-stretch gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <section className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
              Step 1
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
              Name your workspace
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
              Start with a name you will recognize quickly in your timetable library.
            </p>
          </div>

          <Input
            id="workspace-name"
            label="Workspace name"
            placeholder="e.g. My Study 26-27"
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={touched && !isValid ? "Workspace name is required" : undefined}
            autoFocus
          />

          <p className="text-xs leading-5 text-[var(--color-text-muted)]">
            You can change the name later from Edit timetable.
          </p>
        </section>

        <aside className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--color-text-muted)]">Your timetable preview</p>
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
              <div className="grid grid-cols-[64px_repeat(3,minmax(0,1fr))] bg-[var(--color-surface-alt)] text-xs font-medium text-[var(--color-text-muted)]">
                <span className="border-r border-[var(--color-border)] px-3 py-2.5">Time</span>
                <span className="border-r border-[var(--color-border)] px-3 py-2.5">Mon</span>
                <span className="border-r border-[var(--color-border)] px-3 py-2.5">Tue</span>
                <span className="px-3 py-2.5">Wed</span>
              </div>

              {PREVIEW_ROWS.map((row, rowIndex) => (
                <div
                  key={row.time}
                  className="grid grid-cols-[64px_repeat(3,minmax(0,1fr))] border-t border-[var(--color-border)]"
                >
                  <span className="border-r border-[var(--color-border)] px-3 py-3 text-xs font-medium text-[var(--color-text-muted)]">
                    {row.time}
                  </span>

                  {row.lengths.map((length, columnIndex) => (
                    <div
                      key={`${row.time}-${columnIndex}`}
                      className="flex items-center border-r border-[var(--color-border)] px-3 last:border-r-0"
                    >
                      <span
                        className={`h-2.5 rounded-full bg-[var(--color-primary)]/20 ${
                          rowIndex === 1 && columnIndex === 1
                            ? "bg-[var(--color-primary)]/35"
                            : ""
                        } ${length}`}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="shrink-0 border-t border-[var(--color-border)] px-5 py-3">
            <p className="text-xs text-[var(--color-text-muted)]">
              Choose days and time slots in the next steps.
            </p>
          </div>
        </aside>
      </div>
    </form>
  );
});

export default StepName;
