export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="shimmer mb-8 h-16 w-64 rounded-xl" />
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="shimmer h-24 rounded-xl border border-border bg-card" />
        ))}
      </div>
      <div className="shimmer mb-8 h-12 w-48 rounded-xl" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="shimmer h-14 rounded-lg border border-border bg-card" />
        ))}
      </div>
    </div>
  );
}
