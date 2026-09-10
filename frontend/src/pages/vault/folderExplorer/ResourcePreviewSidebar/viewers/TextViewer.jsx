import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { resolveAssetUrl } from "../resolveAssetUrl";

export default function TextViewer({ item }) {
  const [state, setState] = useState({ status: "loading", content: "" });

  useEffect(() => {
    if (!item.url_path) {
      setState({ status: "error", content: "" });
      return;
    }
    let cancelled = false;
    setState({ status: "loading", content: "" });

    fetch(resolveAssetUrl(item.url_path))
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        return res.text();
      })
      .then((text) => {
        if (!cancelled) setState({ status: "ready", content: text });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error", content: "" });
      });

    return () => {
      cancelled = true;
    };
  }, [item.url_path]);

  if (state.status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-[var(--color-text-muted)]">
        Loading preview…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_3%,var(--color-surface))] text-[var(--color-text-muted)]">
        <AlertCircle size={20} />
        <p className="text-xs">Could not load a text preview.</p>
      </div>
    );
  }

  return (
    <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_3%,var(--color-surface))] p-3 text-xs leading-relaxed text-[var(--color-text)] scrollbar-cadence">
      {state.content}
    </pre>
  );
}
