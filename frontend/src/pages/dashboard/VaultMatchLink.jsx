import { ExternalLink } from "lucide-react";

export default function VaultMatchLink({ file, onOpen }) {
  if (!file || !onOpen) return null;
  return (
    <button
      type="button"
      title={`Open "${file.title}" in Vault`}
      onClick={() => onOpen(file)}
      className="inline-flex shrink-0 items-center gap-1 rounded border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/20"
    >
      <ExternalLink size={10} />
      Vault
    </button>
  );
}
