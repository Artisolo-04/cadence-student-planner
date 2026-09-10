import { AlertTriangle } from "lucide-react";

export default function UrlViewer({ item }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <iframe
        src={item.url_path}
        title={item.title}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        className="min-h-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)]"
      />
      <p className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)]">
        <AlertTriangle size={11} className="shrink-0" />
        Some sites block embedding — use "Open in new tab" above if this stays blank.
      </p>
    </div>
  );
}
