import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  messages = [],
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} elevated>
      <div className="flex flex-col gap-roomy">
        <div className="flex items-start gap-comfy">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-danger)]/10">
            <AlertTriangle size={18} className="text-[var(--color-danger)]" />
          </span>
          <ul className="flex flex-1 flex-col gap-snug pt-snug text-sm text-[var(--color-text-muted)]">
            {messages.map((msg, i) => (
              <li key={i} className="list-disc marker:text-[var(--color-danger)]/60 ml-roomy">
                {msg}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-end gap-inline">
          <Button type="button" variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="bg-[var(--color-danger)] text-white hover:opacity-90"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
