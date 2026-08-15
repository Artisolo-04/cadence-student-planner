import BoardCard from "./BoardCard";
import useScrollFade from "./useScrollFade";

export default function BoardColumn({ column, items, onEdit, onStatusChange }) {
  const { scrollRef, showTopFade, showBottomFade, updateScrollFades } = useScrollFade(items);

  return (
    <div className="flex h-full min-w-[280px] flex-1 flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="flex shrink-0 items-center justify-between px-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          {column.label}
        </h3>
        <span className="rounded-md bg-[var(--color-surface-alt)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-muted)]">
          {items.length}
        </span>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={updateScrollFades}
          className="h-full overflow-y-auto rounded-xl scrollbar-cadence pr-1"
        >
          <div className="flex flex-col gap-3 pb-2">
            {items.length === 0 ? (
              <p className="px-1 py-6 text-center text-xs text-[var(--color-text-muted)]">Nothing here.</p>
            ) : (
              items.map((item) => (
                <BoardCard key={item.id} item={item} onEdit={onEdit} onStatusChange={onStatusChange} />
              ))
            )}
          </div>
        </div>

        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${showTopFade ? "opacity-100" : "opacity-0"}`}
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${showBottomFade ? "opacity-100" : "opacity-0"}`}
        />
      </div>
    </div>
  );
}
