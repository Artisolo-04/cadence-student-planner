import { useEffect, useRef, useState } from "react";
import { FolderOpen, FolderPlus, Landmark, LayoutGrid, List } from "lucide-react";
import api from "../../lib/api";
import { useVaultData } from "./useVaultData";
import VaultFolderCard from "./VaultFolderCard";
import AddVaultItemForm from "./AddVaultItemForm";
import CreateWorkspaceForm from "./CreateWorkspaceForm";
import Button from "../../components/ui/Button";
import SegmentedControl from "../../components/ui/SegmentedControl";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import FolderExplorerModal from "./folderExplorer/FolderExplorerModal";

const CONTENT_VIEWS = [
  { id: "university", label: "University Tracks", Icon: Landmark },
  { id: "custom", label: "Custom Workspaces", Icon: FolderOpen },
];

const LAYOUT_MODES = [
  { id: "grid", label: "Grid", Icon: LayoutGrid },
  { id: "list", label: "List", Icon: List },
];

export default function VaultPage() {
  const { bySubject, byFolder, loading, error, addItem, removeItem, refetch, renameFolder } = useVaultData();
  const [formOpen, setFormOpen] = useState(false);
  const [lockedTarget, setLockedTarget] = useState(null);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [allSubjects, setAllSubjects] = useState([]);
  const [contentView, setContentView] = useState("university");
  const [layoutMode, setLayoutMode] = useState("grid");
  const scrollRef = useRef(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const [openFolderKey, setOpenFolderKey] = useState(null);
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

  useEffect(() => {
    setOpenFolderKey(null);
  }, [contentView]);

  const isUniversity = contentView === "university";
  const activeGroups = isUniversity ? bySubject : byFolder;
  const activeAccent = "var(--color-primary)";
  const emptyMessage = isUniversity
    ? "No subject-linked resources yet. Click \"New workspace\" to start one."
    : "No custom folders yet. Click \"New workspace\" to create one.";

  const availableSubjectsForCreate = allSubjects.filter(
    (s) => !bySubject.some((g) => g.subjectId === s.id)
  );
  const existingFolderNamesForCreate = byFolder.map((f) => f.folderName);

  function openAddResourceForm(target) {
    setLockedTarget(target || null);
    setFormOpen(true);
  }

  function handleWorkspaceCreated(target) {
    setCreateFormOpen(false);
    setOpenFolderKey({
      isUniversity: target.type === "subject",
      key: target.type === "subject" ? target.id : target.name,
    });
  }

  const handleOpenFolder = (group) => {
    setOpenFolderKey({
      isUniversity,
      key: isUniversity ? group.subjectId : group.folderName,
    });
  };

  const rawOpenFolder = openFolderKey
    ? activeGroups.find((g) =>
        openFolderKey.isUniversity ? g.subjectId === openFolderKey.key : g.folderName === openFolderKey.key
      ) || null
    : null;

  const openFolder = rawOpenFolder
    ? {
        ...rawOpenFolder,
        title: openFolderKey.isUniversity ? rawOpenFolder.subjectName : rawOpenFolder.folderName,
        target: openFolderKey.isUniversity
          ? { type: "subject", id: rawOpenFolder.subjectId, name: rawOpenFolder.subjectName }
          : { type: "folder", id: rawOpenFolder.folderName, name: rawOpenFolder.folderName },
      }
    : null;

  const handleRenameFolder = (newTitle) => {
    if (!openFolder || openFolder.target.type !== "folder") return;
    const trimmed = newTitle.trim();
    if (!trimmed || trimmed === openFolder.title) return;
    const oldTitle = openFolder.target.id;
    const itemIds = openFolder.items.map((item) => item.id);
    renameFolder(oldTitle, trimmed, itemIds).catch((err) => {
      console.error("Rename folder failed:", err);
    });
    setOpenFolderKey({ isUniversity: false, key: trimmed });
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl min-h-0 flex-col gap-5">
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

          <Button type="button" onClick={() => setCreateFormOpen(true)} className="h-9 shrink-0">
            <FolderPlus size={16} />
            New workspace
          </Button>
        </div>
      </header>

      {error && (
        <div className="shrink-0 rounded-md border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
          {error}
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
                      onOpen={() => handleOpenFolder(group)}
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
                      onOpen={() => handleOpenFolder(group)}
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

      <CreateWorkspaceForm
        open={createFormOpen}
        mode={isUniversity ? "subject" : "folder"}
        subjects={availableSubjectsForCreate}
        existingFolderNames={existingFolderNamesForCreate}
        onClose={() => setCreateFormOpen(false)}
        onCreateItem={addItem}
        onCreated={handleWorkspaceCreated}
      />

      <AddVaultItemForm
        open={formOpen}
        subjects={allSubjects}
        existingFolders={existingFolderNamesForCreate}
        onSubmit={addItem}
        onUploadComplete={refetch}
        onClose={() => {
          setFormOpen(false);
          setLockedTarget(null);
        }}
        destination={isUniversity ? "subject" : "folder"}
        lockedTarget={lockedTarget}
      />

      <FolderExplorerModal
        folder={openFolder}
        accent={activeAccent}
        onClose={() => setOpenFolderKey(null)}
        onRequestDelete={setPendingDelete}
        onAddResource={openAddResourceForm}
        isCustomWorkspace={openFolder?.target?.type === "folder"}
        onRenameFolder={handleRenameFolder}
        existingFolderNames={existingFolderNamesForCreate}
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
    </div>
  );
}
