import { useEffect, useRef, useState } from "react";

export default function useScrollFade(dependency) {
  const scrollRef = useRef(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  function updateScrollFades() {
    const element = scrollRef.current;
    if (!element) return;
    setShowTopFade(element.scrollTop > 4);
    setShowBottomFade(element.scrollTop + element.clientHeight < element.scrollHeight - 4);
  }

  useEffect(() => {
    const frame = requestAnimationFrame(updateScrollFades);
    window.addEventListener("resize", updateScrollFades);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScrollFades);
    };
  }, [dependency]);

  return { scrollRef, showTopFade, showBottomFade, updateScrollFades };
}
