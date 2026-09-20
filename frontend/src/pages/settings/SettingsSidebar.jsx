import ThemeToggle from "../../components/ui/ThemeToggle";
import { Info } from "lucide-react";

const TIPS = [
  "Set your group per workspace to filter your schedule to just your sessions.",
  "Update your faculty and class/year anytime — changes apply everywhere instantly.",
  "Switch workspaces anytime from the selector at the top of the sidebar.",
];

export function AppearanceCard() {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-card">
      <h2 className="text-base font-semibold text-[var(--color-text)] mb-tight">Appearance</h2>
      <p className="text-sm text-[var(--color-text-muted)] mb-roomy">
        Switch between light and dark mode.
      </p>
      <ThemeToggle />
    </div>
  );
}

export function TipsCard() {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-card">
      <div className="flex items-center gap-inline mb-comfy">
        <Info size={16} className="text-[var(--color-primary)]" />
        <h2 className="text-base font-semibold text-[var(--color-text)]">Tips</h2>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-grid">
        {TIPS.map((tip, i) => (
          <li key={i} className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}
