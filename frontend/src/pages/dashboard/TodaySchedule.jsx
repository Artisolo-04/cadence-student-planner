import { useEffect, useRef, useState } from "react";
import { CalendarClock } from "lucide-react";
import SessionCard from "./SessionCard";

const VISIBLE_ROWS = 5;
const FADE_SIZE = 28;

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

  const maskImage = needsScroll
    ? `linear-gradient(to bottom, ${
        showTopFade ? `transparent 0, black ${FADE_SIZE}px` : "black 0"
      }, ${
        showBottomFade
          ? `black calc(100% - ${FADE_SIZE}px), transparent 100%`
          : "black 100%"
      })`
    : undefined;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/10 p-4 backdrop-blur-xl"
      style={{
        backgroundImage:
          "linear-gradient(150deg, color-mix(in srgb, var(--color-primary) 10%, transparent) 0%, color-mix(in srgb, var(--color-accent) 5%, transparent) 65%, transparent 100%)",
      }}
    >
      <div className="mb-3 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">
        <CalendarClock size={12} />
        Today's schedule
      </div>

      <div
        ref={scrollRef}
        onScroll={updateScrollFades}
        style={{
          ...(needsScroll && maxHeight ? { maxHeight } : {}),
          ...(maskImage
            ? { maskImage, WebkitMaskImage: maskImage }
            : {}),
        }}
        className={`flex flex-col gap-0.5 transition-[mask-image] duration-150 ${
          needsScroll ? "overflow-y-auto scrollbar-cadence pr-1" : ""
        }`}
      >
        {sessions.map((s, i) => (
          <div key={s.key} ref={i === 0 ? rowRef : null}>
            <SessionCard session={s} isCurrent={s.key === currentKey} />
          </div>
        ))}
      </div>
    </div>
  );
}
