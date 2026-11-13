import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Check, BookOpen } from "lucide-react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import { CustomScrollbar } from "../../../../components/ui/CustomScrollbar";
import SegmentedControl from "../../../../components/ui/SegmentedControl";
import SubjectPickerRow from "./SubjectPickerRow";
import { readSubjectsShape } from "../entries/subjectsShape";

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
  loading = false,
}) {
  const scrollRef = useRef(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const [search, setSearch] = useState("");
  const [groupTag, setGroupTag] = useState("all");
  const [room, setRoom] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  // Freeze title and footer while the modal fades out, so they don't jump when activeCell becomes null.
  const lastShown = useRef({ cellLabel: "", hasCurrent: false });
  if (open) lastShown.current = { cellLabel, hasCurrent: currentSubjectId != null };
  const shownLabel = open ? cellLabel : lastShown.current.cellLabel;
  const shownHasCurrent = open ? currentSubjectId != null : lastShown.current.hasCurrent;

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
      title={shownLabel || "Assign subject"}
      mobileFullscreen
      footer={
        <>
          {shownHasCurrent && (
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
      <div className="flex h-full min-h-0 flex-col gap-4">
        <div className="flex items-center gap-2">
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

        {loading ? (
          <div role="status" aria-busy="true" className="flex flex-col gap-4">
            <span className="sr-only">Loading subjects</span>
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
              />
              <Input
                id="subject-picker-search-loading"
                placeholder="Search subjects..."
                className="pl-9"
                disabled
                tabIndex={-1}
              />
            </div>
            <div aria-hidden="true" className="flex flex-col gap-1.5">
              {(readSubjectsShape() ?? [true, true, true, true]).slice(0, 4).map((hasTeacher, i) => (
                <div
                  key={i}
                  className="sk relative flex min-h-[52px] items-center gap-3 overflow-hidden rounded-lg border-t border-white/15 px-3 py-2"
                  style={{ "--sk-delay": `-${i * 0.2}s` }}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/25 bg-white/20">
                    <BookOpen size={15} className="text-[var(--color-text-muted)] opacity-60" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">
                      <span className={`inline-block h-[0.72em] rounded-[3px] bg-[color-mix(in_srgb,var(--color-text)_16%,transparent)] align-baseline ${["w-2/3", "w-3/4", "w-1/2", "w-3/5"][i % 4]}`} />
                    </span>
                    {hasTeacher && (
                      <span className="block truncate text-xs font-semibold">
                        <span className={`inline-block h-[0.72em] rounded-[3px] bg-[color-mix(in_srgb,var(--color-text)_16%,transparent)] align-baseline ${["w-1/3", "w-2/5", "w-1/4", "w-1/3"][i % 4]}`} />
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : subjects.length === 0 ? (
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
                <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">
                  No subjects match "{search}".
                </p>
              ) : (
                <div
                  ref={scrollRef}
                  onScroll={handleScroll}
                  style={{ "--list-max-height": `${LIST_MAX_HEIGHT}px` }}
                  className="flex min-w-0 flex-1 flex-col gap-1.5 overflow-y-auto scrollbar-hidden sm:max-h-[var(--list-max-height)]"
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
