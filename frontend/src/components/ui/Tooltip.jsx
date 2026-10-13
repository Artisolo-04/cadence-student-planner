import { useState } from "react";

const SIDES = {
  right: {
    box: "left-full top-1/2 -translate-y-1/2 ml-3 slide-in-from-left-1",
    arrowPos: "right-full top-1/2 -translate-y-1/2",
    arrow: { borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderRight: "5px solid var(--color-text)" },
  },
  top: {
    box: "bottom-full left-1/2 -translate-x-1/2 mb-2 slide-in-from-bottom-1",
    arrowPos: "top-full left-1/2 -translate-x-1/2",
    arrow: { borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid var(--color-text)" },
  },
  bottom: {
    box: "top-full left-1/2 -translate-x-1/2 mt-2 slide-in-from-top-1",
    arrowPos: "bottom-full left-1/2 -translate-x-1/2",
    arrow: { borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderBottom: "5px solid var(--color-text)" },
  },
};

export default function Tooltip({ label, children, side = "right" }) {
  const [visible, setVisible] = useState(false);
  const s = SIDES[side] ?? SIDES.right;

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
          className={`absolute ${s.box} whitespace-nowrap px-2.5 py-1.5 rounded-md text-xs font-medium shadow-md z-[9999] pointer-events-none animate-in fade-in zoom-in-95 duration-150`}
          style={{
            backgroundColor: "var(--color-text)",
            color: "var(--color-bg)",
          }}
        >
          <div className={`absolute ${s.arrowPos} w-0 h-0`} style={s.arrow} />
          {label}
        </div>
      )}
    </div>
  );
}
