import Button from "../ui/Button";
import ThemeToggle from "../ui/ThemeToggle";
import { useAuth } from "../../hooks/useAuth";

export default function TopBar() {
  const { logout } = useAuth();

  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-[var(--color-border)]">
      <span className="text-lg font-semibold text-[var(--color-primary)]">Cadence</span>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Button variant="secondary" onClick={logout}>
          Log out
        </Button>
      </div>
    </header>
  );
}
