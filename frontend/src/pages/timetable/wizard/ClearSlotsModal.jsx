import { AlertTriangle, Trash2 } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";

export default function ClearSlotsModal({
  open,
  slotCount,
  clearing,
  onClose,
  onConfirm,
}) {
  return (
    <Modal
      open={open}
      onClose={clearing ? () => {} : onClose}
      title="Clear all slots?"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={clearing}>
            Keep slots
          </Button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={clearing}
            className="inline-flex items-center justify-center gap-inline rounded-lg bg-[var(--color-danger)] px-roomy py-base text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={16} />
            {clearing ? "Clearing..." : "Clear all slots"}
          </button>
        </>
      }
    >
      <div className="flex gap-comfy">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-danger)]/10 text-[var(--color-danger)]">
          <AlertTriangle size={18} />
        </span>
        <p className="pt-tight text-sm leading-6 text-[var(--color-text-muted)]">
          This will permanently delete all {slotCount} timetable slots. You cannot undo this action.
        </p>
      </div>
    </Modal>
  );
}
