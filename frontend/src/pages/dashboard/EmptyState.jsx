import { Calendar } from "lucide-react";

export default function EmptyState({ title, body }) {
  return (
    <div className="flex flex-col items-center justify-center gap-roomy py-empty-state-y text-center">
      <div className="rounded-full bg-[var(--color-surface-alt)] p-roomy">
        <Calendar size={28} className="text-[var(--color-text-muted)]" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-tight">{body}</p>
      </div>
    </div>
  );
}
