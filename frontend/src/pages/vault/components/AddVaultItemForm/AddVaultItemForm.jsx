import Modal from "../../../../components/ui/Modal";
import Input from "../../../../components/ui/Input";
import Button from "../../../../components/ui/Button";
import DestinationField from "./DestinationField";
import FileDropzone from "./FileDropzone";
import { FileText, Link as LinkIcon } from "lucide-react";
import useAddVaultItemForm from "./useAddVaultItemForm";

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unitIndex]}`;
}

export default function AddVaultItemForm({
  open,
  subjects,
  existingFolders,
  onSubmit,
  onUploadComplete,
  onClose,
  destination,
  lockedTarget,
}) {
  const {
    subjectId,
    setSubjectId,
    folderName,
    setFolderName,
    title,
    setTitle,
    urlPath,
    setUrlPath,
    submitting,
    error,

    isDragging,
    selectedFile,
    fileInputRef,

    isLinkMode,
    linkBrand,

    isLocked,
    effectiveDestination,
    folderOptions,
    subjectOptions,

    resetAndClose,
    handleSubmit,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
    clearSelectedFile,
  } = useAddVaultItemForm({
    subjects,
    existingFolders,
    destination,
    lockedTarget,
    onSubmit,
    onUploadComplete,
    onClose,
  });

  return (
    <Modal
      open={open}
      onClose={() => !submitting && resetAndClose()}
      elevated={isLocked}
      title={
        isLocked
          ? `Add resource · ${lockedTarget.name}`
          : destination === "subject"
          ? "Add resource · University track"
          : "Add resource · Custom workspace"
      }
      footer={
        <>
          <Button type="button" variant="secondary" onClick={resetAndClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="add-vault-item-form" disabled={submitting}>
            {submitting ? (selectedFile ? "Uploading…" : "Adding…") : "Add resource"}
          </Button>
        </>
      }
    >
      <form id="add-vault-item-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <DestinationField
          effectiveDestination={effectiveDestination}
          isLocked={isLocked}
          lockedTarget={lockedTarget}
          subjectId={subjectId}
          setSubjectId={setSubjectId}
          subjectOptions={subjectOptions}
          folderName={folderName}
          setFolderName={setFolderName}
          folderOptions={folderOptions}
        />

        {selectedFile ? (
          <div className="flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
            <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{selectedFile.name}</span>
            <span className="ml-auto shrink-0 tabular-nums">{formatFileSize(selectedFile.size)}</span>
          </div>
        ) : (
          <>
            <div className="relative">
              <Input
                placeholder="Paste a link, or drop a file below"
                value={urlPath}
                onChange={(e) => setUrlPath(e.target.value)}
                className={isLinkMode ? "pr-24" : undefined}
              />
              {isLinkMode && (
                <span
                  className="pointer-events-none absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide"
                  style={{
                    borderColor: `color-mix(in srgb, var(${linkBrand?.accentVar || "--color-primary"}) 45%, transparent)`,
                    color: `var(${linkBrand?.accentVar || "--color-primary"})`,
                    backgroundColor: `color-mix(in srgb, var(${linkBrand?.accentVar || "--color-primary"}) 10%, transparent)`,
                  }}
                >
                  {linkBrand ? <linkBrand.Icon size={11} /> : <LinkIcon size={11} />}
                  {linkBrand ? linkBrand.badge : "LINK"}
                </span>
              )}
            </div>

            {isLinkMode && (
              <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            )}
          </>
        )}

        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
      </form>

      <FileDropzone
        isDragging={isDragging}
        selectedFile={selectedFile}
        submitting={submitting}
        fileInputRef={fileInputRef}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onFileInputChange={handleFileInputChange}
        onClearSelectedFile={clearSelectedFile}
      />
    </Modal>
  );
}
