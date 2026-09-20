import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Check } from "lucide-react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import { CustomScrollbar } from "../../../../components/ui/CustomScrollbar";
import SegmentedControl from "../../../../components/ui/SegmentedControl";
import SubjectPickerRow from "./SubjectPickerRow";

const ITEM_HEIGHT = 52;
const ITEM_GAP = 6;
const VISIBLE_ITEMS = 4;
const LIST_MAX_HEIGHT = VISIBLE_ITEMS * ITEM_HEIGHT + (VISIBLE_ITEMS - 1) * ITEM_GAP;

const GROUP_OPTIONS = [
  { id: "all", label: "All" },
  { id: "g1", label: "G1" },
  { id: "g2", label: "G2" },
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
    <Modal
      open={open}
      onClose={onClose}
      title={cellLabel || "Assign subject"}
      mobileFullscreen
      footer={
        <>
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
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-roomy">
        <div className="flex items-center gap-inline">
          <SegmentedControl
            ariaLabel="Filter by group"
            options={GROUP_OPTIONS}
            value={groupTag}
            onChange={setGroupTag}
          />
          <Input
            id="subject-picker-room"
            placeholder="Room"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            containerClassName="flex-1"
          />
        </div>

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

            <div className="relative flex min-h-0 w-full flex-1">
              {filteredSubjects.length === 0 ? (
                <p className="py-roomy text-center text-sm text-[var(--color-text-muted)]">
                  No subjects match "{search}".
                </p>
              ) : (
                <div
                  ref={scrollRef}
                  onScroll={handleScroll}
                  style={{ "--list-max-height": `${LIST_MAX_HEIGHT}px` }}
                  className="flex min-w-0 flex-1 flex-col gap-snug overflow-y-auto scrollbar-hidden sm:max-h-[var(--list-max-height)]"
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

              <CustomScrollbar scrollRef={scrollRef} />

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
      </div>
    </Modal>
  );
}
