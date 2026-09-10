import { useState } from "react";
import { ImageOff } from "lucide-react";
import { resolveAssetUrl } from "../resolveAssetUrl";

export default function ImageViewer({ item }) {
  const [errored, setErrored] = useState(false);

  if (!item.url_path || errored) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_3%,var(--color-surface))] text-[var(--color-text-muted)]">
        <ImageOff size={22} />
        <p className="text-xs">Image preview unavailable.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center overflow-auto rounded-lg border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_3%,var(--color-surface))] p-2">
      <img
        src={resolveAssetUrl(item.url_path)}
        alt={item.title}
        onError={() => setErrored(true)}
        className="max-h-full max-w-full rounded-md object-contain"
      />
    </div>
  );
}
