import { AlertTriangle, Trash2 } from "lucide-react";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";

export default function DeleteHomeworkModal({ item, deleting, error, onCancel, onConfirm }) {
  return (
    <Modal
      open={Boolean(item)}
      onClose={() => !deleting && onCancel()}
      title="Delete homework?"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={deleting}>
            Keep it
          </Button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-danger)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={16} />
            {deleting ? "Deleting..." : "Delete homework"}
          </button>
        </>
      }
    >
      <div className="flex gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-danger)]/10 text-[var(--color-danger)]">
          <AlertTriangle size={18} />
        </span>
        <div>
          <p className="text-sm leading-6 text-[var(--color-text-muted)]">
            Delete <strong className="font-semibold text-[var(--color-text)]">{item?.title}</strong>?
          </p>
          {error && <p className="mt-3 text-sm text-[var(--color-danger)]">{error}</p>}
        </div>
      </div>
    </Modal>
  );
}
