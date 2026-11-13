function Field({ label, delay }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
      <div
        aria-hidden="true"
        className="sk h-[38px] w-full rounded-lg border border-[var(--color-border)]"
        style={{ "--sk-delay": delay }}
      />
    </div>
  );
}

// Skeleton twin of the "My group" card: real shell, title, subtitle and labels.
export default function GroupSkeleton({ showActiveBadge = true }) {
  return (
    <div
      role="status"
      aria-busy="true"
      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
    >
      <span className="sr-only">Loading your workspaces</span>
      <h2 className="text-base font-semibold text-[var(--color-text)] mb-1">My group</h2>
      <p className="text-sm text-[var(--color-text-muted)] mb-4">
        Pick which group's sessions show up for you in each workspace.
      </p>

      <div className="flex flex-col gap-4 max-w-md">
        <div className="flex flex-col gap-1.5">
          <Field label="Workspace" delay="0s" />
          {showActiveBadge && (
            <span
              aria-hidden="true"
              className="sk inline-flex w-fit items-center rounded-lg border border-[var(--color-line)] px-2 py-1 text-[11px] font-medium"
              style={{ "--sk-delay": "-0.2s" }}
            >
              <span className="invisible">Currently active workspace</span>
              <span className="invisible ml-3.5" />
            </span>
          )}
        </div>
        <Field label="Group" delay="-0.4s" />
      </div>
    </div>
  );
}
