import { useEffect, useMemo, useState } from "react";
import { Landmark } from "lucide-react";
import Modal from "../../components/ui/Modal";
import Dropdown from "../../components/ui/Dropdown";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

const SENTINEL_TITLE = ".vault_sentinel";

export default function CreateWorkspaceForm({
  open,
  mode,
  subjects,
  existingFolderNames,
  onClose,
  onCreateItem,
  onCreated,
}) {
  const [subjectId, setSubjectId] = useState("");
  const [folderName, setFolderName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) {
      setSubjectId("");
      setFolderName("");
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  const subjectOptions = useMemo(
    () => subjects.map((s) => ({ value: s.id, label: s.name })),
    [subjects]
  );

  const noSubjectsLeft = mode === "subject" && subjectOptions.length === 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    let target;
    if (mode === "subject") {
      if (!subjectId) {
        setError("Choose a subject.");
        return;
      }
      const subject = subjects.find((s) => s.id === subjectId);
      target = { type: "subject", id: subjectId, name: subject?.name || "" };
    } else {
      const trimmed = folderName.trim();
      if (!trimmed) {
        setError("Folder name is required.");
        return;
      }
      const isDuplicate = (existingFolderNames || []).some(
        (name) => name.toLowerCase() === trimmed.toLowerCase()
      );
      if (isDuplicate) {
        setError("A folder with this name already exists.");
        return;
      }
      target = { type: "folder", id: trimmed, name: trimmed };
    }

    setSubmitting(true);
    try {
      await onCreateItem({
        subjectId: target.type === "subject" ? target.id : undefined,
        folderName: target.type === "folder" ? target.name : undefined,
        resourceType: "link",
        title: SENTINEL_TITLE,
        urlPath: "#",
      });
      onCreated(target);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create workspace");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !submitting && onClose()}
      title={mode === "subject" ? "New university track" : "New custom workspace"}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="create-workspace-form" disabled={noSubjectsLeft || submitting}>
            {submitting ? "Creating…" : "Create"}
          </Button>
        </>
      }
    >
      <form id="create-workspace-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        {mode === "subject" ? (
          noSubjectsLeft ? (
            <div className="flex items-center gap-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2.5 text-sm text-[var(--color-text-muted)]">
              <Landmark size={15} className="shrink-0" />
              All your subjects already have a workspace.
            </div>
          ) : (
            <Dropdown
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              options={subjectOptions}
              placeholder="Select a subject"
            />
          )
        ) : (
          <Input
            placeholder="Workspace name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            autoFocus
          />
        )}

        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
      </form>
    </Modal>
  );
}
