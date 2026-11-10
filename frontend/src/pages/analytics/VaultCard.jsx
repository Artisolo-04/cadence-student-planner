import { useState } from "react";
import { ChevronRight, FolderOpen } from "lucide-react";
import AnalyticsTile from "./AnalyticsTile";
import { ChartEmpty } from "./MiniBars";
import TileSwitch from "./TileSwitch";
import { formatBytes } from "./analyticsUtils";

const TYPE_META = {
  pdf: { label: "PDF", color: "var(--color-file-pdf)" },
  link: { label: "Links", color: "var(--color-link-default)" },
  docx: { label: "Word", color: "var(--color-file-doc)" },
  doc: { label: "Word", color: "var(--color-file-doc)" },
  xlsx: { label: "Spreadsheets", color: "var(--color-file-sheet)" },
  csv: { label: "Spreadsheets", color: "var(--color-file-sheet)" },
  image: { label: "Images", color: "var(--color-file-image)" },
  text: { label: "Text", color: "var(--color-file-txt)" },
};

export function typeMeta(type) {
  return TYPE_META[type] ?? { label: String(type).toUpperCase(), color: "var(--color-file-generic)" };
}

const VIEWS = [
  { id: "type", label: "Type", title: "Group by file type" },
  { id: "folder", label: "Folder", title: "Group by where it is stored" },
];

const MAX_ROWS = 3;

// Folders have no fixed color, so use the primary color at decreasing strength
const folderColor = (i) => `color-mix(in srgb, var(--color-primary) ${Math.max(100 - i * 18, 28)}%, transparent)`;

function Row({ color, label, right, share }) {
  return (
    <div className="grid grid-cols-[minmax(0,34%)_minmax(0,1fr)_5.5rem] items-center gap-3 text-xs">
      <span className="flex min-w-0 items-center gap-2 text-[var(--color-text)]">
        <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
        <span className="truncate" title={label}>
          {label}
        </span>
      </span>
      <div className="h-1.5 overflow-hidden rounded-sm bg-[var(--color-fill-3)]">
        <div className="h-full rounded-sm" style={{ width: `${share}%`, backgroundColor: color }} />
      </div>
      <span className="text-right font-mono text-[11px] text-[var(--color-text-muted)]">{right}</span>
    </div>
  );
}

export default function VaultCard({ vault, onExpand }) {
  const [view, setView] = useState("type");

  const total = vault?.totalResources ?? 0;
  const types = vault?.byType ?? [];
  const destinations = vault?.byDestination ?? [];
  const canSwitch = destinations.length > 0;
  const mode = canSwitch ? view : "type";

  const entries =
    mode === "type"
      ? types.map((t) => {
          const meta = typeMeta(t.resourceType);
          return { key: t.resourceType, label: meta.label, color: meta.color, count: t.count, right: String(t.count) };
        })
      : destinations.map((d, i) => ({
          key: `${d.destinationType}-${d.subjectId ?? d.folderName ?? i}`,
          label: d.subjectName ?? d.folderName ?? "Unassigned",
          color: folderColor(i),
          count: d.count,
          right: `${d.count} · ${formatBytes(d.storageBytes)}`,
        }));

  const sum = Math.max(1, entries.reduce((s, e) => s + e.count, 0));
  const shown = entries.slice(0, MAX_ROWS);
  const hidden = entries.length - shown.length;

  return (
    <AnalyticsTile
      icon={FolderOpen}
      title="Vault"
      scroll={false}
      onExpand={onExpand}
      meta={total > 0 ? formatBytes(vault.storageBytes) : null}
      actions={
        canSwitch ? <TileSwitch ariaLabel="Group vault by" options={VIEWS} value={mode} onChange={setView} /> : null
      }
    >
      {total === 0 ? (
        <ChartEmpty icon={FolderOpen}>Your vault is empty. Add a PDF, document, or link to see it here.</ChartEmpty>
      ) : (
        <div className="flex h-full min-h-0 flex-col gap-3">
          <p className="shrink-0 text-xs text-[var(--color-text-muted)]">
            <span className="mr-1.5 text-2xl font-bold tabular-nums text-[var(--color-text)]">{total}</span>
            {total === 1 ? "resource" : "resources"} · {vault.fileCount} {vault.fileCount === 1 ? "file" : "files"} ·{" "}
            {vault.linkCount} {vault.linkCount === 1 ? "link" : "links"}
          </p>

          <div className="flex h-2 w-full shrink-0 gap-0.5 overflow-hidden rounded-md">
            {entries.map((e) => (
              <div
                key={e.key}
                title={`${e.label}: ${e.count}`}
                className="h-full rounded-sm"
                style={{ width: `${(e.count / sum) * 100}%`, backgroundColor: e.color }}
              />
            ))}
          </div>

          {/* Rows share the free height evenly */}
          <div className={`flex min-h-0 flex-1 flex-col overflow-hidden ${shown.length >= MAX_ROWS ? "justify-evenly" : "justify-start gap-3"}`}>
            {shown.map((e) => (
              <Row key={e.key} color={e.color} label={e.label} right={e.right} share={(e.count / sum) * 100} />
            ))}
          </div>

          {hidden > 0 && (
            <button
              type="button"
              onClick={onExpand}
              className="flex shrink-0 items-center gap-1 self-start text-[11px] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]"
            >
              +{hidden} more · See all
              <ChevronRight size={12} />
            </button>
          )}
        </div>
      )}
    </AnalyticsTile>
  );
}
