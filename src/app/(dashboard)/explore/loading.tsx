export default function ExploreLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8">
        <div className="h-7 w-28 animate-pulse rounded-md bg-secondary" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded-md bg-secondary" />
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="w-full shrink-0 lg:w-60">
          <div className="h-80 animate-pulse rounded-xl border border-border bg-card" />
        </div>

        <div className="flex-1">
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-52 animate-pulse rounded-xl border border-border bg-card"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
