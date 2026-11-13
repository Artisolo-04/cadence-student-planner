import EmptyState from "../../../../components/ui/EmptyState";
import { BookOpen as EmptySubjectIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GripVertical, PanelRightClose } from "lucide-react";
import SubjectChip from "./SubjectChip";
import { readSubjectsShape } from "../entries/subjectsShape";
import { CustomScrollbar } from "../../../../components/ui/CustomScrollbar";

const NAME_W = ["w-3/4", "w-2/3", "w-4/5", "w-1/2", "w-3/5"];
const TEACHER_W = ["w-1/3", "w-2/5", "w-1/4", "w-1/3", "w-2/5"];

function SubjectChipsSkeleton() {
  const shape = readSubjectsShape() ?? [true, true, true, true, true];
  return (
    <>
      <span className="sr-only">Loading subjects</span>
      {shape.map((hasTeacher, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="sk relative flex items-center gap-2.5 overflow-hidden rounded-md border-t border-white/15 py-2.5 pl-3.5 pr-3"
          style={{ "--sk-delay": `-${i * 0.2}s` }}
        >
          <div className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-bold leading-snug">
              <span className={`inline-block h-[0.72em] rounded-[3px] bg-[color-mix(in_srgb,var(--color-text)_16%,transparent)] align-baseline ${NAME_W[i % 5]}`} />
            </span>
            {hasTeacher && (
              <span className="block truncate text-[11px] font-semibold">
                <span className={`inline-block h-[0.72em] rounded-[3px] bg-[color-mix(in_srgb,var(--color-text)_16%,transparent)] align-baseline ${TEACHER_W[i % 5]}`} />
              </span>
            )}
          </div>
          <GripVertical size={14} className="shrink-0 text-[var(--color-text-muted)] opacity-50" />
        </div>
      ))}
    </>
  );
}

export default function SubjectsDrawer({ subjects, loading = false, onClose }) {
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
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-surface))] px-4 py-3">
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

      <div className="relative flex min-h-0 flex-1 overflow-hidden p-2">
        <div
          ref={scrollRef}
          onScroll={updateScrollFades}
          className="h-full min-w-0 flex-1 overflow-y-auto rounded-xl px-1 scrollbar-hidden"
        >
          <div aria-busy={loading || undefined} className={`flex flex-col gap-2 ${!loading && subjects.length === 0 ? "min-h-full" : ""}`}>
            {loading && <SubjectChipsSkeleton />}
            {!loading && subjects.map((subject) => (
              <SubjectChip key={subject.id} subject={subject} />
            ))}
            {!loading && subjects.length === 0 && (
              <EmptyState variant="compact" className="flex-1" icon={EmptySubjectIcon} title="No subjects yet" body="Add one to start planning." />
            )}
          </div>
        </div>

        <CustomScrollbar scrollRef={scrollRef} />

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
