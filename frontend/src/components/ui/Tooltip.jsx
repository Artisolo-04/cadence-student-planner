import { useState } from "react";

export default function Tooltip({ label, children }) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className="absolute left-full top-1/2 -translate-y-1/2 ml-comfy whitespace-nowrap px-cozy py-snug rounded-md text-xs font-medium shadow-md z-[9999] pointer-events-none animate-in fade-in zoom-in-95 slide-in-from-left-1 duration-150"
          style={{
            backgroundColor: "var(--color-text)",
            color: "var(--color-bg)",
          }}
        >
          <div
            className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0"
            style={{
              borderTop: "5px solid transparent",
              borderBottom: "5px solid transparent",
              borderRight: "5px solid var(--color-text)",
            }}
          />
          {label}
        </div>
      )}
    </div>
  );
}
