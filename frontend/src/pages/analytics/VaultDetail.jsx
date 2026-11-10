import { useState } from "react";
import { FileSpreadsheet, FileText, Folder, Image as ImageIcon, Link2 } from "lucide-react";
import { Empty, Stat } from "./DetailBits";
import ScrollArea from "./ScrollArea";
import TileSwitch from "./TileSwitch";
import { typeMeta } from "./VaultCard";
import { formatBytes } from "./analyticsUtils";

const P = "var(--color-primary)";
const tint = (color, pct) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

const VIEWS = [
  { id: "type", label: "Type", title: "Group by file type" },
  { id: "folder", label: "Folder", title: "Group by where it is stored" },
];

const TYPE_ICON = {
  link: Link2,
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
  image: ImageIcon,
};

const folderColor = (i) => `color-mix(in srgb, var(--color-primary) ${Math.max(100 - i * 18, 28)}%, transparent)`;

export default function VaultDetail({ vault }) {
  const [view, setView] = useState("type");

  const total = vault?.totalResources ?? 0;
  const types = vault?.byType ?? [];
  const destinations = vault?.byDestination ?? [];
  const mode = destinations.length > 0 ? view : "type";

  if (total === 0) return <Empty>Your vault is empty. Add a PDF, document, or link to see it here.</Empty>;

  const entries =
    mode === "type"
      ? types.map((t) => {
          const meta = typeMeta(t.resourceType);
          return {
            key: t.resourceType,
            label: meta.label,
            color: meta.color,
            icon: TYPE_ICON[t.resourceType] ?? FileText,
            count: t.count,
            sub: formatBytes(t.storageBytes),
          };
        })
      : destinations.map((d, i) => ({
          key: `${d.destinationType}-${d.subjectId ?? d.folderName ?? i}`,
          label: d.subjectName ?? d.folderName ?? "Unassigned",
          color: folderColor(i),
          icon: Folder,
          count: d.count,
          sub: formatBytes(d.storageBytes),
        }));

  const sum = Math.max(1, entries.reduce((s, e) => s + e.count, 0));
  const max = Math.max(1, ...entries.map((e) => e.count));
  const top = entries.reduce((a, b) => (b.count > (a?.count ?? 0) ? b : a), null);
  const share = (n) => Math.round((n / sum) * 100);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <section className="grid shrink-0 grid-cols-3 gap-2">
        <Stat label="Resources" value={total} color={P} />
        <Stat label="Storage" value={formatBytes(vault.storageBytes)} />
        <Stat label="Folders" value={destinations.length} />
      </section>

      <div className="flex shrink-0 items-center justify-between gap-3 text-xs text-[var(--color-text-muted)]">
        {destinations.length > 0 ? (
          <TileSwitch ariaLabel="Group vault by" options={VIEWS} value={mode} onChange={setView} />
        ) : (
          <span className="font-medium">By type</span>
        )}
        <span className="font-mono text-[10px]">
          {vault.fileCount} {vault.fileCount === 1 ? "file" : "files"} · {vault.linkCount}{" "}
          {vault.linkCount === 1 ? "link" : "links"}
        </span>
      </div>

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

      <ScrollArea watch={`${mode}-${entries.length}`}>
        <ul className="flex flex-col gap-2 py-1">
          {entries.map((e) => {
            const Icon = e.icon;
            const isTop = entries.length > 1 && top && e.key === top.key && entries.filter((x) => x.count === top.count).length === 1;
            return (
              <li
                key={e.key}
                className="flex flex-col gap-2.5 rounded-xl px-3.5 py-3"
                style={{
                  background: `linear-gradient(120deg, ${tint(e.color, isTop ? 20 : 12)} 0%, ${tint(e.color, 4)} 100%)`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ color: e.color, backgroundColor: tint(e.color, 20) }}
                  >
                    <Icon size={18} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-[13px] font-semibold text-[var(--color-text)]" title={e.label}>
                      {e.label}
                    </h4>
                    <p className="mt-0.5 truncate text-[11px] text-[var(--color-text-muted)]">
                      {e.count} {e.count === 1 ? "resource" : "resources"} ·{" "}
                      <span style={{ color: P }}>{share(e.count)}%</span>
                      {e.sub && ` · ${e.sub}`}
                      {isTop && " · most"}
                    </p>
                  </div>

                  <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-[var(--color-text)]">
                    {e.count}
                  </span>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-md" style={{ backgroundColor: tint(e.color, 14) }}>
                  <div
                    className="h-full rounded-md"
                    style={{ width: `${(e.count / max) * 100}%`, backgroundColor: e.color }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </div>
  );
}
