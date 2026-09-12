export function TopFade({ show, fromColor = "var(--color-surface)", className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-10 transition-opacity duration-200 ${
        show ? "opacity-100" : "opacity-0"
      } ${className}`}
      style={{ backgroundImage: `linear-gradient(to bottom, ${fromColor}, transparent)` }}
    />
  );
}

export function BottomFade({ show, fromColor = "var(--color-surface)", className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 transition-opacity duration-200 ${
        show ? "opacity-100" : "opacity-0"
      } ${className}`}
      style={{ backgroundImage: `linear-gradient(to top, ${fromColor}, transparent)` }}
    />
  );
}
