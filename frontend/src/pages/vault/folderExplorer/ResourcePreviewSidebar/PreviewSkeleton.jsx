const BG = "color-mix(in srgb, var(--color-text) 3%, var(--color-surface))";
const LINES = ["w-11/12", "w-full", "w-4/5", "w-full", "w-2/3", "w-10/12", "w-full", "w-3/5", "w-11/12", "w-1/2"];

// Skeleton twin of the text / docx preview box: same shell, same padding, same background.
export default function PreviewSkeleton({ padding = "p-3" }) {
  return (
    <div role="status" aria-busy="true" className="flex min-h-0 flex-1 overflow-hidden">
      <span className="sr-only">Loading preview</span>
      <div
        aria-hidden="true"
        className={`relative flex min-w-0 flex-1 flex-col gap-3 overflow-hidden rounded-lg ${padding}`}
        style={{ backgroundColor: BG }}
      >
        {LINES.map((w, i) => (
          <span
            key={i}
            className={`sk block h-[0.8em] max-w-full rounded-[3px] text-xs ${w}`}
            style={{ "--sk-delay": `-${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
