import { useEffect, useRef, useState } from "react";
import { CustomScrollbar } from "./CustomScrollbar";

// Skeleton twin of the scroll area used by SubjectList / WorkspaceList:
// same container, same real scrollbar track, same fades.
export default function SkeletonScrollArea({ children }) {
  const scrollRef = useRef(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  function updateScrollFades() {
    const element = scrollRef.current;
    if (!element) return;
    setShowTopFade(element.scrollTop > 4);
    setShowBottomFade(
      element.scrollTop + element.clientHeight < element.scrollHeight - 4
    );
  }

  useEffect(() => {
    const frame = requestAnimationFrame(updateScrollFades);
    window.addEventListener("resize", updateScrollFades);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScrollFades);
    };
  }, []);

  return (
    <>
      <div
        ref={scrollRef}
        onScroll={updateScrollFades}
        className="h-full min-w-0 flex-1 overflow-y-auto rounded-xl p-0 scrollbar-hidden sm:p-0"
      >
        {children}
      </div>

      <div aria-hidden="true" className="contents">
        <CustomScrollbar scrollRef={scrollRef} />
      </div>

      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-2 top-2 z-10 h-12 bg-gradient-to-b from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${
          showTopFade ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-2 bottom-2 z-10 h-16 bg-gradient-to-t from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${
          showBottomFade ? "opacity-100" : "opacity-0"
        }`}
      />
    </>
  );
}
