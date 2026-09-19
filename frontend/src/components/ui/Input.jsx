export default function Input({
  label,
  id,
  type = "text",
  error,
  className = "",
  containerClassName = "",
  ...rest
}) {
  return (
    <div className={`flex flex-col gap-label ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--color-text)]">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        className={`w-full min-w-0 rounded-lg border bg-[var(--color-surface)] px-input-x py-input-y text-sm text-[var(--color-text)]
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
