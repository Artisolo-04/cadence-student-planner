import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import useSlideTransition from "../vault/folderExplorer/ResourcePreviewSidebar/useSlideTransition";
import useScrollFade from "../../hooks/useScrollFade";
import { BottomFade, TopFade } from "../../components/ui/ScrollFadeOverlay";
import { AccentHeaderShell, AccentIconBox, HeaderCloseButton } from "../../components/ui/AccentHeader";

function PanelScroll({ children }) {
  const { scrollRef, showTopFade, showBottomFade } = useScrollFade();
  return (
    <div className="relative min-h-0 flex-1">
      <div ref={scrollRef} className="scrollbar-cadence h-full overflow-y-auto px-5 py-4">
        {children}
      </div>
      <TopFade show={showTopFade} fromColor="var(--color-drawer)" />
      <BottomFade show={showBottomFade} fromColor="var(--color-drawer)" />
    </div>
  );
}

export default function DetailPanel({ open, title, subtitle, icon, accent, fill, onClose, children }) {
  const { mounted, visible } = useSlideTransition(open, 220);

  // Keep the last content on screen while the panel slides out.
  const lastRef = useRef({ title, subtitle, icon, accent, fill, children });
  if (open) lastRef.current = { title, subtitle, icon, accent, fill, children };
  const shown = open ? { title, subtitle, icon, accent, fill, children } : lastRef.current;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  const titleBlock = (
    <div className="min-w-0">
      <h2 className="truncate text-sm font-semibold text-[var(--color-text)]">{shown.title}</h2>
      {shown.subtitle && (
        <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">{shown.subtitle}</p>
      )}
    </div>
  );

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
        className={`drawer-elevated absolute inset-y-0 right-0 z-30 flex w-full max-w-[460px] flex-col border-l border-[var(--color-border)] bg-[var(--color-drawer)] transition-transform duration-200 ease-out will-change-transform md:max-w-[520px] ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={shown.title}
      >
        {shown.accent ? (
          <AccentHeaderShell accent={shown.accent}>
            <div className="relative z-10 flex min-w-0 flex-1 items-center gap-4">
              {shown.icon && <AccentIconBox accent={shown.accent} icon={shown.icon} />}
              {titleBlock}
            </div>
            <div className="relative z-10 flex shrink-0 items-center gap-2">
              <HeaderCloseButton onClose={onClose} ariaLabel="Close details" />
            </div>
          </AccentHeaderShell>
        ) : (
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
            {titleBlock}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close details"
              className="shrink-0 rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
            >
              <X size={18} />
            </button>
          </header>
        )}
        {shown.fill ? (
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden p-4">{shown.children}</div>
        ) : (
          <PanelScroll>{shown.children}</PanelScroll>
        )}
      </aside>
    </>
  );
}
