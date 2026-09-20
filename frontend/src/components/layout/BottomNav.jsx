import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import { navItems } from "../../lib/navigation";

const PRIMARY_COUNT = 4;

function NavItemLink({ item, onClick }) {
  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={({ isActive }) =>
        `flex flex-col items-center gap-tight px-comfy py-tight rounded-lg text-[11px] font-medium transition-colors duration-150 ${
          isActive ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"
        }`
      }
    >
      <item.icon size={20} strokeWidth={2} />
      <span>{item.label}</span>
    </NavLink>
  );
}

function MoreSheet({ items, open, onClose }) {
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
      const t = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(t);
    }
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <div className="md:hidden fixed inset-0 z-30">
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        role="menu"
        className={`absolute bottom-0 left-0 right-0 rounded-t-2xl border-t border-[var(--color-border)]
          bg-[var(--color-surface)] shadow-lg p-roomy
          pb-[calc(env(safe-area-inset-bottom)+1rem)]
          transition-transform duration-200 ease-out
          ${visible ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="mx-auto mb-comfy h-1 w-10 rounded-full bg-[var(--color-border)]" />
        <p className="mb-comfy text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
          More
        </p>
        <div className="grid grid-cols-4 gap-inline">
          {items.map((item) => (
            <NavItemLink key={item.path} item={item} onClick={onClose} />
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function BottomNav() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSheetOpen(false);
  }, [location.pathname]);

  const needsOverflow = navItems.length > PRIMARY_COUNT + 1;
  const primaryItems = needsOverflow ? navItems.slice(0, PRIMARY_COUNT) : navItems;
  const overflowItems = needsOverflow ? navItems.slice(PRIMARY_COUNT) : [];
  const overflowActive = overflowItems.some((item) => item.path === location.pathname);

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around
          border-t border-[var(--color-border)] bg-[var(--color-surface)]
          px-base pt-base pb-[calc(env(safe-area-inset-bottom)+0.5rem)]"
      >
        {primaryItems.map((item) => (
          <NavItemLink key={item.path} item={item} />
        ))}

        {needsOverflow && (
          <button
            type="button"
            onClick={() => setSheetOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={sheetOpen}
            className={`flex flex-col items-center gap-tight px-comfy py-tight rounded-lg text-[11px] font-medium transition-colors duration-150 ${
              overflowActive || sheetOpen
                ? "text-[var(--color-primary)]"
                : "text-[var(--color-text-muted)]"
            }`}
          >
            <MoreHorizontal size={20} strokeWidth={2} />
            <span>More</span>
          </button>
        )}
      </nav>

      {needsOverflow && (
        <MoreSheet items={overflowItems} open={sheetOpen} onClose={() => setSheetOpen(false)} />
      )}
    </>
  );
}
