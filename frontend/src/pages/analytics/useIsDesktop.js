import { useEffect, useState } from "react";

const DESKTOP_QUERY = "(min-width: 1024px)"; // same as Tailwind lg

export default function useIsDesktop() {
  const [desktop, setDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setDesktop(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return desktop;
}
