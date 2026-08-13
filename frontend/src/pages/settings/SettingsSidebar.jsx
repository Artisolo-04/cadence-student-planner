import ThemeToggle from "../../components/ui/ThemeToggle";
import { Info } from "lucide-react";

const TIPS = [
  "Set your group per workspace to filter your schedule to just your sessions.",
  "Update your faculty and class/year anytime — changes apply everywhere instantly.",
  "Switch workspaces from the dashboard dropdown to see a different timetable's today view.",
];

export function AppearanceCard() {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h2 className="text-base font-semibold text-[var(--color-text)] mb-1">Appearance</h2>
      <p className="text-sm text-[var(--color-text-muted)] mb-4">
        Switch between light and dark mode.
      </p>
      <ThemeToggle />
    </div>
  );
}

export function TipsCard() {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <div className="flex items-center gap-2 mb-3">
        <Info size={16} className="text-[var(--color-primary)]" />
        <h2 className="text-base font-semibold text-[var(--color-text)]">Tips</h2>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TIPS.map((tip, i) => (
          <li key={i} className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}
