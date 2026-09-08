import { useEffect, useState } from "react";
import ExplorerHeader from "./ExplorerHeader";

export default function FolderExplorerModal({ folder, accent, onClose }) {
  const open = Boolean(folder);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf1, raf2;
    if (open) {
      setMounted(true);
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const timeout = setTimeout(() => setMounted(false), 220);
      return () => clearTimeout(timeout);
    }
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

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
            <ExplorerHeader title={folder.title} accent={accent} onClose={onClose} />

            <div className="relative z-10 flex min-h-0 flex-1 flex-col p-5">
              <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_3%,var(--color-surface))]">
                <p className="text-sm text-[var(--color-text-muted)]">
                  This is a folder: {folder.title}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
