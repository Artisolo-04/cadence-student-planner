import { Eye, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Checkbox from "../../components/ui/Checkbox";
import Button from "../../components/ui/Button";

const MY_GROUP_OPTIONS = [
  { value: "g1", label: "G1" },
  { value: "g2", label: "G2" },
  { value: null, label: "Not set" },
];

const GROUP_OPTIONS = [
  { value: "both", label: "Both groups" },
  { value: "my", label: "My group" },
  { value: "other", label: "Other group" },
];

function SegmentedControl({ options, value, onChange, disabledOption }) {
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );

  return (
    <div className="relative grid grid-cols-3 rounded-lg bg-[var(--color-surface-alt)] p-1.5">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1.5 left-1.5 top-1.5 w-[calc((100%-12px)/3)] rounded-md bg-[var(--color-primary)]/15 shadow-sm transition-transform duration-200 ease-in-out"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />

      {options.map((option) => {
        const active = option.value === value;
        const disabled = disabledOption?.(option);

        return (
          <button
            key={option.label}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`relative z-10 cursor-pointer rounded-md px-2 py-2 text-xs font-medium transition-colors duration-200
              disabled:cursor-not-allowed disabled:opacity-45
              ${
                active
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-text-muted)]"
              }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default function ViewOptionsPanel({
  myGroup,
  onMyGroupChange,
  viewOptions,
  onViewOptionChange,
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    let raf1;
    let raf2;

    if (open) {
      setMounted(true);
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const timeout = setTimeout(() => setMounted(false), 150);
      return () => clearTimeout(timeout);
    }

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [open]);

  useEffect(() => {
    function onClickOutside(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleMyGroupChange(nextGroup) {
    onMyGroupChange(nextGroup);

    if (nextGroup === null) {
      onViewOptionChange("groupVisibility", "both");
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <Button
        variant="secondary"
        onClick={() => setOpen((current) => !current)}
        className={
          open
            ? "border-[var(--color-primary)]/60 bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
            : ""
        }
        aria-expanded={open}
      >
        <Eye size={16} />
        View
      </Button>

      {mounted && (
        <div
          className={`absolute right-0 z-30 mt-2 w-72 origin-top-right rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-xl transition-all duration-150 ease-out ${
            visible
              ? "translate-y-0 scale-100 opacity-100"
              : "-translate-y-1 scale-95 opacity-0"
          }`}
        >
          <div className="flex items-center gap-2 px-1 pb-3">
            <Eye size={16} className="text-[var(--color-primary)]" />
            <h3 className="text-sm font-semibold text-[var(--color-text)]">
              View options
            </h3>
          </div>

          <div className="border-t border-[var(--color-border)] py-3">
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              My group
            </p>
            <div className="mt-2">
              <SegmentedControl
                options={MY_GROUP_OPTIONS}
                value={myGroup}
                onChange={handleMyGroupChange}
              />
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] py-3">
            <div className="flex items-center gap-2 px-1">
              <Users size={15} className="text-[var(--color-text-muted)]" />
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Show groups
              </p>
            </div>
            <div className="mt-2">
              <SegmentedControl
                options={GROUP_OPTIONS}
                value={viewOptions.groupVisibility}
                onChange={(value) =>
                  onViewOptionChange("groupVisibility", value)
                }
                disabledOption={(option) =>
                  !myGroup && option.value !== "both"
                }
              />
            </div>
            {!myGroup && (
              <p className="mt-2 px-1 text-xs text-[var(--color-text-muted)]">
                Choose G1 or G2 to filter the timetable.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-[var(--color-border)] px-1 pt-4">
            <Checkbox
              id="view-options-show-teacher"
              label="Show teacher"
              checked={viewOptions.showTeacher}
              onChange={(event) =>
                onViewOptionChange("showTeacher", event.target.checked)
              }
              className="w-full flex-row-reverse justify-between"
            />
            <Checkbox
              id="view-options-show-room"
              label="Show room"
              checked={viewOptions.showRoom}
              onChange={(event) =>
                onViewOptionChange("showRoom", event.target.checked)
              }
              className="w-full flex-row-reverse justify-between"
            />
          </div>
        </div>
      )}
    </div>
  );
}
