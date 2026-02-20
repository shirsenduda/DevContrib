export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-10">
        <div className="h-7 w-36 animate-pulse rounded-md bg-secondary" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded-md bg-secondary" />
      </div>

      <div className="mb-6 flex items-center gap-2.5">
        <div className="h-8 w-8 animate-pulse rounded-lg bg-secondary" />
        <div className="h-5 w-24 animate-pulse rounded-md bg-secondary" />
      </div>

      <div className="h-52 animate-pulse rounded-xl border border-border bg-card" />

      <div className="mt-8 h-4 w-48 animate-pulse rounded-md bg-secondary" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-52 animate-pulse rounded-xl border border-border bg-card" />
        ))}
      </div>
    </div>
  );
}
