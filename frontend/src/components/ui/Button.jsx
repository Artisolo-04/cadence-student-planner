const variants = {
  primary:
    "bg-[var(--color-primary)] text-[var(--color-primary-fg)] hover:bg-[var(--color-primary-hover)]",
  secondary:
    "bg-[var(--color-surface-alt)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-border)]",
  ghost:
    "bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]",
};

const sizes = {
  md: "gap-2 rounded-lg px-4 py-2 text-sm",
  icon: "h-9 w-9 rounded-lg p-0",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  onClick,
  className = "",
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center font-medium transition-colors
        focus:outline-none transition-shadow duration-150 focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
