import { useEffect, useRef, useState } from "react";
import ExplorerHeader from "../../ExplorerHeader";
import ResourcePreviewSidebar from "../../ResourcePreviewSidebar";
import useModalTransition from "./useModalTransition";
import EmptyFolderState from "./EmptyState";
import ResourceGrid from "./ResourceGrid";
import { CustomScrollbar } from "../../../../../components/ui/CustomScrollbar";

const PANEL_TINT = "color-mix(in srgb, var(--color-surface) 92%, transparent)";

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
  const scrollRef = useRef(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const items = folder?.items || [];

  function updateScrollFades() {
    const element = scrollRef.current;
    if (!element) return;

    setShowTopFade(element.scrollTop > 4);
    setShowBottomFade(
      element.scrollTop + element.clientHeight < element.scrollHeight - 4
    );
  }

  useEffect(() => {
    if (!open) setPreviewItem(null);
  }, [open]);

  useEffect(() => {
    const frame = requestAnimationFrame(updateScrollFades);
    window.addEventListener("resize", updateScrollFades);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScrollFades);
    };
  }, [items]);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center md:p-wide">
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`relative flex h-full w-full max-w-[1400px] flex-col overflow-hidden bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] shadow-[0_0_80px_-20px_rgba(0,0,0,0.5)] transition-all duration-200 ease-out md:rounded-2xl md:border md:border-[var(--color-border)] md:h-[90vh] ${
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

            <div className="relative z-10 flex min-h-0 flex-1 p-plush">
              <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl">
                <div
                  ref={scrollRef}
                  onScroll={updateScrollFades}
                  className="flex min-w-0 flex-1 flex-col overflow-y-auto scrollbar-hidden"
                >
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

                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 z-10 h-14 transition-opacity duration-300 ease-out"
                  style={{
                    opacity: showTopFade ? 1 : 0,
                    backgroundImage: `linear-gradient(to bottom, ${PANEL_TINT} 0%, color-mix(in srgb, var(--color-surface) 55%, transparent) 45%, transparent 100%)`,
                  }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px transition-opacity duration-300 ease-out"
                  style={{
                    opacity: showTopFade ? 1 : 0,
                    backgroundImage:
                      "linear-gradient(to right, transparent, var(--color-border) 15%, var(--color-border) 85%, transparent)",
                  }}
                />

                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 transition-opacity duration-300 ease-out"
                  style={{
                    opacity: showBottomFade ? 1 : 0,
                    backgroundImage: `linear-gradient(to top, ${PANEL_TINT} 0%, color-mix(in srgb, var(--color-surface) 55%, transparent) 45%, transparent 100%)`,
                  }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px transition-opacity duration-300 ease-out"
                  style={{
                    opacity: showBottomFade ? 1 : 0,
                    backgroundImage:
                      "linear-gradient(to right, transparent, var(--color-border) 15%, var(--color-border) 85%, transparent)",
                  }}
                />
              </div>
              <CustomScrollbar scrollRef={scrollRef} />
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
