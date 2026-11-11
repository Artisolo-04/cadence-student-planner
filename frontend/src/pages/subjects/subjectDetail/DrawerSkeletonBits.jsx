export function Sk({ className = "", delay = 0 }) {
  return (
    <span
      aria-hidden="true"
      className={`sk inline-block align-baseline ${className}`}
      style={{ "--sk-delay": `-${delay}s` }}
    />
  );
}
