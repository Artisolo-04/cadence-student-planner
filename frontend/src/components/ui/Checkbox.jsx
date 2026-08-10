import { Check } from "lucide-react";

export default function Checkbox({ label, id, checked, onChange, className = "", ...rest }) {
  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-2.5 cursor-pointer select-none text-sm text-[var(--color-text)] ${className}`}
    >
      <span className="relative inline-flex h-5 w-5 shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
          {...rest}
        />
        <span
          className="h-5 w-5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]
            peer-checked:bg-[var(--color-primary)] peer-checked:border-[var(--color-primary)]
            peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-ring)]
            transition-colors flex items-center justify-center pointer-events-none"
        >
          <Check
            size={13}
            strokeWidth={3}
            className={`text-[var(--color-primary-fg)] ${checked ? "opacity-100" : "opacity-0"}`}
          />
        </span>
      </span>
      {label}
    </label>
  );
}
