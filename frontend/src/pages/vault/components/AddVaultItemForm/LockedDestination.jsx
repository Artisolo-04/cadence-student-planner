import { Lock } from "lucide-react";

export default function LockedDestination({ icon: Icon, label, name }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] text-[var(--color-primary)]">
        <Icon size={14} />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-[var(--color-text)]">{name}</span>
        <span className="text-[11px] text-[var(--color-text-muted)]">{label}</span>
      </div>
      <Lock size={13} className="ml-auto shrink-0 text-[var(--color-text-muted)]" />
    </div>
  );
}
