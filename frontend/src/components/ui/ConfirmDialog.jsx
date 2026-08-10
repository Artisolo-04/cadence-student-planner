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
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
            <AlertTriangle size={18} className="text-amber-500" />
          </span>
          <ul className="flex flex-1 flex-col gap-1.5 pt-1.5 text-sm text-[var(--color-text-muted)]">
            {messages.map((msg, i) => (
              <li key={i} className="list-disc marker:text-amber-500/60 ml-4">
                {msg}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="bg-red-600 text-white hover:bg-red-500"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
