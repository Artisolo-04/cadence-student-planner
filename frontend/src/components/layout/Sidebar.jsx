import SidebarLink from "./SidebarLink";
import { navItems } from "../../lib/navigation";

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 border-r border-[var(--color-border)] px-3 py-6 hidden md:block">
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <SidebarLink key={item.path} to={item.path}>
            {item.label}
          </SidebarLink>
        ))}
      </nav>
    </aside>
  );
}
