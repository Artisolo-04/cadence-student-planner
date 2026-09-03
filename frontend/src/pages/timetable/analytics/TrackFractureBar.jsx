import { useState } from "react";
import Modal from "../../../components/ui/Modal";
import ScheduleDetails from "./ScheduleDetails";

export default function TrackFractureBar({
  trackFracture,
  scopeLabel = "All groups",
  rawEntries = [],
  slots = [],
}) {
  const { fullWidthMinutesPercent, splitMinutesPercent, fullWidthPercent, splitPercent } = trackFracture;
  const [selected, setSelected] = useState(null); 

  const fullWidthEntries = rawEntries.filter((e) => e.group_tag === "all");
  const splitEntries = rawEntries.filter((e) => e.group_tag !== "all");

  const selectedEntries = selected === "full" ? fullWidthEntries : selected === "split" ? splitEntries : [];
  const selectedTitle = selected === "full" ? "Full-width classes" : "Split-track classes";
  const selectedPercent = selected === "full" ? fullWidthMinutesPercent : splitMinutesPercent;

  const rows = [
    {
      key: "full",
      dot: "#5eead4",
      label: "Full-width",
      percent: fullWidthMinutesPercent,
      entriesPercent: fullWidthPercent,
      count: fullWidthEntries.length,
      gradient: "linear-gradient(90deg, #5eead4 0%, #0f766e 100%)",
    },
    {
      key: "split",
      dot: "#fb7185",
      label: "Split",
      percent: splitMinutesPercent,
      entriesPercent: splitPercent,
      count: splitEntries.length,
      gradient: "linear-gradient(90deg, #fb7185 0%, #be123c 100%)",
    },
  ];

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="shrink-0">
          <h3 className="text-[15px] font-medium text-[var(--color-text)]">Lecture vs. Workshop Balance</h3>
          <span className="text-xs text-[var(--color-text-muted)]">{scopeLabel}, by time</span>
        </div>

        <div className="mt-5 flex h-2.5 w-full shrink-0 overflow-hidden rounded-full bg-[var(--color-border)]">
          <div style={{ width: `${fullWidthMinutesPercent}%`, background: "#5eead4" }} />
          <div style={{ width: `${splitMinutesPercent}%`, background: "#fb7185" }} />
        </div>

        <div className="mt-5 flex flex-1 min-h-0 flex-col justify-center gap-2">
          {rows.map((row) => (
            <button
              key={row.key}
              type="button"
              disabled={row.count === 0}
              onClick={() => row.count > 0 && setSelected(row.key)}
              title={row.count > 0 ? `Open ${row.label.toLowerCase()} classes` : undefined}
              className={`group flex w-full flex-col gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-left transition-colors duration-200 ${
                row.count > 0
                  ? "bg-[var(--color-surface-alt)]/50 hover:border-[color-mix(in_srgb,var(--color-primary)_45%,transparent)] hover:bg-[var(--color-surface-alt)]/80"
                  : "cursor-default bg-[var(--color-surface-alt)]/20 opacity-60"
              }`}
            >
              <div className="flex min-w-0 items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.dot }} />
                  <span className="truncate text-sm font-medium text-[var(--color-text)]">{row.label}</span>
                </span>
                <span className="shrink-0 text-xs font-medium tabular-nums text-[var(--color-text-muted)]">
                  {row.percent}%
                </span>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-border)_60%,transparent)]">
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{ width: `${row.percent > 0 ? Math.max(row.percent, 4) : 0}%`, background: row.gradient }}
                />
              </div>

              <p className="text-[11px] text-[var(--color-text-muted)]">{row.entriesPercent}% of entries</p>
            </button>
          ))}
        </div>
      </div>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selectedTitle} elevated>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Share of time" value={`${selectedPercent}%`} />
            <Metric label="Classes" value={`${selectedEntries.length}`} />
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
              Scheduled classes
            </p>
            <ScheduleDetails entries={selectedEntries} slots={slots} />
          </div>
        </div>
      </Modal>
    </>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)]/40 p-3">
      <p className="text-[11px] text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-0.5 text-base font-semibold tabular-nums text-[var(--color-text)]">
        {value}
      </p>
    </div>
  );
}
