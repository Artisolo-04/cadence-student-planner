import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Search, X, Check } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { getDuplicateSiblingHint } from "./timetableGridUtils";

const GROUP_OPTIONS = [
  { value: "all", label: "All" },
  { value: "g1", label: "G1" },
  { value: "g2", label: "G2" },
];

export default function SubjectPickerModal({
  open,
  onClose,
  subjects,
  currentSubjectId,
  currentGroupTag,
  currentRoom,
  onSelect,
  onClear,
  cellLabel,
  cellEntries,
}) {
  const scrollRef = useRef(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const [search, setSearch] = useState("");
  const [groupTag, setGroupTag] = useState("all");
  const [room, setRoom] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  useMemo(
    () =>
      getDuplicateSiblingHint({
        cellEntries,
        targetGroupTag: groupTag,
        subjectId: selectedSubjectId,
      }),
    [cellEntries, groupTag, selectedSubjectId]
  );

  useEffect(() => {
    if (open) {
      setSearch("");
      setGroupTag(currentGroupTag || "all");
      setRoom(currentRoom || "");
      setSelectedSubjectId(currentSubjectId ?? null);
    }
  }, [open, currentGroupTag, currentRoom, currentSubjectId]);

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

  function handleSave() {
    if (selectedSubjectId == null) return;
    onSelect({ subjectId: selectedSubjectId, groupTag, room: room.trim() });
  }

  return (
    <Modal open={open} onClose={onClose} title={cellLabel || "Assign subject"}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          {GROUP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setGroupTag(opt.value)}
              className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors duration-150
                focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]
                ${
                  groupTag === opt.value
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]"
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <Input
          id="subject-picker-room"
          placeholder="Room (optional)"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />

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
                    const selected = subject.id === selectedSubjectId;
                    return (
                      <button
                        key={subject.id}
                        type="button"
                        onClick={() => setSelectedSubjectId(subject.id)}
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
                        {selected && (
                          <Check size={16} className="shrink-0 text-[var(--color-primary)]" />
                        )}
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

        <div className="flex items-center gap-2">
          {currentSubjectId != null && (
            <Button
              type="button"
              variant="secondary"
              onClick={onClear}
              className="flex-1 justify-center"
            >
              <X size={16} />
              Clear this cell
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSave}
            disabled={selectedSubjectId == null}
            className="flex-1 justify-center"
          >
            <Check size={16} />
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
