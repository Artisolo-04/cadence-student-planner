import PreviewHeader from "./PreviewHeader";
import { getViewerForKind } from "./viewers";
import useSlideTransition from "./useSlideTransition";
import { getFileMeta } from "../FolderExplorerModal";

export default function ResourcePreviewSidebar({ item, onClose }) {
  const open = Boolean(item);
  const { mounted, visible } = useSlideTransition(open, 220);

  if (!mounted) return null;

  const meta = item ? getFileMeta(item) : null;
  const Viewer = getViewerForKind(meta);

  return (
    <>
      <div
        className={`absolute inset-0 z-20 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`absolute inset-y-0 right-0 z-30 flex w-full max-w-[460px] flex-col border-l border-[var(--color-border)] bg-[var(--color-surface)] shadow-[-20px_0_60px_-20px_rgba(0,0,0,0.45)] transition-transform duration-200 ease-out will-change-transform md:max-w-[520px] ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={item ? `Preview of ${item.title}` : "Resource preview"}
      >
        {item && meta && (
          <>
            <PreviewHeader item={item} meta={meta} onClose={onClose} />
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden p-4">
              <Viewer item={item} meta={meta} />
            </div>
          </>
        )}
      </aside>
    </>
  );
}
