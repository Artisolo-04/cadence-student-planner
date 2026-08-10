import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Search, X } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

export default function SubjectPickerModal({
  open,
  onClose,
  subjects,
  currentSubjectId,
  onSelect,
  onClear,
  cellLabel,
}) {
  const scrollRef = useRef(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) setSearch("");
  }, [open]);

  const filteredSubjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return subjects;
    return subjects.filter(
      (subject) =>
        subject.name.toLowerCase().includes(query) ||
        subject.teacher?.toLowerCase().includes(query)
    );
  }, [subjects, search]);

  function updateScrollFades() {
    const element = scrollRef.current;
    if (!element) return;

    setShowTopFade(element.scrollTop > 4);
    setShowBottomFade(
      element.scrollTop + element.clientHeight < element.scrollHeight - 4
    );
  }

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(updateScrollFades);
    window.addEventListener("resize", updateScrollFades);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScrollFades);
    };
  }, [open, filteredSubjects]);

  return (
    <Modal open={open} onClose={onClose} title={cellLabel || "Assign subject"}>
      <div className="flex flex-col gap-4">
        {subjects.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            You don't have any subjects yet. Add one from the Subjects page first.
          </p>
        ) : (
          <>
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
              />
              <Input
                id="subject-picker-search"
                placeholder="Search subjects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>

            <div className="relative w-full h-full">
              {filteredSubjects.length === 0 ? (
                <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">
                  No subjects match "{search}".
                </p>
              ) : (
                <div
                  ref={scrollRef}
                  onScroll={updateScrollFades}
                  className="flex max-h-72 flex-col gap-1.5 overflow-y-auto scrollbar-cadence pr-2"
                >
                  {filteredSubjects.map((subject) => {
                    const selected = subject.id === currentSubjectId;
                    return (
                      <button
                        key={subject.id}
                        type="button"
                        onClick={() => onSelect(subject.id)}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors duration-150
                          focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]
                          ${
                            selected
                              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                              : "border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]"
                          }`}
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: `${subject.color}1a` }}
                        >
                          <BookOpen size={15} style={{ color: subject.color }} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-[var(--color-text)]">
                            {subject.name}
                          </span>
                          {subject.teacher && (
                            <span className="block truncate text-xs text-[var(--color-text-muted)]">
                              {subject.teacher}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${
                  showTopFade ? "opacity-100" : "opacity-0"
                }`}
              />

              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${
                  showBottomFade ? "opacity-100" : "opacity-0"
                }`}
              />
            </div>
          </>
        )}

        {currentSubjectId != null && (
          <Button
            type="button"
            variant="secondary"
            onClick={onClear}
            className="justify-center"
          >
            <X size={16} />
            Clear this cell
          </Button>
        )}
      </div>
    </Modal>
  );
}
