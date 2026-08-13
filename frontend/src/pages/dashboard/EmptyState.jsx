import { Calendar } from "lucide-react";

export default function EmptyState({ title, body }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="rounded-full bg-[var(--color-surface-alt)] p-4">
        <Calendar size={28} className="text-[var(--color-text-muted)]" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">{body}</p>
      </div>
    </div>
  );
}
