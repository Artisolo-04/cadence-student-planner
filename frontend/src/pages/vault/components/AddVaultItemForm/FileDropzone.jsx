import { UploadCloud } from "lucide-react";
import Button from "../../../../components/ui/Button";
import { ACCEPTED_EXTENSIONS } from "./constants";

export default function FileDropzone({
  isDragging,
  selectedFile,
  submitting,
  fileInputRef,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileInputChange,
  onClearSelectedFile,
}) {
  return (
    <div className="mt-4 border-t border-[var(--color-border)] pt-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
        Or attach a file to upload
      </p>
      <div
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
          isDragging
            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
            : "border-[var(--color-border)] bg-[var(--color-bg)]"
        }`}
      >
        <UploadCloud size={24} className="text-[var(--color-text-muted)]" />
        {selectedFile ? (
          <>
            <p className="text-sm text-[var(--color-text)]">{selectedFile.name}</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Ready to upload — click "Add resource" to confirm
            </p>
            <Button type="button" variant="secondary" className="mt-1" onClick={onClearSelectedFile} disabled={submitting}>
              Choose a different file
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-[var(--color-text)]">Drag a file here</p>
            <p className="text-xs text-[var(--color-text-muted)]">PDF , DOCX , XLSX , or TXT</p>
            <Button
              type="button"
              variant="secondary"
              className="mt-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={submitting}
            >
              Select file
            </Button>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(",")}
          className="hidden"
          onChange={onFileInputChange}
        />
      </div>
    </div>
  );
}
