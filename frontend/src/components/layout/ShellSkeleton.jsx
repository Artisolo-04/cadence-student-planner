import { useLocation } from "react-router-dom";
import { ChevronLeft, MoreHorizontal } from "lucide-react";
import ThemeToggle from "../ui/ThemeToggle";
import { navItems } from "../../lib/navigation";
import { useSidebar } from "../../hooks/useSidebar";

const PRIMARY_COUNT = 4;

// Skeleton twin of ProtectedLayout: same wrappers, real brand, real nav labels.
export default function ShellSkeleton() {
  const { collapsed } = useSidebar();
  const { pathname } = useLocation();

  const primaryItems = navItems.slice(0, PRIMARY_COUNT);

  return (
    <div
      role="status"
      aria-busy="true"
      className="flex h-dvh flex-col overflow-hidden bg-[var(--color-bg)]"
    >
      <span className="sr-only">Loading Cadence</span>

      <header className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-chrome-border)] bg-[var(--color-chrome)]">
        <span className="text-lg font-semibold text-[var(--color-primary)]">Cadence</span>
        <div className="flex items-center gap-2 md:gap-3">
          <ThemeToggle />
          <span aria-hidden="true" className="sk h-9 w-9 shrink-0 rounded-md" />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside
          className={`shrink-0 border-r border-[var(--color-chrome-border)] bg-[var(--color-chrome)] p-2 hidden md:flex md:flex-col justify-between ${
            collapsed ? "w-14 px-2" : "w-52 px-2"
          }`}
        >
          <div className="flex flex-col">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const active = item.path === pathname;
                return (
                  <div
                    key={item.path}
                    className={`flex items-center py-1.5 rounded-lg text-[13px] font-medium w-full ${
                      collapsed ? "justify-center px-0" : "px-2"
                    } ${
                      active
                        ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "text-[var(--color-text-muted)]"
                    }`}
                  >
                    <span className="flex items-center justify-center w-7 h-7 shrink-0">
                      <item.icon size={16} strokeWidth={2} />
                    </span>
                    {!collapsed && <span className="ml-2 whitespace-nowrap">{item.label}</span>}
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="pt-2 border-t border-[var(--color-chrome-border)]">
            <div className="mb-2" aria-hidden="true">
              <div className="sk h-[42px] w-full rounded-lg border border-white/10" />
            </div>
            <div
              className={`flex items-center w-full py-1.5 rounded-lg text-[13px] font-medium text-[var(--color-text-muted)] ${
                collapsed ? "justify-center px-0" : "px-2"
              }`}
            >
              <span className="flex items-center justify-center w-7 h-7 shrink-0">
                <ChevronLeft size={16} strokeWidth={2} className={collapsed ? "rotate-180" : ""} />
              </span>
              {!collapsed && <span className="ml-2 whitespace-nowrap">Collapse</span>}
            </div>
          </div>
        </aside>

        <main className="relative min-h-0 min-w-0 flex-1 overflow-y-auto p-4 pb-24 md:pb-4 lg:overflow-hidden" />
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around border-t border-[var(--color-chrome-border)] bg-[var(--color-chrome)] px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
        {primaryItems.map((item) => (
          <div
            key={item.path}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-medium ${
              item.path === pathname ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"
            }`}
          >
            <item.icon size={20} strokeWidth={2} />
            <span>{item.label}</span>
          </div>
        ))}
        <div className="flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-medium text-[var(--color-text-muted)]">
          <MoreHorizontal size={20} strokeWidth={2} />
          <span>More</span>
        </div>
      </nav>
    </div>
  );
}
