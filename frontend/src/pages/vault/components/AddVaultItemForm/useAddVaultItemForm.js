import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../../../lib/api";
import { ACCEPTED_EXTENSIONS } from "./constants";
import { getLinkBrand, deriveResourceType } from "../../resourceMeta";

export default function useAddVaultItemForm({
  subjects,
  existingFolders,
  destination,
  lockedTarget,
  onSubmit,
  onUploadComplete,
  onClose,
}) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [folderName, setFolderName] = useState("");
  const [title, setTitle] = useState("");
  const [urlPath, setUrlPath] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const dragCounter = useRef(0);
  const fileInputRef = useRef(null);

  const isLocked = Boolean(lockedTarget);
  const effectiveDestination = isLocked ? lockedTarget.type : destination;

  const isLinkMode = !selectedFile && /^https?:\/\//i.test(urlPath.trim());
  const linkBrand = useMemo(
    () => (isLinkMode ? getLinkBrand(urlPath.trim()) : null),
    [isLinkMode, urlPath]
  );

  const folderOptions = useMemo(() => {
    const unique = new Set((existingFolders || []).filter(Boolean));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [existingFolders]);

  useEffect(() => {
    if (isLocked) return;
    if (destination === "subject" && !subjectId && subjects[0]?.id) {
      setSubjectId(subjects[0].id);
    }
  }, [destination, subjects, subjectId, isLocked]);

  function resetAndClose() {
    setFolderName("");
    setTitle("");
    setUrlPath("");
    setError(null);
    setSelectedFile(null);
    dragCounter.current = 0;
    setIsDragging(false);
    onClose();
  }

  function captureFile(file) {
    if (!file) return;
    const ext = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setError("Only .pdf, .docx, .xlsx, or .txt files are allowed");
      return;
    }
    setError(null);
    setSelectedFile(file);
    setTitle(file.name);
  }

  const targetSubjectId =
    effectiveDestination === "subject" ? (isLocked ? lockedTarget.id : subjectId) : null;
  const targetFolderName =
    effectiveDestination === "folder" ? (isLocked ? lockedTarget.name : folderName.trim()) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (selectedFile) {
      if (effectiveDestination === "subject" && !targetSubjectId) {
        setError("Choose a subject.");
        return;
      }
      if (effectiveDestination === "folder" && !targetFolderName) {
        setError("Folder name is required.");
        return;
      }

      setSubmitting(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (title.trim()) {
        formData.append("title", title.trim());
      }
      if (effectiveDestination === "subject") {
        formData.append("subjectId", targetSubjectId);
      } else {
        formData.append("folderName", targetFolderName);
      }

      try {
        const { status } = await api.post("/vault/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (status === 201) {
          await onUploadComplete?.();
          resetAndClose();
        } else {
          setError("Upload did not complete. Please try again.");
        }
      } catch (err) {
        console.error("Vault modal upload error:", err);
        setError(err?.response?.data?.error || "Upload failed. Please try again.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!title.trim() || !urlPath.trim()) {
      setError("Title and URL are required.");
      return;
    }
    if (effectiveDestination === "subject" && !targetSubjectId) {
      setError("Choose a subject.");
      return;
    }
    if (effectiveDestination === "folder" && !targetFolderName) {
      setError("Folder name is required.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        subjectId: effectiveDestination === "subject" ? targetSubjectId : null,
        folderName: effectiveDestination === "folder" ? targetFolderName : null,
        resourceType: deriveResourceType(urlPath.trim()),
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

  const handleDragEnter = (e) => {
    e.preventDefault();
    if (!e.dataTransfer?.types?.includes("Files")) return;
    dragCounter.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) captureFile(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) captureFile(file);
    e.target.value = "";
  };

  function clearSelectedFile() {
    setSelectedFile(null);
    setTitle("");
  }

  const subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name }));

  return {
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
  };
}
