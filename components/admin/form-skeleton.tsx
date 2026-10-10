export function FormSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]" aria-hidden>
      <div className="space-y-6">
        {[180, 220, 160].map((h) => (
          <div key={h} style={{ height: h }} className="animate-pulse rounded-xl bg-white" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-white" />
    </div>
  );
}
