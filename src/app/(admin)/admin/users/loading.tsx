export default function UsersLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="shimmer mb-6 h-16 w-32 rounded-xl" />
      <div className="shimmer mb-4 h-10 w-80 rounded-lg" />
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="shimmer h-10 bg-secondary/50" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="shimmer h-14 border-t border-border bg-card" />
        ))}
      </div>
    </div>
  );
}
