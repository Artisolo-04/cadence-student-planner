import { Folder, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Button from "../../../components/ui/Button";

export default function ExplorerHeader({
  title,
  accent,
  onClose,
  onAddResource,
  isCustomWorkspace,
  onRenameFolder,
  existingFolderNames = [],
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const [flash, setFlash] = useState(false);
  const [duplicateName, setDuplicateName] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setDraftTitle(title);
  }, [title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!flash) return;
    const timeout = setTimeout(() => setFlash(false), 320);
    return () => clearTimeout(timeout);
  }, [flash]);

  const handleChange = (e) => {
    setDraftTitle(e.target.value);
    if (duplicateName) setDuplicateName(null);
  };

  const commitRename = () => {
    const trimmed = draftTitle.trim();

    if (!trimmed || trimmed === title) {
      setDraftTitle(title);
      setDuplicateName(null);
      setIsEditing(false);
      return;
    }

    const isDuplicate = existingFolderNames.some(
      (name) => name.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      setFlash(true);
      setDuplicateName(trimmed);
      inputRef.current?.focus();
      return;
    }

    setDuplicateName(null);
    setIsEditing(false);
    onRenameFolder?.(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setDraftTitle(title);
      setFlash(false);
      setDuplicateName(null);
      setIsEditing(false);
    }
  };

  return (
    <div className="relative z-10 flex shrink-0 items-center justify-between gap-4 overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-25 blur-3xl"
        style={{ backgroundColor: accent }}
      />

      <div className="relative z-10 flex min-w-0 items-center gap-4">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)]"
          style={{
            backgroundImage: `linear-gradient(155deg, color-mix(in srgb, ${accent} 40%, black 20%) 0%, color-mix(in srgb, ${accent} 15%, black 45%) 100%)`,
          }}
        >
          <Folder size={18} style={{ color: accent }} />
        </span>

        <div className="relative flex min-w-0 flex-1 items-center gap-4">
          {isCustomWorkspace && isEditing ? (
            <input
                ref={inputRef}
                type="text"
                value={draftTitle}
                onChange={handleChange}
                onBlur={commitRename}
                onKeyDown={handleKeyDown}
                aria-label="Rename workspace"
                aria-invalid={Boolean(duplicateName)}
                title={draftTitle}
                className={`-mx-2 -my-1 w-full truncate rounded-md bg-[var(--color-surface-alt)] px-2 py-1 text-sm font-semibold text-[var(--color-text)] outline-none ring-1 transition-shadow duration-150 ${
                  duplicateName
                    ? "ring-[var(--color-danger)]"
                    : "ring-[var(--color-border)] focus:ring-[var(--color-ring)]"
                }${flash ? " animate-cadence-flash" : ""}`}
              />
          ) : (
            <h3
              onClick={() => isCustomWorkspace && setIsEditing(true)}
              title={title}
              className={`min-w-0 max-w-[28rem] flex-1 truncate text-sm font-semibold text-[var(--color-text)]${
                isCustomWorkspace ? " cursor-text hover:text-[var(--color-primary)]" : ""
              }`}
            >
              {title}
            </h3>
          )}

          {duplicateName && (
            <span
              role="alert"
              className="shrink-0 whitespace-nowrap text-xs font-medium text-[var(--color-danger)] px-1"
            >
              A folder named [ {duplicateName} ] already exists
            </span>
          )}
        </div>
      </div>

      <div className="relative z-10 flex shrink-0 items-center gap-2">
        {onAddResource && (
          <Button
            variant="secondary"
            onClick={onAddResource}
            className="gap-1.5 px-3 py-2 text-xs"
          >
            <Plus size={14} />
            Add resource
          </Button>
        )}

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-text)_8%,transparent)] hover:text-[var(--color-text)]"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
