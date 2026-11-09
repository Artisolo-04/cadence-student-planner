import { PanelRightOpen } from "lucide-react";
import useScrollFade from "../../hooks/useScrollFade";
import { BottomFade, TopFade } from "../../components/ui/ScrollFadeOverlay";

const TILE_GRADIENT =
  "linear-gradient(150deg, color-mix(in srgb, var(--color-tint) 14%, transparent) 0%, transparent 70%)";

export function TileLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">
      {Icon && <Icon size={12} />}
      {children}
    </div>
  );
}

export default function AnalyticsTile({ icon, title, meta, children, className = "", scroll = true, onExpand }) {
  const { scrollRef, showTopFade, showBottomFade } = useScrollFade(title);

  return (
    <section
      className={`relative flex min-h-[16rem] flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 backdrop-blur-xl lg:min-h-0 ${className}`}
      style={{ backgroundImage: TILE_GRADIENT }}
    >
      <header className="flex shrink-0 items-center justify-between gap-2">
        <TileLabel icon={icon}>{title}</TileLabel>
        <div className="flex items-center gap-2">
          {meta && <span className="text-[10px] font-mono text-[var(--color-text-muted)]">{meta}</span>}
          {onExpand && (
            <button
              type="button"
              onClick={onExpand}
              aria-label={`Open ${title} details`}
              title="See details"
              className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-fill-1)] text-[var(--color-text-muted)] transition-all duration-150 hover:border-[color-mix(in_srgb,var(--color-primary)_45%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] hover:text-[var(--color-primary)] active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]"
            >
              <PanelRightOpen size={13} />
            </button>
          )}
        </div>
      </header>

      <div className="relative mt-3 min-h-0 flex-1">
        <div
          ref={scrollRef}
          className={`h-full ${scroll ? "scrollbar-cadence overflow-y-auto pr-2" : "overflow-hidden"}`}
        >
          {children}
        </div>
        <TopFade show={showTopFade} />
        <BottomFade show={showBottomFade} />
      </div>
    </section>
  );
}
