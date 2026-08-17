import { LayoutGrid, List as ListIcon } from "lucide-react";

const VIEWS = [
  { key: "list", label: "List", icon: ListIcon },
  { key: "board", label: "Board", icon: LayoutGrid },
];

export default function ViewToggle({ view, onChange }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
      {VIEWS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
            view === key
              ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          }`}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}
