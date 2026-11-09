function Block({ className = "" }) {
  return <div className={`rounded-md bg-[var(--color-fill-3)] ${className}`} />;
}

function Shell({ className = "", children }) {
  return (
    <div className={`rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] ${className}`}>
      {children}
    </div>
  );
}

export default function AnalyticsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading analytics"
      className="flex flex-col gap-4 motion-safe:animate-pulse lg:h-full lg:min-h-0 lg:overflow-hidden"
    >
      <header className="flex shrink-0 items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Block className="h-5 w-28" />
          <Block className="h-3.5 w-56" />
        </div>
        <Block className="h-9 w-56 rounded-lg" />
      </header>

      <div className="grid shrink-0 grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Shell key={i} className="flex min-h-[8.5rem] flex-col gap-3 p-4">
            <Block className="h-2.5 w-20" />
            <Block className="h-8 w-24" />
            <Block className="h-3 w-32" />
          </Shell>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-3 lg:grid-rows-[repeat(2,minmax(0,1fr))]">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Shell key={i} className="flex min-h-[16rem] flex-col gap-4 p-5 lg:min-h-0">
            <Block className="h-2.5 w-28" />
            <div className="flex flex-1 flex-col justify-end gap-3">
              <Block className="h-3 w-full" />
              <Block className="h-3 w-4/5" />
              <Block className="h-3 w-3/5" />
            </div>
          </Shell>
        ))}
      </div>
    </div>
  );
}
