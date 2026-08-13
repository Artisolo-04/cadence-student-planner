import { useEffect, useRef, useState } from "react";
import SessionCard from "./SessionCard";

const VISIBLE_ROWS = 5;

export default function TodaySchedule({ sessions, currentKey }) {
  const scrollRef = useRef(null);
  const rowRef = useRef(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const [maxHeight, setMaxHeight] = useState(null);

  function updateScrollFades() {
    const element = scrollRef.current;
    if (!element) return;
    setShowTopFade(element.scrollTop > 4);
    setShowBottomFade(
      element.scrollTop + element.clientHeight < element.scrollHeight - 4
    );
  }

  useEffect(() => {
    if (rowRef.current) {
      setMaxHeight(rowRef.current.offsetHeight * VISIBLE_ROWS);
    }
    const frame = requestAnimationFrame(updateScrollFades);
    window.addEventListener("resize", updateScrollFades);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScrollFades);
    };
  }, [sessions]);

  const needsScroll = sessions.length > VISIBLE_ROWS;

  return (
    <div className="relative rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden p-2">
      <div
        ref={scrollRef}
        onScroll={updateScrollFades}
        style={needsScroll && maxHeight ? { maxHeight } : undefined}
        className={`divide-y divide-[var(--color-border)] ${
          needsScroll ? "overflow-y-auto scrollbar-cadence" : ""
        }`}
      >
        {sessions.map((s, i) => (
          <div key={s.key} ref={i === 0 ? rowRef : null}>
            <SessionCard session={s} isCurrent={s.key === currentKey} />
          </div>
        ))}
      </div>

      {needsScroll && (
        <>
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${
              showTopFade ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${
              showBottomFade ? "opacity-100" : "opacity-0"
            }`}
          />
        </>
      )}
    </div>
  );
}
