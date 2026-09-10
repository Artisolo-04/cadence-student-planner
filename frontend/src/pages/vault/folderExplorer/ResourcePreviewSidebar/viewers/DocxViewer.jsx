import { useEffect, useState } from "react";
import mammoth from "mammoth";
import { Loader2, FileWarning } from "lucide-react";
import { resolveAssetUrl } from "../resolveAssetUrl";

export default function DocxViewer({ item }) {
  const [html, setHtml] = useState("");
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setHtml("");

    if (!item.url_path) {
      setStatus("error");
      return;
    }

    (async () => {
      try {
        const res = await fetch(resolveAssetUrl(item.url_path));
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();
        const { value } = await mammoth.convertToHtml({ arrayBuffer });
        if (!cancelled) {
          setHtml(value);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [item.url_path]);

  if (status === "loading") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_3%,var(--color-surface))] text-[var(--color-text-muted)]">
        <Loader2 size={22} className="animate-spin" />
        <p className="text-xs">Extracting document text…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_3%,var(--color-surface))] text-[var(--color-text-muted)]">
        <FileWarning size={22} />
        <p className="text-xs">Couldn't extract a preview for this document.</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .docx-preview h1, .docx-preview h2, .docx-preview h3 {
          color: var(--color-text);
          font-weight: 600;
          margin: 0.75em 0 0.35em;
        }
        .docx-preview p { margin: 0.5em 0; }
        .docx-preview table { border-collapse: collapse; width: 100%; margin: 0.75em 0; }
        .docx-preview td, .docx-preview th {
          border: 1px solid var(--color-border);
          padding: 4px 8px;
        }
        .docx-preview a { color: var(--color-primary); }
        .docx-preview ul, .docx-preview ol { padding-left: 1.25em; margin: 0.5em 0; }
      `}</style>
      <div
        className="docx-preview scrollbar-cadence min-h-0 flex-1 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5 text-sm leading-relaxed text-[var(--color-text)]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}
