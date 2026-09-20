import { useEffect, useRef, useState } from "react";
import { Info, Undo2, X } from "lucide-react";

const TRANSITION_MS = 220;

export default function ActionNoticeBanner({ notice, onUndo, onDismiss }) {
  const [rendered, setRendered] = useState(null);
  const [open, setOpen] = useState(false);
  const hideTimeoutRef = useRef(null);

  useEffect(() => {
    if (notice) {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      setRendered(notice);

      const raf = requestAnimationFrame(() => setOpen(true));
      return () => cancelAnimationFrame(raf);
    }

    setOpen(false);
    hideTimeoutRef.current = setTimeout(() => {
      setRendered(null);
      hideTimeoutRef.current = null;
    }, TRANSITION_MS);
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [notice]);

  if (!rendered) return null;

  return (
    <div
      className="grid transition-[grid-template-rows] duration-200 ease-out"
      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
    >
      <div className="overflow-hidden">
        <div
          className={`flex items-start justify-between gap-comfy border-b border-[var(--color-warning)]/25 bg-[var(--color-warning)]/[0.08] px-roomy py-cozy text-sm transition-all duration-200 ease-out ${
            open ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
          }`}
        >
          <div className="flex items-start gap-cozy">
            <span className="mt-hair flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-warning)]/15 text-[var(--color-warning)]">
              <Info size={12} strokeWidth={2.5} />
            </span>
            <div className="flex flex-col gap-hair pt-hair">
              <span className="font-semibold text-[var(--color-text)]">{rendered.title}</span>
              {rendered.warnings?.length > 0 && (
                <ul className="flex flex-col gap-hair">
                  {rendered.warnings.map((msg, i) => (
                    <li
                      key={i}
                      className="ml-roomy list-disc text-[var(--color-text-muted)] marker:text-[var(--color-warning)]/60"
                    >
                      {msg}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-snug pt-hair">
            <button
              type="button"
              onClick={onUndo}
              className="inline-flex items-center gap-snug rounded-md border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-cozy py-tight text-xs font-semibold text-[var(--color-warning)] transition-colors duration-150 hover:bg-[var(--color-warning)]/20 focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]"
            >
              <Undo2 size={12} strokeWidth={2.5} />
              Undo
            </button>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss"
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[var(--color-warning)]/70 transition-colors duration-150 hover:bg-[var(--color-warning)]/15 hover:text-[var(--color-warning)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]"
            >
              <X size={13} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
