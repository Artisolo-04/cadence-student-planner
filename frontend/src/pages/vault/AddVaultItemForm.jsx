import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Folder, FolderPlus, Landmark, Lock, Search, UploadCloud } from "lucide-react";
import api from "../../lib/api";
import Dropdown from "../../components/ui/Dropdown";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".xlsx", ".txt"];
const ITEM_HEIGHT = 36;
const LIST_PADDING = 8;
const VISIBLE_ITEMS = 5;

function stripExtension(filename) {
  const lastDot = filename.lastIndexOf(".");
  return lastDot > 0 ? filename.slice(0, lastDot) : filename;
}

function LockedDestination({ icon: Icon, label, name }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] text-[var(--color-primary)]">
        <Icon size={14} />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-[var(--color-text)]">{name}</span>
        <span className="text-[11px] text-[var(--color-text-muted)]">{label}</span>
      </div>
      <Lock size={13} className="ml-auto shrink-0 text-[var(--color-text-muted)]" />
    </div>
  );
}

function FolderCombobox({ value, onChange, options }) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUp: false });

  const wrapperRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((name) => name.toLowerCase().includes(q));
  }, [query, options]);

  const exactMatch = options.some((name) => name.toLowerCase() === query.trim().toLowerCase());
  const showCreateOption = query.trim().length > 0 && !exactMatch;
  const rowCount = filtered.length + (showCreateOption ? 1 : 0);

  useEffect(() => {
    let raf1, raf2;
    if (open) {
      setMounted(true);
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const timeout = setTimeout(() => setMounted(false), 150);
      return () => clearTimeout(timeout);
    }
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;

    function updatePosition() {
      const trigger = wrapperRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const effectiveHeight =
        rowCount > VISIBLE_ITEMS ? VISIBLE_ITEMS * ITEM_HEIGHT + LIST_PADDING : rowCount * ITEM_HEIGHT + LIST_PADDING;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < effectiveHeight + 12 && rect.top > effectiveHeight + 12;

      setCoords({
        top: openUp ? rect.top - effectiveHeight - 8 : rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        openUp,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [open, rowCount]);

  useEffect(() => {
    if (!open) return;
    function onScroll(e) {
      if (listRef.current && listRef.current.contains(e.target)) return;
      setOpen(false);
    }
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open]);

  useEffect(() => {
    function onClickOutside(e) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target) &&
        listRef.current &&
        !listRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function selectFolder(name) {
    onChange(name);
    setQuery(name);
    setOpen(false);
  }

  const listHeight = rowCount > VISIBLE_ITEMS ? VISIBLE_ITEMS * ITEM_HEIGHT + LIST_PADDING : undefined;

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
        />
        <input
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          placeholder="Search or create a folder…"
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-9 pr-3 text-sm text-[var(--color-text)]
            placeholder:text-[var(--color-text-muted)] transition-shadow duration-150
            focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)] focus-visible:border-[var(--color-ring)]"
        />
      </div>

      {mounted &&
        createPortal(
          <ul
            ref={listRef}
            role="listbox"
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: coords.width,
              maxHeight: listHeight,
            }}
            className={`z-[100] overflow-y-auto scrollbar-cadence p-1
              rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg
              transition-all duration-150 ease-out
              ${coords.openUp ? "origin-bottom" : "origin-top"}
              ${
                visible
                  ? "opacity-100 scale-100 translate-y-0"
                  : `opacity-0 scale-95 ${coords.openUp ? "translate-y-1" : "-translate-y-1"}`
              }`}
          >
            {showCreateOption && (
              <li className="mb-1 border-b border-[var(--color-border)] pb-1">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectFolder(query.trim())}
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm font-medium
                    text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/10"
                >
                  <FolderPlus size={16} className="shrink-0" />
                  <span className="shrink-0">Create folder</span>
                  <span
                    className="ml-auto flex max-w-[55%] items-center justify-center truncate rounded-md px-2.5 py-1 text-xs font-semibold leading-none"
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--color-primary) 16%, transparent)",
                      color: "var(--color-primary)",
                    }}
                  >
                    {query.trim()}
                  </span>
                </button>
              </li>
            )}

            {filtered.length === 0 && !showCreateOption && (
              <li className="px-3 py-2 text-sm text-[var(--color-text-muted)]">
                Start typing to create a folder
              </li>
            )}

            {filtered.map((name) => {
              const isSelected = name === value;
              return (
                <li key={name}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectFolder(name)}
                    className={`flex w-full items-center justify-between gap-2 rounded-sm px-3 py-2 text-left text-sm
                      transition-colors hover:bg-[var(--color-surface-alt)]
                      ${isSelected ? "font-medium text-[var(--color-primary)]" : "text-[var(--color-text)]"}`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Folder size={15} className="shrink-0 text-[var(--color-text-muted)]" />
                      <span className="truncate">{name}</span>
                    </span>
                    {isSelected && <Check size={16} className="shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </div>
  );
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
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [folderName, setFolderName] = useState("");
  const [resourceType, setResourceType] = useState("link");
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
    setResourceType("link");
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
    setError(null);
    setSelectedFile(file);
    setTitle((prev) => (prev.trim() ? prev : stripExtension(file.name)));
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
        setError(err?.response?.data?.message || "Upload failed. Please try again.");
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
  }

  const subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name }));
  const resourceTypeOptions = [
    { value: "link", label: "Link" },
    { value: "pdf", label: "PDF (URL to hosted file)" },
  ];

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
        {effectiveDestination === "subject" ? (
          isLocked ? (
            <LockedDestination icon={Landmark} label="University track" name={lockedTarget.name} />
          ) : (
            <Dropdown
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              options={subjectOptions}
              placeholder="No subjects available"
            />
          )
        ) : isLocked ? (
          <LockedDestination icon={Folder} label="Custom workspace" name={lockedTarget.name} />
        ) : (
          <FolderCombobox value={folderName} onChange={setFolderName} options={folderOptions} />
        )}

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

      <div className="mt-4 border-t border-[var(--color-border)] pt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
          Or attach a file to upload
        </p>
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
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
              <Button type="button" variant="secondary" className="mt-1" onClick={clearSelectedFile} disabled={submitting}>
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
            onChange={handleFileInputChange}
          />
        </div>
      </div>
    </Modal>
  );
}
