import { Plus } from "lucide-react";
import Button from "../../../components/ui/Button";
import ViewToggle from "./ViewToggle";

export default function ListHeader({ view, onViewChange, onAddNew }) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Your homework</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Track what's due and mark it off as you go.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <ViewToggle view={view} onChange={onViewChange} />
        <Button type="button" onClick={onAddNew} className="shrink-0">
          <Plus size={16} />
          New homework
        </Button>
      </div>
    </header>
  );
}
