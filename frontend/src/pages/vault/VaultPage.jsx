import { useEffect, useMemo, useRef, useState } from "react";
import { FolderOpen, FolderPlus, Landmark, LayoutGrid, List } from "lucide-react";
import api from "../../lib/api";
import { useVaultData } from "./useVaultData";
import VaultFolderCard from "./VaultFolderCard";
import AddVaultItemForm from "./components/AddVaultItemForm";
import CreateWorkspaceForm from "./CreateWorkspaceForm";
import Button from "../../components/ui/Button";
import SegmentedControl from "../../components/ui/SegmentedControl";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import FolderExplorerModal from "./folderExplorer/FolderExplorerModal";
import { CustomScrollbar } from "../../components/ui/CustomScrollbar";
import VaultFilterBar from "./VaultFilterBar";
import { DEFAULT_VAULT_FILTERS, applyVaultFilters, isFilterActive } from "./vaultFilters";

const CONTENT_VIEWS = [
  { id: "university", label: "University Tracks", Icon: Landmark },
  { id: "custom", label: "Custom Workspaces", Icon: FolderOpen },
];

const LAYOUT_MODES = [
  { id: "grid", label: "Grid", Icon: LayoutGrid },
  { id: "list", label: "List", Icon: List },
];

export default function VaultPage() {
  const {
    bySubject,
    byFolder,
    loading,
    error,
    addItem,
    removeItem,
    removeFolder,
    removeSubjectVault,
    refetch,
    renameFolder,
  } = useVaultData();
  const [formOpen, setFormOpen] = useState(false);
  const [lockedTarget, setLockedTarget] = useState(null);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [allSubjects, setAllSubjects] = useState([]);
  const [contentView, setContentView] = useState("university");
  const [layoutMode, setLayoutMode] = useState("grid");
  const [filters, setFilters] = useState(DEFAULT_VAULT_FILTERS);
  const scrollRef = useRef(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const [openFolderKey, setOpenFolderKey] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [selectedFolder, setSelectedFolder] = useState(null);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);
  const [folderDeleteError, setFolderDeleteError] = useState(null);

  const [selectedSubjectVault, setSelectedSubjectVault] = useState(null);
  const [isDeletingSubjectVault, setIsDeletingSubjectVault] = useState(false);
  const [subjectVaultDeleteError, setSubjectVaultDeleteError] = useState(null);

  const handleConfirmDeleteSubjectVault = async () => {
    if (!selectedSubjectVault) return;
    setIsDeletingSubjectVault(true);
    setSubjectVaultDeleteError(null);
    try {
      await removeSubjectVault(selectedSubjectVault.subjectId);
      setSelectedSubjectVault(null);
    } catch (err) {
      setSubjectVaultDeleteError(err.response?.data?.error || "Failed to clear subject vault.");
    } finally {
      setIsDeletingSubjectVault(false);
    }
  };

  const handleConfirmDeleteFolder = async () => {
    if (!selectedFolder) return;
    setIsDeletingFolder(true);
    setFolderDeleteError(null);
    try {
      await removeFolder(selectedFolder.folderName);
      setSelectedFolder(null);
    } catch (err) {
      setFolderDeleteError(err.response?.data?.error || "Failed to delete folder.");
    } finally {
      setIsDeletingFolder(false);
    }
  };

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
  }, [bySubject, byFolder, filters, loading, contentView, layoutMode]);

  useEffect(() => {
    setOpenFolderKey(null);
  }, [contentView]);

  const isUniversity = contentView === "university";
  const activeGroups = isUniversity ? bySubject : byFolder;
  const visibleGroups = useMemo(() => applyVaultFilters(activeGroups, filters), [activeGroups, filters]);
  const isFiltering = isFilterActive(filters);
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
    <div className="flex h-full w-full min-h-0 flex-col gap-grid">
      <header className="flex flex-col gap-comfy sm:flex-row sm:items-center sm:justify-between sm:gap-roomy shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Vault Workspace</h2>
          <p className="mt-tight hidden text-sm text-[var(--color-text-muted)] sm:block">
            Your documents and links, organized by subject or custom folder.
          </p>
        </div>

        <div className="flex w-full flex-nowrap items-center gap-snug sm:w-auto sm:gap-comfy">
          <SegmentedControl
            ariaLabel="Content view"
            options={CONTENT_VIEWS}
            value={contentView}
            onChange={setContentView}
            variant="icon"
            size="md"
            className="sm:hidden"
          />
          <SegmentedControl
            ariaLabel="Content view"
            options={CONTENT_VIEWS}
            value={contentView}
            onChange={setContentView}
            variant="labeled"
            size="md"
            className="hidden sm:flex"
          />
          <SegmentedControl
            ariaLabel="Layout"
            options={LAYOUT_MODES}
            value={layoutMode}
            onChange={setLayoutMode}
            variant="icon"
            size="md"
          />
          <Button type="button" onClick={() => setCreateFormOpen(true)} className="h-9 flex-1 justify-center px-cozy sm:flex-none sm:px-roomy">
            <FolderPlus size={16} />
            <span className="text-xs sm:text-sm">New workspace</span>
          </Button>
        </div>
      </header>

      <VaultFilterBar value={filters} onChange={setFilters} />

      {error && (
        <div className="shrink-0 rounded-md border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-roomy py-comfy text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      <section className="relative flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-base sm:p-roomy">
        <div
          ref={scrollRef}
          onScroll={updateScrollFades}
          className="h-full min-w-0 flex-1 overflow-y-auto rounded-lg p-0 scrollbar-hidden sm:p-0"
        >
          {loading ? (
            <p className="text-sm text-[var(--color-text-muted)]">Loading vault…</p>
          ) : (
            <div className="flex flex-col gap-roomy">
              {visibleGroups.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">{isFiltering ? "No workspaces match your search or filters." : emptyMessage}</p>
              ) : layoutMode === "grid" ? (
                <div className="grid grid-cols-1 gap-grid sm:grid-cols-2 lg:grid-cols-3">
                  {visibleGroups.map((group) => (
                    <VaultFolderCard
                      key={isUniversity ? group.subjectId : group.folderName}
                      title={isUniversity ? group.subjectName : group.folderName}
                      itemCount={group.items.length}
                      items={group.items}
                      accent={activeAccent}
                      onRequestDelete={setPendingDelete}
                      onOpen={() => handleOpenFolder(group)}
                      layout="grid"
                      deletable={true}
                      onDeleteFolder={() =>
                        isUniversity
                          ? setSelectedSubjectVault({
                              subjectId: group.subjectId,
                              title: group.subjectName,
                              itemCount: group.items.length,
                            })
                          : setSelectedFolder({
                              folderName: group.folderName,
                              title: group.folderName,
                              itemCount: group.items.length,
                            })
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-inline">
                  {visibleGroups.map((group) => (
                    <VaultFolderCard
                      key={isUniversity ? group.subjectId : group.folderName}
                      title={isUniversity ? group.subjectName : group.folderName}
                      itemCount={group.items.length}
                      items={group.items}
                      accent={activeAccent}
                      onRequestDelete={setPendingDelete}
                      onOpen={() => handleOpenFolder(group)}
                      layout="list"
                      deletable={true}
                      onDeleteFolder={() =>
                        isUniversity
                          ? setSelectedSubjectVault({
                              subjectId: group.subjectId,
                              title: group.subjectName,
                              itemCount: group.items.length,
                            })
                          : setSelectedFolder({
                              folderName: group.folderName,
                              title: group.folderName,
                              itemCount: group.items.length,
                            })
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <CustomScrollbar scrollRef={scrollRef} />

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

      <ConfirmDialog
        open={!!selectedFolder}
        title="Delete this folder?"
        messages={[
          selectedFolder
            ? `"${selectedFolder.title}" and its ${selectedFolder.itemCount} resource${
                selectedFolder.itemCount === 1 ? "" : "s"
              } will be permanently removed.`
            : "",
          folderDeleteError || "This can't be undone — files are unlinked from disk and records deleted.",
        ]}
        confirmLabel={isDeletingFolder ? "Deleting…" : "Delete folder"}
        cancelLabel="Keep it"
        onConfirm={handleConfirmDeleteFolder}
        onCancel={() => !isDeletingFolder && setSelectedFolder(null)}
      />

      <ConfirmDialog
        open={!!selectedSubjectVault}
        title="Clear this subject's vault?"
        messages={[
          selectedSubjectVault
            ? `"${selectedSubjectVault.title}" has ${selectedSubjectVault.itemCount} resource${
                selectedSubjectVault.itemCount === 1 ? "" : "s"
              } that will be permanently removed.`
            : "",
          subjectVaultDeleteError ||
            "This cannot be undone. Files are unlinked from disk. GPA logs, exams, and assignments for this subject are not affected.",
        ]}
        confirmLabel={isDeletingSubjectVault ? "Clearing…" : "Clear vault"}
        cancelLabel="Keep it"
        onConfirm={handleConfirmDeleteSubjectVault}
        onCancel={() => !isDeletingSubjectVault && setSelectedSubjectVault(null)}
      />
    </div>
  );
}
