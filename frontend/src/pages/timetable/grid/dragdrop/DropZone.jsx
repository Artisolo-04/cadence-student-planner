import { useDroppable } from "@dnd-kit/core";

export function DropZone({
  id,
  disabled,
  isFilled,
  children,
  className,
  onClick,
  highlightClass,
}) {
  const { setNodeRef, isOver, active } = useDroppable({ id, disabled });
  const isHighlighted = Boolean(active) && !disabled && isOver;

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={`relative transition-colors duration-150 ease-out ${className || ""}`}
    >
      {isHighlighted && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute z-30 ${highlightClass || "inset-0"} bg-orange-400/10 ring-2 ring-inset ring-orange-400 shadow-[inset_0_0_0_1px_rgba(251,146,60,0.25)]`}
        />
      )}
      {children}
    </div>
  );
}
