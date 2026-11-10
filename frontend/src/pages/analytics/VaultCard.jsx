import { FolderOpen } from "lucide-react";
import AnalyticsTile from "./AnalyticsTile";
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

const MAX_ROWS = 3;

function MoreRow({ count }) {
  if (count <= 0) return null;
  return <p className="text-[11px] text-[var(--color-text-muted)]">+{count} more</p>;
}

export default function VaultCard({ vault, onExpand }) {
  const total = vault?.totalResources ?? 0;
  const types = vault?.byType ?? [];
  const destinations = vault?.byDestination ?? [];

  return (
    <AnalyticsTile
      icon={FolderOpen}
      title="Vault"
      onExpand={onExpand}
      meta={total > 0 ? formatBytes(vault.storageBytes) : null}
    >
      {total === 0 ? (
        <div className="flex h-full min-h-[5rem] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[var(--color-line)] px-4 text-center">
          <p className="text-xs text-[var(--color-text-muted)]">
            Your vault is empty. Add a PDF, document, or link to see it here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-[var(--color-text-muted)]">
            <span className="mr-1.5 text-2xl font-bold tabular-nums text-[var(--color-text)]">{total}</span>
            {total === 1 ? "resource" : "resources"} · {vault.fileCount} {vault.fileCount === 1 ? "file" : "files"} ·{" "}
            {vault.linkCount} {vault.linkCount === 1 ? "link" : "links"}
          </p>

          <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-md">
            {types.map((t) => (
              <div
                key={t.resourceType}
                title={`${typeMeta(t.resourceType).label}: ${t.count}`}
                className="h-full rounded-sm"
                style={{ width: `${(t.count / total) * 100}%`, backgroundColor: typeMeta(t.resourceType).color }}
              />
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-2">
              <p className="text-[11px] font-medium text-[var(--color-text-muted)]">By type</p>
              {types.slice(0, MAX_ROWS).map((t) => {
                const meta = typeMeta(t.resourceType);
                return (
                  <div key={t.resourceType} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-2 text-[var(--color-text)]">
                      <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: meta.color }} />
                      <span className="truncate">{meta.label}</span>
                    </span>
                    <span className="shrink-0 font-mono text-[var(--color-text-muted)]">{t.count}</span>
                  </div>
                );
              })}
              <MoreRow count={types.length - MAX_ROWS} />
            </div>

            {destinations.length > 0 && (
              <div className="flex min-w-0 flex-col gap-2">
                <p className="text-[11px] font-medium text-[var(--color-text-muted)]">Where it is stored</p>
                {destinations.slice(0, MAX_ROWS).map((d, i) => (
                  <div
                    key={`${d.destinationType}-${d.subjectId ?? d.folderName ?? i}`}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="truncate text-[var(--color-text)]" title={d.subjectName ?? d.folderName ?? ""}>
                      {d.subjectName ?? d.folderName ?? "Unassigned"}
                    </span>
                    <span className="shrink-0 font-mono text-[var(--color-text-muted)]">
                      {d.count} · {formatBytes(d.storageBytes)}
                    </span>
                  </div>
                ))}
                <MoreRow count={destinations.length - MAX_ROWS} />
              </div>
            )}
          </div>
        </div>
      )}
    </AnalyticsTile>
  );
}
