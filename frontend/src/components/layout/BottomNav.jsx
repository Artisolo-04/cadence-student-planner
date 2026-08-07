import { NavLink } from "react-router-dom";
import { navItems } from "../../lib/navigation";

export default function BottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around
        border-t border-[var(--color-border)] bg-[var(--color-surface)]
        px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]"
    >
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-medium transition-colors duration-150 ${
              isActive
                ? "text-[var(--color-primary)]"
                : "text-[var(--color-text-muted)]"
            }`
          }
        >
          <item.icon size={20} strokeWidth={2} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
