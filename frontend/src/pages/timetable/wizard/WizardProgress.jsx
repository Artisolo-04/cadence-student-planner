import { Check } from "lucide-react";

const STEP_LABELS = ["Name", "Days", "Slots", "Review"];

export default function WizardProgress({
  currentStep,
  totalSteps,
  onStepChange,
  disabled = false,
}) {
  const isInteractive = typeof onStepChange === "function";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between text-xs font-medium text-[var(--color-text-muted)]">
        <span>Step {currentStep} of {totalSteps}</span>
      </div>

      <ol className="flex items-center">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isComplete = stepNumber < currentStep;
          const connectorComplete = stepNumber < currentStep;

          return (
            <li
              key={stepNumber}
              className={`flex min-w-0 items-center ${
                index < totalSteps - 1 ? "flex-1" : "shrink-0"
              }`}
            >
              <button
                type="button"
                disabled={!isInteractive || disabled}
                onClick={() => onStepChange?.(stepNumber)}
                className={`flex min-w-0 items-center gap-2 rounded-md text-left transition-colors duration-150 ${
                  isInteractive
                    ? "cursor-pointer hover:text-[var(--color-primary)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]"
                    : "cursor-default"
                } disabled:cursor-default`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-semibold transition-colors ${
                    isComplete
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-fg)]"
                      : isActive
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]"
                  }`}
                >
                  {isComplete ? <Check size={14} strokeWidth={3} /> : stepNumber}
                </span>

                <span
                  className={`hidden truncate text-sm sm:block ${
                    isActive
                      ? "font-semibold text-[var(--color-text)]"
                      : isComplete
                        ? "text-[var(--color-primary)]"
                        : "text-[var(--color-text-muted)]"
                  }`}
                >
                  {STEP_LABELS[index]}
                </span>
              </button>

              {index < totalSteps - 1 && (
                <span
                  aria-hidden="true"
                  className="mx-3 h-1 min-w-4 flex-1 overflow-hidden rounded-full bg-[var(--color-border)]"
                >
                  <span
                    className={`block h-full rounded-full transition-all duration-300 ${
                      connectorComplete ? "w-full bg-[var(--color-primary)]" : "w-0"
                    }`}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
