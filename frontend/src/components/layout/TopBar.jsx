import ThemeToggle from "../ui/ThemeToggle";
import UserMenu from "./UserMenu";

export default function TopBar() {
  return (
    <header className="flex items-center justify-between px-8 py-2 border-b border-[var(--color-border)]">
      <span className="text-lg font-semibold text-[var(--color-primary)]">Cadence</span>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
