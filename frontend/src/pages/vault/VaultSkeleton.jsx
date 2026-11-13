import { Folder, Trash2 } from "lucide-react";
import IconTile from "../../components/ui/IconTile";

const DEFAULT_SHAPE = [2, 1, 2, 1, 2, 1];
const TITLE_W = ["w-3/5", "w-2/5", "w-1/2", "w-2/3"];
const CHIP_LABELS = ["2 PDFs", "3 Links", "1 Word", "4 Images"];
const CARD_WASH =
  "linear-gradient(155deg, color-mix(in srgb, var(--color-primary) 22%, transparent) 0%, color-mix(in srgb, var(--color-accent) 10%, transparent) 55%, transparent 100%)";
const BAR = "sk inline-block h-[0.72em] max-w-full rounded-[3px] align-baseline";

function Chip({ label, delay }) {
  return (
    <span
      aria-hidden="true"
      style={{ "--sk-delay": delay }}
      className="sk inline-flex h-6 items-center rounded-md border border-[var(--color-border)] px-2 text-[11px] font-medium leading-none"
    >
      <span className="invisible">{label}</span>
    </span>
  );
}

function Chips({ count, delay }) {
  return Array.from({ length: count }, (_, i) => (
    <Chip key={i} label={CHIP_LABELS[i % 4]} delay={delay} />
  ));
}

function GridCard({ index, chips }) {
  const delay = `-${index * 0.25}s`;
  return (
    <article
      aria-hidden="true"
      style={{ backgroundImage: CARD_WASH }}
      className="relative flex h-auto flex-col gap-4 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_3%,var(--color-surface))] backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[var(--color-primary)] opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-[color-mix(in_srgb,var(--color-text)_4%,transparent)] to-transparent" />

      <div className="relative z-10 flex flex-col gap-4 p-2 md:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <IconTile icon={Folder} color="var(--color-primary)" />
            <span className="block w-full min-w-0 truncate text-base font-semibold leading-snug">
              <span className={`${BAR} ${TITLE_W[index % 4]}`} style={{ "--sk-delay": delay }} />
            </span>
          </div>
          <span className="shrink-0 rounded-md p-1.5 text-[var(--color-text-muted)]">
            <Trash2 size={16} />
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div>
            <span
              className="sk inline-flex h-auto items-center rounded-md border border-[var(--color-border)] px-2.5 py-1 text-xs font-semibold leading-none"
              style={{ "--sk-delay": delay }}
            >
              <span className="invisible">00 resources</span>
            </span>
          </div>
          {chips > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Chips count={chips} delay={delay} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function ListCard({ index, chips }) {
  const delay = `-${index * 0.25}s`;
  return (
    <article
      aria-hidden="true"
      className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_3%,var(--color-surface))]"
    >
      <div className="flex w-full flex-nowrap items-center justify-between gap-3 px-2 py-2 md:px-4 md:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <Folder size={15} style={{ color: "var(--color-primary)" }} className="shrink-0" />
          <span className="min-w-0 w-full truncate text-sm font-medium">
            <span className={`${BAR} ${TITLE_W[index % 4]}`} style={{ "--sk-delay": delay }} />
          </span>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <div className="hidden items-center gap-1.5 md:flex">
            <Chips count={chips} delay={delay} />
          </div>
          <span
            className="sk inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-md border border-[var(--color-border)] px-2.5 text-[11px] font-semibold leading-none"
            style={{ "--sk-delay": delay }}
          >
            <span className="invisible">00 resources</span>
          </span>
          <span className="rounded-md p-1.5 text-[var(--color-text-muted)]">
            <Trash2 size={15} />
          </span>
        </div>
      </div>
    </article>
  );
}

// Content-only skeleton: the page header, filter bar and section shell stay real.
export default function VaultSkeleton({ layout = "grid", shape }) {
  const cards = shape?.length ? shape : DEFAULT_SHAPE;
  const isGrid = layout !== "list";

  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">Loading vault</span>
      <div
        className={
          isGrid
            ? "grid grid-cols-1 gap-2 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3"
            : "flex flex-col gap-2"
        }
      >
        {cards.map((chips, i) =>
          isGrid ? (
            <GridCard key={i} index={i} chips={chips} />
          ) : (
            <ListCard key={i} index={i} chips={chips} />
          )
        )}
      </div>
    </div>
  );
}
