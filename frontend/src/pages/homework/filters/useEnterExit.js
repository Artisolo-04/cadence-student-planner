import { useEffect, useRef, useState } from "react";

export default function useEnterExit(active, exitDuration = 180) {
  const [mounted, setMounted] = useState(active);
  const [visible, setVisible] = useState(false);
  const rafIds = useRef([]);

  useEffect(() => {
    if (active) {
      setMounted(true);
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => setVisible(true));
        rafIds.current.push(raf2);
      });
      rafIds.current.push(raf1);
      return () => {
        rafIds.current.forEach(cancelAnimationFrame);
        rafIds.current = [];
      };
    }

    setVisible(false);
    const timeout = setTimeout(() => setMounted(false), exitDuration);
    return () => clearTimeout(timeout);
  }, [active, exitDuration]);

  return [mounted, visible];
}
