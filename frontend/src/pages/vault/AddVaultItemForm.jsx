import { useState } from "react";
import Dropdown from "../../components/ui/Dropdown";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";

export default function AddVaultItemForm({ open, subjects, onSubmit, onClose }) {
  const [destination, setDestination] = useState("subject");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [folderName, setFolderName] = useState("");
  const [resourceType, setResourceType] = useState("link");
  const [title, setTitle] = useState("");
  const [urlPath, setUrlPath] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function resetAndClose() {
    setDestination("subject");
    setFolderName("");
    setResourceType("link");
    setTitle("");
    setUrlPath("");
    setError(null);
    onClose();
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !urlPath.trim()) {
      setError("Title and URL are required.");
      return;
    }
    if (destination === "subject" && !subjectId) {
      setError("Choose a subject.");
      return;
    }
    if (destination === "folder" && !folderName.trim()) {
      setError("Folder name is required.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        subjectId: destination === "subject" ? subjectId : null,
        folderName: destination === "folder" ? folderName.trim() : null,
        resourceType,
        title: title.trim(),
        urlPath: urlPath.trim(),
      });
      resetAndClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add item");
    } finally {
      setSubmitting(false);
    }
  };

  const subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name }));
  const resourceTypeOptions = [
    { value: "link", label: "Link" },
    { value: "pdf", label: "PDF (URL to hosted file)" },
  ];

  return (
    <Modal
      open={open}
      onClose={() => !submitting && resetAndClose()}
      title="Add resource"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={resetAndClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="add-vault-item-form" disabled={submitting}>
            {submitting ? "Adding…" : "Add resource"}
          </Button>
        </>
      }
    >
      <form id="add-vault-item-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="inline-flex w-fit gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-1 text-sm">
          <button
            type="button"
            onClick={() => setDestination("subject")}
            className="rounded-full px-3 py-1.5 transition-colors"
            style={
              destination === "subject"
                ? { backgroundColor: "var(--color-primary)", color: "var(--color-primary-fg)" }
                : { color: "var(--color-text-muted)" }
            }
          >
            Subject
          </button>
          <button
            type="button"
            onClick={() => setDestination("folder")}
            className="rounded-full px-3 py-1.5 transition-colors"
            style={
              destination === "folder"
                ? { backgroundColor: "var(--color-accent)", color: "var(--color-accent-fg)" }
                : { color: "var(--color-text-muted)" }
            }
          >
            Custom folder
          </button>
        </div>

        {destination === "subject" ? (
          <Dropdown
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            options={subjectOptions}
            placeholder="No subjects available"
          />
        ) : (
          <Input
            placeholder="Folder name (existing or new)"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
          />
        )}

        <Dropdown
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
          options={resourceTypeOptions}
        />

        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />

        <Input placeholder="https://..." value={urlPath} onChange={(e) => setUrlPath(e.target.value)} />

        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
      </form>
    </Modal>
  );
}
