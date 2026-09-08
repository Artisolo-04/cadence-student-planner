import { useCallback, useEffect, useRef, useState } from "react";
import { FolderOpen, Landmark, LayoutGrid, List, Plus, UploadCloud } from "lucide-react";
import api from "../../lib/api";
import { useVaultData } from "./useVaultData";
import VaultFolderCard from "./VaultFolderCard";
import AddVaultItemForm from "./AddVaultItemForm";
import Button from "../../components/ui/Button";
import SegmentedControl from "../../components/ui/SegmentedControl";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

const CONTENT_VIEWS = [
  { id: "university", label: "University Tracks", Icon: Landmark },
  { id: "custom", label: "Custom Workspaces", Icon: FolderOpen },
];

const LAYOUT_MODES = [
  { id: "grid", label: "Grid", Icon: LayoutGrid },
  { id: "list", label: "List", Icon: List },
];

export default function VaultPage() {
  const { bySubject, byFolder, loading, error, addItem, removeItem, refetch } = useVaultData();
  const [formOpen, setFormOpen] = useState(false);
  const [allSubjects, setAllSubjects] = useState([]);
  const [contentView, setContentView] = useState("university");
  const [layoutMode, setLayoutMode] = useState("grid");
  const scrollRef = useRef(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const dragCounter = useRef(0);

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await removeItem(pendingDelete.id);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    api
      .get("/subjects")
      .then(({ data }) => {
        if (!cancelled) setAllSubjects(data.subjects || []);
      })
      .catch((err) => {
        console.error("Load subjects for vault error:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function updateScrollFades() {
    const element = scrollRef.current;
    if (!element) return;
    setShowTopFade(element.scrollTop > 4);
    setShowBottomFade(element.scrollTop + element.clientHeight < element.scrollHeight - 4);
  }

  useEffect(() => {
    const frame = requestAnimationFrame(updateScrollFades);
    window.addEventListener("resize", updateScrollFades);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScrollFades);
    };
  }, [bySubject, byFolder, loading, contentView, layoutMode]);

  const isUniversity = contentView === "university";
  const activeGroups = isUniversity ? bySubject : byFolder;
  const activeAccent = isUniversity ? "var(--color-primary)" : "var(--color-accent)";
  const emptyMessage = isUniversity
    ? "No subject-linked resources yet."
    : "No custom folders yet. Add a resource above and choose \"Custom folder\" to create one.";

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    if (!e.dataTransfer?.types?.includes("Files")) return;
    dragCounter.current += 1;
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (!file) return;

      setUploadError(null);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const { status } = await api.post("/vault/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (status === 201) {
          await refetch();
        } else {
          setUploadError("Upload did not complete. Please try again.");
        }
      } catch (err) {
        console.error("Vault drag-drop upload error:", err);
        setUploadError(err?.response?.data?.message || "Upload failed. Please try again.");
      }
    },
    [refetch]
  );

  return (
    <div
      className="mx-auto flex h-full w-full max-w-6xl min-h-0 flex-col gap-5"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <header className="flex shrink-0 items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Vault Workspace</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Your documents and links, organized by subject or custom folder.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <SegmentedControl
            ariaLabel="Content view"
            options={CONTENT_VIEWS}
            value={contentView}
            onChange={setContentView}
            variant="labeled"
            size="md"
          />

          <SegmentedControl
            ariaLabel="Layout"
            options={LAYOUT_MODES}
            value={layoutMode}
            onChange={setLayoutMode}
            variant="icon"
            size="md"
          />

          <Button type="button" onClick={() => setFormOpen(true)} className="h-9 shrink-0">
            <Plus size={16} />
            Add resource
          </Button>
        </div>
      </header>

      {(error || uploadError) && (
        <div className="shrink-0 rounded-md border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
          {uploadError || error}
        </div>
      )}

      <section className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
        <div
          ref={scrollRef}
          onScroll={updateScrollFades}
          className="h-full overflow-y-auto rounded-xl p-3 pr-4 scrollbar-cadence sm:p-5 sm:pr-6"
        >
          {loading ? (
            <p className="text-sm text-[var(--color-text-muted)]">Loading vault…</p>
          ) : (
            <div className="flex flex-col gap-4">
              {activeGroups.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">{emptyMessage}</p>
              ) : layoutMode === "grid" ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {activeGroups.map((group) => (
                    <VaultFolderCard
                      key={isUniversity ? group.subjectId : group.folderName}
                      title={isUniversity ? group.subjectName : group.folderName}
                      itemCount={group.items.length}
                      items={group.items}
                      accent={activeAccent}
                      onRequestDelete={setPendingDelete}
                      layout="grid"
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {activeGroups.map((group) => (
                    <VaultFolderCard
                      key={isUniversity ? group.subjectId : group.folderName}
                      title={isUniversity ? group.subjectName : group.folderName}
                      itemCount={group.items.length}
                      items={group.items}
                      accent={activeAccent}
                      onRequestDelete={setPendingDelete}
                      layout="list"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-2 top-2 z-10 h-12 bg-gradient-to-b from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${
            showTopFade ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-2 bottom-2 z-10 h-16 bg-gradient-to-t from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${
            showBottomFade ? "opacity-100" : "opacity-0"
          }`}
        />
      </section>

      <AddVaultItemForm
        open={formOpen}
        subjects={allSubjects}
        onSubmit={addItem}
        onClose={() => setFormOpen(false)}
        destination={isUniversity ? "subject" : "folder"}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this file?"
        messages={[
          pendingDelete ? `"${pendingDelete.title}" will be removed from ${pendingDelete.folderTitle}.` : "",
          "This can't be undone — the hosted file or link record is permanently wiped from disk.",
        ]}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        cancelLabel="Keep it"
        onConfirm={handleConfirmDelete}
        onCancel={() => !deleting && setPendingDelete(null)}
      />

      {isDragging && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm transition-opacity duration-150"
          style={{ backgroundColor: "color-mix(in srgb, var(--color-bg) 78%, transparent)" }}
        >
          <div
            className="pointer-events-none flex w-full max-w-xl flex-col items-center gap-4 rounded-3xl border-2 border-dashed px-10 py-14 text-center shadow-2xl"
            style={{
              borderColor: "var(--color-primary)",
              backgroundColor: "var(--color-surface)",
            }}
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-primary) 14%, transparent)",
                color: "var(--color-primary)",
              }}
            >
              <UploadCloud size={28} strokeWidth={2} />
            </div>
            <div>
              <p className="text-base font-semibold text-[var(--color-text)]">
                Drop file to upload
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                It'll land in Custom Workspaces instantly
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
