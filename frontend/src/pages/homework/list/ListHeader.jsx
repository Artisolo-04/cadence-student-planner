import { Plus } from "lucide-react";
import { LayoutGrid, List as ListIcon } from "lucide-react";
import Button from "../../../components/ui/Button";
import SegmentedControl from "../../../components/ui/SegmentedControl";

const VIEWS = [
  { id: "list", label: "List", Icon: ListIcon },
  { id: "board", label: "Board", Icon: LayoutGrid },
];

export default function ListHeader({ view, onViewChange, onAddNew }) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 shrink-0">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Your homework</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Track what's due and mark it off as you go.
        </p>
      </div>
      <div className="flex w-full flex-nowrap items-center gap-2 sm:w-auto sm:shrink-0">
        <SegmentedControl
          ariaLabel="View"
          options={VIEWS}
          value={view}
          onChange={onViewChange}
          variant="icon"
          size="md"
          className="sm:hidden"
        />
        <SegmentedControl
          ariaLabel="View"
          options={VIEWS}
          value={view}
          onChange={onViewChange}
          variant="labeled"
          size="md"
          className="hidden sm:flex"
        />
        <Button type="button" onClick={onAddNew} className="h-9 flex-1 justify-center px-2.5 sm:flex-none sm:px-4">
          <Plus size={16} />
          <span className="text-xs sm:text-sm">New homework</span>
        </Button>
      </div>
    </header>
  );
}
