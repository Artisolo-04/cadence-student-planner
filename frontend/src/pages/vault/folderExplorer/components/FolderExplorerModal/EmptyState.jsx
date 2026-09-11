import Button from "../../../../../components/ui/Button";
import { Plus } from "lucide-react";

export default function EmptyFolderState({ onAddResource, folderTarget }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_3%,var(--color-surface))]">
      <p className="text-sm text-[var(--color-text-muted)]">
        No resources yet in this folder.
      </p>
      {onAddResource && (
        <Button
          variant="secondary"
          onClick={() => onAddResource(folderTarget)}
          className="gap-1.5 px-3 py-2 text-xs"
        >
          <Plus size={14} />
          Add the first resource
        </Button>
      )}
    </div>
  );
}
