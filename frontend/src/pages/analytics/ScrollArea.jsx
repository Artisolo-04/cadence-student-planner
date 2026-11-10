import { useLayoutEffect, useRef, useState } from "react";
import { CustomScrollbar } from "../../components/ui/CustomScrollbar";

// Bare scroll list: no box, vault-style scrollbar in the gutter, real mask fade.
export default function ScrollArea({ children, watch }) {
  const scrollRef = useRef(null);
  const [edges, setEdges] = useState({ top: false, bottom: false });

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const update = () => {
      const top = el.scrollTop > 4;
      const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 4;
      setEdges((prev) => (prev.top === top && prev.bottom === bottom ? prev : { top, bottom }));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [watch]);

  const stops = [
    edges.top ? "transparent 0, rgba(0,0,0,0.15) 14px, #000 64px" : "#000 0",
    edges.bottom
      ? "#000 calc(100% - 90px), rgba(0,0,0,0.15) calc(100% - 14px), transparent 100%"
      : "#000 100%",
  ].join(", ");
  const mask = `linear-gradient(to bottom, ${stops})`;

  return (
    <div className="flex min-h-0 flex-1">
      <div
        ref={scrollRef}
        className="scrollbar-hidden min-w-0 flex-1 overflow-y-auto"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      >
        {children}
      </div>
      <CustomScrollbar scrollRef={scrollRef} />
    </div>
  );
}
