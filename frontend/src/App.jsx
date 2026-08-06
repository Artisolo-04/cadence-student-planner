import { useEffect, useState } from "react";
import ThemeToggle from "./components/ui/ThemeToggle";

export default function App() {
  const [status, setStatus] = useState("Checking backend...");

  useEffect(() => {
    fetch("http://localhost:4000/api/hello")
      .then((res) => res.json())
      .then(() => setStatus("Backend connected"))
      .catch(() =>
        setStatus("Backend not running — start it with: cd backend && npm run dev")
      );
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
        <span className="font-semibold tracking-tight text-[var(--color-primary)]">
          Cadence
        </span>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center text-center px-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">Find your rhythm.</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Auth, profile, and timetable builder are under construction.
          </p>
          <p className="text-sm text-[var(--color-primary)]">{status}</p>
        </div>
      </main>
    </div>
  );
}
