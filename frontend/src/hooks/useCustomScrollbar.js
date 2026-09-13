import { useEffect, useLayoutEffect, useRef, useState } from "react";

export function useCustomScrollbar(scrollRef) {
  const trackRef = useRef(null);
  const [thumb, setThumb] = useState({ height: 0, top: 0, visible: false });

  function updateThumb() {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;

    if (scrollHeight <= clientHeight) {
      setThumb({ height: 0, top: 0, visible: false });
      return;
    }

    const thumbHeight = Math.max(
      (clientHeight / scrollHeight) * clientHeight,
      36
    );
    const maxTop = clientHeight - thumbHeight;
    const top = (scrollTop / (scrollHeight - clientHeight)) * maxTop;

    setThumb({ height: thumbHeight, top, visible: true });
  }

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateThumb();
    el.addEventListener("scroll", updateThumb);

    const resizeObserver = new ResizeObserver(updateThumb);
    resizeObserver.observe(el);

    const mutationObserver = new MutationObserver(updateThumb);
    mutationObserver.observe(el, { childList: true, subtree: true });

    return () => {
      el.removeEventListener("scroll", updateThumb);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [scrollRef]);

  function handleThumbMouseDown(event) {
    event.preventDefault();
    const el = scrollRef.current;
    if (!el || !trackRef.current) return;

    const startY = event.clientY;
    const startScrollTop = el.scrollTop;
    const trackHeight = trackRef.current.clientHeight;
    const scrollableHeight = el.scrollHeight - el.clientHeight;
    const thumbTrackRange = trackHeight - thumb.height;

    function onMouseMove(moveEvent) {
      const deltaY = moveEvent.clientY - startY;
      const scrollDelta =
        thumbTrackRange > 0
          ? (deltaY / thumbTrackRange) * scrollableHeight
          : 0;
      el.scrollTop = startScrollTop + scrollDelta;
    }

    function onMouseUp() {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  return { trackRef, thumb, handleThumbMouseDown };
}
