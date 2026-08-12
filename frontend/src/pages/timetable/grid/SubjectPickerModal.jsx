import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Check } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import SubjectPickerRow from "./SubjectPickerRow";

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

  const scrollFadeRaf = useRef(null);

  function updateScrollFades() {
    const element = scrollRef.current;
    if (!element) return;

    setShowTopFade(element.scrollTop > 4);
    setShowBottomFade(
      element.scrollTop + element.clientHeight < element.scrollHeight - 4
    );
  }

  function handleScroll() {
    if (scrollFadeRaf.current) return;
    scrollFadeRaf.current = requestAnimationFrame(() => {
      updateScrollFades();
      scrollFadeRaf.current = null;
    });
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
                  onScroll={handleScroll}
                  className="flex max-h-72 flex-col gap-1.5 overflow-y-auto scrollbar-cadence pr-2"
                >
                  {filteredSubjects.map((subject) => (
                    <SubjectPickerRow
                      key={subject.id}
                      subject={subject}
                      selected={subject.id === selectedSubjectId}
                      onSelect={() => setSelectedSubjectId(subject.id)}
                    />
                  ))}
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
