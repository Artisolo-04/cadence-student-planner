import { useEffect, useRef, useState } from "react";
import { PanelRightClose } from "lucide-react";
import SubjectChip from "./SubjectChip";

export default function SubjectsDrawer({ subjects, onClose }) {
  const scrollRef = useRef(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  function updateScrollFades() {
    const element = scrollRef.current;
    if (!element) return;

    setShowTopFade(element.scrollTop > 4);
    setShowBottomFade(
      element.scrollTop + element.clientHeight < element.scrollHeight - 4
    );
  }

  useEffect(() => {
    const frame = requestAnimationFrame(updateScrollFades);
    window.addEventListener("resize", updateScrollFades);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScrollFades);
    };
  }, [subjects]);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset,0_20px_40px_-24px_rgba(0,0,0,0.6)]">
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text)]">Subjects</h3>
          <p className="text-[11px] text-[var(--color-text-muted)]">Drag onto a cell</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
            aria-label="Close subjects drawer"
            title="Close drawer"
          >
            <PanelRightClose size={16} />
          </button>
        )}
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden p-2">
        <div
          ref={scrollRef}
          onScroll={updateScrollFades}
          className="h-full overflow-y-auto rounded-xl p-1 pr-2 scrollbar-cadence"
        >
          <div className="flex flex-col gap-2">
            {subjects.map((subject) => (
              <SubjectChip key={subject.id} subject={subject} />
            ))}
            {subjects.length === 0 && (
              <p className="px-1 py-4 text-center text-[12px] text-[var(--color-text-muted)]">
                No subjects yet.
              </p>
            )}
          </div>
        </div>

        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-2 top-2 z-10 h-10 bg-gradient-to-b from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${
            showTopFade ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-2 bottom-2 z-10 h-12 bg-gradient-to-t from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${
            showBottomFade ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
    </aside>
  );
}
