import Button from "../components/ui/Button";
import ThemeToggle from "../components/ui/ThemeToggle";
import { useAuth } from "../hooks/useAuth";

export default function Dashboard() {
  const { user, profile, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="flex items-center justify-between px-8 py-4 border-b border-[var(--color-border)]">
        <span className="text-lg font-semibold text-[var(--color-primary)]">Cadence</span>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="secondary" onClick={logout}>
            Log out
          </Button>
        </div>
      </header>
      <main className="px-8 py-10">
        <h1 className="text-xl font-semibold text-[var(--color-text)]">
          Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">{user?.email}</p>
      </main>
    </div>
  );
}
