import { useCustomScrollbar } from "../../hooks/useCustomScrollbar";

export function CustomScrollbar({ scrollRef }) {
  const { trackRef, thumb, handleThumbMouseDown } = useCustomScrollbar(scrollRef);

  return (
    <div
      ref={trackRef}
      className={`relative hidden shrink-0 rounded-full bg-[var(--color-border)]/40 md:block ${thumb.visible ? "ml-base" : "ml-0"}`}
      style={{
        opacity: thumb.visible ? 1 : 0,
        width: thumb.visible ? "0.25rem" : 0,
      }}
    >
      <div
        onMouseDown={handleThumbMouseDown}
        className="absolute left-0 right-0 w-1 cursor-pointer rounded-full bg-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-hover)]"
        style={{ height: thumb.height, top: thumb.top }}
      />
    </div>
  );
}
