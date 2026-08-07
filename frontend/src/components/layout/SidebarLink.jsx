import { NavLink } from "react-router-dom";
import Tooltip from "../ui/Tooltip";
import { useSidebar } from "../../hooks/useSidebar";

export default function SidebarLink({ to, icon: Icon, collapsed, children }) {
  const { contentVisible } = useSidebar();

  const link = (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center py-1.5 rounded-lg text-[13px] font-medium transition-colors duration-200 ease-in-out w-full ${
          collapsed ? "justify-center px-0" : "px-2"
        } ${
          isActive
            ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
            : "text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/40 hover:text-[var(--color-text)]"
        }`
      }
    >
      <span
        className={`flex items-center justify-center w-7 h-7 shrink-0 transition-opacity duration-150 ease-in-out ${
          contentVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {Icon && <Icon size={16} strokeWidth={2} />}
      </span>
      <span
        className={`overflow-hidden whitespace-nowrap transition-all duration-150 ease-in-out ${
          collapsed ? "max-w-0 ml-0" : "max-w-[160px] ml-2"
        } ${contentVisible ? "opacity-100" : "opacity-0"}`}
      >
        {children}
      </span>
    </NavLink>
  );

  if (collapsed) {
    return <Tooltip label={children}>{link}</Tooltip>;
  }

  return link;
}
