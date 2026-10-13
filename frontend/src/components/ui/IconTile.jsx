export default function IconTile({
  icon: Icon,
  color = "var(--color-primary)",
  size = "md",
  className = "",
}) {
  if (!Icon) return null;

  return (
    <span
      aria-hidden="true"
      data-size={size}
      className={`icon-tile ${className}`}
      style={{ "--tile-color": color }}
    >
      <Icon strokeWidth={2} />
    </span>
  );
}
