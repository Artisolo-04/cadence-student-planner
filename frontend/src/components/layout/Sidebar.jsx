import { ChevronLeft } from "lucide-react";
import SidebarLink from "./SidebarLink";
import WorkspaceContextSwitcher from "./WorkspaceContextSwitcher";
import Tooltip from "../ui/Tooltip";
import { navItems } from "../../lib/navigation";
import { useSidebar } from "../../hooks/useSidebar";

export default function Sidebar() {
  const { collapsed, toggleSidebar, contentVisible } = useSidebar();

  const toggleButton = (
    <button
      onClick={toggleSidebar}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className={`flex items-center w-full py-1.5 rounded-lg text-[13px] font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/40 hover:text-[var(--color-text)] transition-colors duration-200 ease-in-out ${
        collapsed ? "justify-center px-0" : "px-2"
      }`}
    >
      <span
        className={`flex items-center justify-center w-7 h-7 shrink-0 transition-opacity duration-150 ease-in-out ${
          contentVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <ChevronLeft
          size={16}
          strokeWidth={2}
          className={`transition-transform duration-200 ease-in-out ${collapsed ? "rotate-180" : "rotate-0"}`}
        />
      </span>
      <span
        className={`overflow-hidden whitespace-nowrap transition-all duration-150 ease-in-out ${
          collapsed ? "max-w-0 ml-0" : "max-w-[160px] ml-2"
        } ${contentVisible ? "opacity-100" : "opacity-0"}`}
      >
        Collapse
      </span>
    </button>
  );

  return (
    <aside
      className={`shrink-0 border-r border-[var(--color-border)] p-2 hidden md:flex md:flex-col justify-between transition-all duration-200 ease-in-out ${
        collapsed ? "w-14 px-2" : "w-52 px-2"
      }`}
    >
      <div className="flex flex-col">
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <SidebarLink key={item.path} to={item.path} icon={item.icon} collapsed={collapsed}>
              {item.label}
            </SidebarLink>
          ))}
        </nav>
      </div>

      <div className="pt-2 border-t border-[var(--color-border)]">
        <WorkspaceContextSwitcher />

        {collapsed ? (
          <Tooltip label="Expand sidebar">{toggleButton}</Tooltip>
        ) : (
          toggleButton
        )}
      </div>
    </aside>
  );
}
