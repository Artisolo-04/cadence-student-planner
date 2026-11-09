import { formatBytes } from "./analyticsUtils";
import { typeMeta } from "./VaultCard";
import { Empty, SectionTitle, Stat } from "./DetailBits";

export default function VaultDetail({ vault }) {
  if (!vault || vault.totalResources === 0) {
    return <Empty>Your vault is empty. Add a PDF, document, or link to see it here.</Empty>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Resources" value={vault.totalResources} />
        <Stat label="Storage used" value={formatBytes(vault.storageBytes)} />
        <Stat label="Files" value={vault.fileCount} />
        <Stat label="Links" value={vault.linkCount} />
      </div>

      <section>
        <SectionTitle>By type</SectionTitle>
        <ul className="flex flex-col divide-y divide-[var(--color-line)]">
          {vault.byType.map((t) => {
            const meta = typeMeta(t.resourceType);
            return (
              <li key={t.resourceType} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 text-sm">
                <span className="flex items-center gap-2 text-[var(--color-text)]">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
                  {meta.label}
                </span>
                <span className="font-mono text-[var(--color-text-muted)]">
                  {t.count} · {formatBytes(t.storageBytes)}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <SectionTitle>Where it is stored</SectionTitle>
        <ul className="flex flex-col divide-y divide-[var(--color-line)]">
          {vault.byDestination.map((d, i) => (
            <li
              key={`${d.destinationType}-${d.subjectId ?? d.folderName ?? i}`}
              className="flex items-center justify-between gap-3 py-2.5 first:pt-0 text-sm"
            >
              <span className="truncate text-[var(--color-text)]" title={d.subjectName ?? d.folderName ?? ""}>
                {d.subjectName ?? d.folderName ?? "Unassigned"}
              </span>
              <span className="shrink-0 font-mono text-[var(--color-text-muted)]">
                {d.count} · {formatBytes(d.storageBytes)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
