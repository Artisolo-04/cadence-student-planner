import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { resolveAssetUrl } from "../resolveAssetUrl";
import useScrollFade from "../../../../../hooks/useScrollFade";
import { TopFade, BottomFade } from "../../../../../components/ui/ScrollFadeOverlay";

const TEXT_BG = "color-mix(in srgb, var(--color-text) 3%, var(--color-surface))";

export default function TextViewer({ item }) {
  const [state, setState] = useState({ status: "loading", content: "" });
  const { scrollRef, showTopFade, showBottomFade, updateScrollFades } = useScrollFade([state.content]);

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
    <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-[var(--color-border)]">
      <pre
        ref={scrollRef}
        onScroll={updateScrollFades}
        className="h-full overflow-auto whitespace-pre-wrap break-words p-3 text-xs leading-relaxed text-[var(--color-text)] scrollbar-cadence"
        style={{ backgroundColor: TEXT_BG }}
      >
        {state.content}
      </pre>
      <TopFade show={showTopFade} fromColor={TEXT_BG} />
      <BottomFade show={showBottomFade} fromColor={TEXT_BG} />
    </div>
  );
}
