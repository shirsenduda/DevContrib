export default function ScrapeLogsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="shimmer h-16 w-48 rounded-xl" />
        <div className="shimmer h-9 w-32 rounded-lg" />
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="shimmer h-10 bg-secondary/50" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="shimmer h-14 border-t border-border bg-card" />
        ))}
      </div>
    </div>
  );
}
