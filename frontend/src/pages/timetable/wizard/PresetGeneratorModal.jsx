import { useMemo } from "react";
import { Clock3, Plus, ArrowRight } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import Dropdown from "../../../components/ui/Dropdown";
import Button from "../../../components/ui/Button";

const DURATION_OPTIONS = [
  { value: "45", label: "45 minutes" },
  { value: "60", label: "60 minutes" },
  { value: "90", label: "90 minutes" },
  { value: "120", label: "120 minutes" },
];

function addMinutes(time, minutes) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const wrapped = ((total % 1440) + 1440) % 1440;
  const hh = String(Math.floor(wrapped / 60)).padStart(2, "0");
  const mm = String(wrapped % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function PresetGeneratorModal({
  open,
  onClose,
  generating,
  presetStart,
  setPresetStart,
  presetDuration,
  setPresetDuration,
  presetBreak,
  setPresetBreak,
  presetCount,
  setPresetCount,
  onGenerate,
}) {
  const preview = useMemo(() => {
    const duration = parseInt(presetDuration, 10);
    const gap = parseInt(presetBreak, 10) || 0;
    const count = Math.min(parseInt(presetCount, 10) || 0, 12);

    if (!presetStart || !duration || !count) return null;

    let cursor = presetStart;
    let end = cursor;
    for (let i = 0; i < count; i += 1) {
      end = addMinutes(cursor, duration);
      cursor = addMinutes(end, gap);
    }

    return { start: presetStart, end, count, duration, gap };
  }, [presetStart, presetDuration, presetBreak, presetCount]);

  return (
    <Modal
      open={open}
      onClose={generating ? () => {} : onClose}
      title="Generate slots"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={generating}>
            Cancel
          </Button>
          <Button type="button" onClick={onGenerate} disabled={generating}>
            <Plus size={16} />
            {generating ? "Generating..." : "Generate slots"}
          </Button>
        </>
      }
    >
      <div className="flex gap-4 items-center justify-between">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] ring-1 ring-inset ring-[var(--color-accent)]/15">
          <Clock3 size={18} />
        </span>
        <p className="p-2 text-sm leading-6 text-[var(--color-text-muted)]">
          Create an evenly spaced schedule. You can fine-tune each slot afterwards.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
        <Input
          id="preset-start"
          label="Start time"
          type="time"
          value={presetStart}
          onChange={(event) => setPresetStart(event.target.value)}
        />
        <Dropdown
          id="preset-duration"
          label="Slot duration"
          value={presetDuration}
          onChange={(event) => setPresetDuration(event.target.value)}
          options={DURATION_OPTIONS}
        />
        <Input
          id="preset-break"
          label="Break (minutes)"
          type="number"
          min="0"
          value={presetBreak}
          onChange={(event) => setPresetBreak(event.target.value)}
        />
        <Input
          id="preset-count"
          label="Number of slots"
          type="number"
          min="1"
          max="12"
          value={presetCount}
          onChange={(event) => setPresetCount(event.target.value)}
        />
      </div>

      <div className="mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/40 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Preview
        </div>

        {preview ? (
          <>
            <div className="mt-2 flex items-center gap-2.5">
              <span className="text-lg font-semibold text-[var(--color-text)] tabular-nums">
                {preview.start}
              </span>
              <ArrowRight size={16} className="text-[var(--color-accent)]" />
              <span className="text-lg font-semibold text-[var(--color-text)] tabular-nums">
                {preview.end}
              </span>
            </div>
            <p className="mt-1.5 text-[12px] text-[var(--color-text-muted)]">
              {preview.count} slots · {preview.duration} min each
              {preview.gap > 0 ? ` · ${preview.gap} min break` : ""}
            </p>
          </>
        ) : (
          <p className="mt-2 text-[12px] text-[var(--color-text-muted)]">
            Fill in the fields above to preview your schedule.
          </p>
        )}
      </div>
    </Modal>
  );
}
