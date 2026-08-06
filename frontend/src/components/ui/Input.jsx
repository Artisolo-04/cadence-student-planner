export default function Input({
  label,
  id,
  type = "text",
  error,
  className = "",
  ...rest
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--color-text)]">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        className={`rounded-lg border bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]
          placeholder:text-[var(--color-text-muted)]
          border-[var(--color-border)] transition-shadow duration-150
          focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)] focus-visible:border-[var(--color-ring)]
          ${error ? "border-[var(--color-danger)]" : ""} ${className}`}
        {...rest}
      />
      {error && <span className="text-xs text-[var(--color-danger)]">{error}</span>}
    </div>
  );
}
