import Modal from "../../../../components/ui/Modal";
import Input from "../../../../components/ui/Input";
import Dropdown from "../../../../components/ui/Dropdown";
import Button from "../../../../components/ui/Button";
import DestinationField from "./DestinationField";
import FileDropzone from "./FileDropzone";
import useAddVaultItemForm from "./useAddVaultItemForm";

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
    resourceType,
    setResourceType,
    title,
    setTitle,
    urlPath,
    setUrlPath,
    submitting,
    error,

    isDragging,
    selectedFile,
    fileInputRef,

    isLocked,
    effectiveDestination,
    folderOptions,
    subjectOptions,
    resourceTypeOptions,

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

        {!selectedFile && (
          <Dropdown
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            options={resourceTypeOptions}
          />
        )}

        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />

        {!selectedFile && (
          <Input placeholder="https://..." value={urlPath} onChange={(e) => setUrlPath(e.target.value)} />
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
