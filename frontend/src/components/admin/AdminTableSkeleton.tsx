export default function AdminTableSkeleton() {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm animate-pulse">
      {/* Header row skeleton */}
      <div className="h-10 bg-neutral-100 border-b border-neutral-200" />

      {/* Body rows skeleton */}
      <div className="space-y-0.5">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className="flex items-center gap-4 px-4 py-3 border-t border-neutral-100"
          >
            <div className="h-4 w-24 rounded-md bg-neutral-100" />
            <div className="h-4 w-32 rounded-md bg-neutral-100" />
            <div className="h-4 w-24 rounded-md bg-neutral-100" />
            <div className="ml-auto h-4 w-40 rounded-md bg-neutral-100" />
          </div>
        ))}
      </div>

      {/* Footer / pagination skeleton */}
      <div className="h-10 bg-neutral-50 border-t border-neutral-200" />
    </div>
  );
}
