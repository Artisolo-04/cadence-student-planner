import { Calendar } from "lucide-react";

const VARIANTS = {
  default: {
    wrap: "flex-col justify-center gap-5 px-6 py-16 text-center",
    orb: "h-20 w-20", ring: "inset-2.5", core: "h-11 w-11", icon: 20,
    title: "text-base", body: "mt-1.5 text-sm", text: "max-w-xs",
  },
  compact: {
    wrap: "flex-col justify-center gap-3 px-4 py-6 text-center",
    orb: "h-14 w-14", ring: "inset-1.5", core: "h-8 w-8", icon: 16,
    title: "text-sm", body: "mt-1 text-xs", text: "max-w-[220px]",
  },
  tight: {
    wrap: "flex-col justify-center gap-1.5 px-4 py-1 text-center",
    orb: "h-12 w-12", ring: "inset-1", core: "h-8 w-8", icon: 16,
    title: "text-sm", body: "mt-0.5 text-xs", text: "max-w-[220px]",
  },
  inline: {
    wrap: "flex-row justify-start gap-3 py-1 text-left",
    orb: "h-12 w-12", ring: "inset-1.5", core: "h-7 w-7", icon: 14,
    title: "text-sm", body: "mt-0.5 text-xs", text: "",
  },
};

export default function EmptyState({
  title, body, icon: Icon = Calendar, action = null, variant = "default", className = "",
}) {
  const v = VARIANTS[variant] ?? VARIANTS.default;
  return (
    <div className={`flex items-center ${v.wrap} ${className}`}>
      <div className={`relative flex shrink-0 items-center justify-center ${v.orb}`}>
        <span aria-hidden className="absolute inset-0 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-primary)_25%,transparent),transparent_70%)] blur-md" />
        <span aria-hidden className="absolute inset-0 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)]" />
        <span aria-hidden className={`absolute rounded-full border border-[color-mix(in_srgb,var(--color-primary)_32%,transparent)] ${v.ring}`} />
        <span className={`relative flex items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--color-primary)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-surface))] shadow-[0_0_24px_-6px_var(--color-primary)] ${v.core}`}>
          <Icon size={v.icon} className="text-[var(--color-primary)]" />
        </span>
      </div>

      <div className={v.text}>
        <h2 className={`font-semibold tracking-tight text-[var(--color-text)] ${v.title}`}>{title}</h2>
        {body && <p className={`leading-relaxed text-[var(--color-text-muted)] ${v.body}`}>{body}</p>}
      </div>

      {action}
    </div>
  );
}
