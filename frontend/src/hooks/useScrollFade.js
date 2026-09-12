import { useCallback, useEffect, useRef, useState } from "react";

const EDGE_THRESHOLD_PX = 4;

export default function useScrollFade(dependency) {
  const scrollRef = useRef(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const frameRef = useRef(null);

  const updateScrollFades = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    const scrollTop = Math.round(element.scrollTop);
    const clientHeight = Math.round(element.clientHeight);
    const scrollHeight = Math.round(element.scrollHeight);

    setShowTopFade(scrollTop > EDGE_THRESHOLD_PX);
    setShowBottomFade(
      scrollTop + clientHeight < scrollHeight - EDGE_THRESHOLD_PX
    );
  }, []);

  const scheduleUpdate = useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      updateScrollFades();
    });
  }, [updateScrollFades]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return undefined;

    scheduleUpdate();

    element.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(element);

    const mutationObserver = new MutationObserver(scheduleUpdate);
    mutationObserver.observe(element, { childList: true, subtree: true });

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      element.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [scheduleUpdate, dependency]);

  return { scrollRef, showTopFade, showBottomFade, updateScrollFades };
}
