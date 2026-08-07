import { createContext, useState, useEffect, useRef } from "react";

export const SidebarContext = createContext(null);

const FADE_DURATION = 150;
const RESIZE_DURATION = 200;

export function SidebarProvider({ children }) {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });
  const [contentVisible, setContentVisible] = useState(true);
  const timers = useRef([]);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", collapsed);
  }, [collapsed]);

  useEffect(() => {
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const toggleSidebar = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    setContentVisible(false);

    const t1 = setTimeout(() => {
      setCollapsed((prev) => !prev);

      const t2 = setTimeout(() => {
        setContentVisible(true);
      }, RESIZE_DURATION);

      timers.current.push(t2);
    }, FADE_DURATION);

    timers.current.push(t1);
  };

  return (
    <SidebarContext.Provider value={{ collapsed, toggleSidebar, contentVisible }}>
      {children}
    </SidebarContext.Provider>
  );
}
