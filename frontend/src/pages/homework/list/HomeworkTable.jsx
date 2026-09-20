import HomeworkRow from "./HomeworkRow";
import { CustomScrollbar } from "../../../components/ui/CustomScrollbar";
import useScrollFade from "../../../hooks/useScrollFade";

const ROW_GRID = "grid-cols-[25px_85px_minmax(0,320px)_1fr_250px_180px_130px_64px]";

export default function HomeworkTable({ items, onEdit, onDelete, onToggleDone, onStatusChange }) {
  const { scrollRef, showTopFade, showBottomFade, updateScrollFades } = useScrollFade(items);

  return (
    <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-base backdrop-blur-xl">
      <div className="relative min-h-0 flex flex-1 p-0 sm:p-base">
        <div
          ref={scrollRef}
          onScroll={updateScrollFades}
          className="scrollbar-hidden h-full overflow-y-scroll rounded-xl min-w-0 flex-1"
        >
          <div className="flex flex-col gap-inline">
            {items.map((item) => (
              <HomeworkRow
                key={item.id}
                item={item}
                gridClass={ROW_GRID}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleDone={onToggleDone}
                onStatusChange={onStatusChange}
              />
            ))}

            {items.length === 0 && (
              <p className="px-cozy py-airy text-center text-sm text-[var(--color-text-muted)]">
                No homework matches your filters.
              </p>
            )}
          </div>
        </div>

        <CustomScrollbar scrollRef={scrollRef} />

        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-12 sm:h-16 bg-gradient-to-b from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${
            showTopFade ? "opacity-100 sm:opacity-70" : "opacity-0"
          }`}
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 sm:h-16 bg-gradient-to-t from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${
            showBottomFade ? "opacity-100 sm:opacity-70" : "opacity-0"
          }`}
        />
      </div>
    </section>
  );
}
