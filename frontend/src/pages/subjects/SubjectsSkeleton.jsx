import { BookOpen, Clock, Pencil, Plus, Trash2 } from "lucide-react";
import Button from "../../components/ui/Button";
import IconTile from "../../components/ui/IconTile";
import SkeletonScrollArea from "../../components/ui/SkeletonScrollArea";

const DEFAULT_SHAPE = [
  [true, true],
  [true, true],
  [true, true],
];
const NAME_W = ["w-3/5", "w-2/5", "w-1/2"];
const TEACHER_W = ["w-2/5", "w-1/3", "w-1/2"];
const CARD_WASH =
  "linear-gradient(155deg, color-mix(in srgb, var(--color-primary) 22%, transparent) 0%, color-mix(in srgb, var(--color-accent) 10%, transparent) 55%, transparent 100%)";
const BAR = "sk inline-block h-[0.72em] max-w-full rounded-[3px] align-baseline";

function CardSkeleton({ index, hasTeacher, hasHours }) {
  return (
    <article
      aria-hidden="true"
      style={{ backgroundImage: CARD_WASH }}
      className="relative flex h-auto flex-col justify-between gap-4 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_3%,var(--color-surface))] p-2 md:p-4 backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[var(--color-primary)] opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-[color-mix(in_srgb,var(--color-text)_4%,transparent)] to-transparent" />

      <div className="relative z-10 flex items-start justify-between">
        <IconTile icon={BookOpen} />
        <div className="flex items-center gap-1">
          <span className="rounded-md p-1.5 text-[var(--color-text-muted)]">
            <Pencil size={16} />
          </span>
          <span className="rounded-md p-1.5 text-[var(--color-text-muted)]">
            <Trash2 size={16} />
          </span>
        </div>
      </div>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="block w-full truncate text-base font-semibold leading-snug">
            <span
              className={`${BAR} ${NAME_W[index % 3]}`}
              style={{ "--sk-delay": `-${index * 0.25}s` }}
            />
          </span>
          {hasTeacher && (
            <span className="block w-full truncate text-sm">
              <span
                className={`${BAR} ${TEACHER_W[index % 3]}`}
                style={{ "--sk-delay": `-${index * 0.25}s` }}
              />
            </span>
          )}
        </div>
        {hasHours && (
          <span
            className="sk inline-flex w-fit items-center gap-1.5 rounded-md border border-[var(--color-line)] px-2.5 py-1 text-xs font-medium"
            style={{ "--sk-delay": `-${index * 0.25}s` }}
          >
            <span className="invisible inline-flex items-center gap-1.5">
              <Clock size={11} />
              00h/wk
            </span>
          </span>
        )}
      </div>
    </article>
  );
}

export default function SubjectsSkeleton({ shape }) {
  const cards = shape?.length ? shape : DEFAULT_SHAPE;

  return (
    <div
      role="status"
      aria-busy="true"
      className="flex h-full w-full min-h-0 flex-col gap-5"
    >
      <span className="sr-only">Loading subjects</span>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Your subjects</h2>
          <p className="mt-1 hidden text-sm text-[var(--color-text-muted)] sm:block">
            Manage the subjects you'll assign into your timetable.
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
          <span className="text-xs sm:text-sm">New subject</span>
        </Button>
      </header>

      <section className="relative flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 sm:p-4">
        <SkeletonScrollArea>
          <div className="grid grid-cols-1 gap-2 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map(([hasTeacher, hasHours], i) => (
              <CardSkeleton key={i} index={i} hasTeacher={hasTeacher} hasHours={hasHours} />
            ))}
          </div>
        </SkeletonScrollArea>
      </section>
    </div>
  );
}
