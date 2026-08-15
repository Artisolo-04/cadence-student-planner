import { LayoutGrid } from "lucide-react";

export default function HomeworkBoard({ homework, onEdit, onReorder }) {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] py-24 text-center">
      <div className="rounded-full bg-[var(--color-surface-alt)] p-4">
        <LayoutGrid size={28} className="text-[var(--color-text-muted)]" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Board view is coming soon</h2>
      </div>
    </div>
  );
}
