import { CalendarDays, Plus, Trash2 } from "lucide-react";
import IconTile from "../../components/ui/IconTile";
import Button from "../../components/ui/Button";

const CARD_WASH =
  "linear-gradient(155deg, color-mix(in srgb, var(--color-primary) 22%, transparent) 0%, color-mix(in srgb, var(--color-accent) 10%, transparent) 55%, transparent 100%)";

const TITLE_WIDTHS = ["w-3/5", "w-2/5", "w-1/2"];

function CardSkeleton({ index }) {
  return (
    <article
      aria-hidden="true"
      style={{ backgroundImage: CARD_WASH }}
      className="relative flex h-auto flex-col justify-between gap-4 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_3%,var(--color-surface))] p-2 md:p-4 backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[var(--color-primary)] opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-[color-mix(in_srgb,var(--color-text)_4%,transparent)] to-transparent" />

      <div className="pointer-events-none relative z-10 flex items-start justify-between">
        <div className="flex items-start gap-2">
          <IconTile icon={CalendarDays} />
        </div>
        <span className="relative z-20 rounded-md p-1.5 text-[var(--color-text-muted)]">
          <Trash2 size={16} />
        </span>
      </div>

      <span className="pointer-events-none relative z-10 block pr-7 text-base font-semibold leading-snug">
        <span
          className={`sk inline-block h-[0.72em] max-w-full rounded-[3px] align-baseline ${
            TITLE_WIDTHS[index % TITLE_WIDTHS.length]
          }`}
          style={{ "--sk-delay": `-${index * 0.25}s` }}
        />
      </span>
    </article>
  );
}

export default function TimetableSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="flex h-full w-full min-h-0 flex-col gap-5"
    >
      <span className="sr-only">Loading timetables</span>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Your timetables</h2>
          <p className="mt-1 hidden text-sm text-[var(--color-text-muted)] sm:block">
            Pick a workspace to open, or create a new one.
          </p>
        </div>

        <Button
          type="button"
          disabled
          tabIndex={-1}
          aria-hidden="true"
          style={{ opacity: 1, cursor: "default" }}
          className="h-9 w-full justify-center px-2.5 shrink-0 sm:w-auto sm:px-4"
        >
          <Plus size={16} />
          <span className="text-xs sm:text-sm">New timetable</span>
        </Button>
      </header>

      <section className="relative flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 sm:p-4">
        <div className="h-full min-w-0 flex-1 overflow-hidden rounded-xl p-0">
          <div className="grid grid-cols-1 gap-2 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <CardSkeleton key={i} index={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
