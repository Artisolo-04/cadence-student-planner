import { useEffect, useState } from "react";
import ExplorerHeader from "../../ExplorerHeader";
import ResourcePreviewSidebar from "../../ResourcePreviewSidebar";
import useModalTransition from "./useModalTransition";
import EmptyFolderState from "./EmptyState";
import ResourceGrid from "./ResourceGrid";

export default function FolderExplorerModal({
  folder,
  accent,
  onClose,
  onRequestDelete,
  onAddResource,
  isCustomWorkspace,
  onRenameFolder,
  existingFolderNames = [],
}) {
  const open = Boolean(folder);
  const { mounted, visible } = useModalTransition(open, onClose);
  const [previewItem, setPreviewItem] = useState(null);

  useEffect(() => {
    if (!open) setPreviewItem(null);
  }, [open]);

  if (!mounted) return null;

  const items = folder?.items || [];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`relative flex h-full w-full max-w-[1400px] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] shadow-[0_0_80px_-20px_rgba(0,0,0,0.5)] transition-all duration-200 ease-out md:h-[90vh] ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {folder && (
          <>
            <ExplorerHeader
              title={folder.title}
              accent={accent}
              onClose={onClose}
              onAddResource={onAddResource ? () => onAddResource(folder.target) : undefined}
              isCustomWorkspace={isCustomWorkspace}
              onRenameFolder={onRenameFolder}
              existingFolderNames={existingFolderNames}
            />

            <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto p-5 scrollbar-cadence">
            {items.length === 0 ? (
              <EmptyFolderState onAddResource={onAddResource} folderTarget={folder.target} />
            ) : (
              <ResourceGrid
                items={items}
                folderTitle={folder.title}
                onRequestDelete={onRequestDelete}
                onPreview={setPreviewItem}
              />
            )}
          </div>
            <ResourcePreviewSidebar
              item={previewItem}
              folderTitle={folder.title}
              onClose={() => setPreviewItem(null)}
            />
          </>
        )}
      </div>
    </div>
  );
}
