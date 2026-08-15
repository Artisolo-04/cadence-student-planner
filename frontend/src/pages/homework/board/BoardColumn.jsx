import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import BoardCard from "./BoardCard";
import useScrollFade from "./useScrollFade";
import { isElementVisible, smoothScrollTo } from "./scrollUtils";

const GLOW_WINDOW = 900;

export default function BoardColumn({ column, items, onEdit, onDelete, onStatusChange }) {
  const { scrollRef, showTopFade, showBottomFade, updateScrollFades } = useScrollFade(items);
  const prevIdsRef = useRef(new Set(items.map((i) => i.id)));
  const [pendingId, setPendingId] = useState(null);
  const [arrivedId, setArrivedId] = useState(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const currentIds = new Set(items.map((i) => i.id));
    const newId = items.find((i) => !prevIdsRef.current.has(i.id))?.id;
    prevIdsRef.current = currentIds;

    if (newId == null) return;

    const container = scrollRef.current;
    if (!container) return;

    if (shouldReduceMotion) {
      setPendingId(null);
      return;
    }

    setPendingId(newId);
    let cancelled = false;

    const raf = requestAnimationFrame(async () => {
      const cardEl = container.querySelector(`[data-card-id="${newId}"]`);
      if (cardEl) {
        if (!isElementVisible(container, cardEl)) {
          const target =
            cardEl.offsetTop - container.clientHeight / 2 + cardEl.clientHeight / 2;
          await smoothScrollTo(container, Math.max(0, target), 450);
        }
      }
      if (!cancelled) {
        setPendingId(null);
        setArrivedId(newId);
        setTimeout(() => {
          setArrivedId((current) => (current === newId ? null : current));
        }, GLOW_WINDOW);
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [items, shouldReduceMotion]);

  return (
    <div className="flex h-full min-w-[280px] flex-1 flex-col gap-3 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3" style={{ contain: "paint" }}>
      <div className="flex shrink-0 items-center justify-between px-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          {column.label}
        </h3>
        <span className="rounded-md bg-[var(--color-surface-alt)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-muted)]">
          {items.length}
        </span>
      </div>

      <div className="relative min-h-0 flex-1">
        <motion.div
          layoutScroll
          ref={scrollRef}
          onScroll={updateScrollFades}
          className="h-full overflow-y-auto rounded-xl scrollbar-cadence pr-1"
        >
          <motion.div layout="position" transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col gap-3 pb-2">
            <AnimatePresence mode="popLayout">
              {items.length === 0 ? (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-1 py-6 text-center text-xs text-[var(--color-text-muted)]"
                >
                  Nothing here.
                </motion.p>
              ) : (
                items.map((item) => (
                  <div key={item.id} data-card-id={item.id}>
                    <BoardCard
                      item={item}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onStatusChange={onStatusChange}
                      revealed={item.id !== pendingId}
                      justArrived={item.id === arrivedId}
                    />
                  </div>
                ))
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

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
