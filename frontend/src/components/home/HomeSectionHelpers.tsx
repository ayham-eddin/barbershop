export const CountBadge = ({
  loading,
  count,
  label,
}: {
  loading: boolean;
  count: number;
  label: string;
}) => {
  if (loading) {
    return (
      <span className="h-6 w-16 rounded-full bg-neutral-200 animate-pulse inline-block" />
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-700">
      <span className="min-w-[1ch] text-center">{count}</span>
      <span className="text-neutral-500">{label}</span>
    </span>
  );
}

export const ListSkeleton = () => {
  return (
    <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-28 rounded-2xl bg-gradient-to-r from-neutral-200 to-neutral-100 animate-pulse"
        />
      ))}
    </div>
  );
}

export const ErrorBox = ({ text }: { text: string }) => {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-800 px-4 py-3 text-sm">
      {text}
    </div>
  );
}

export const EmptyBox = ({ text }: { text: string }) => {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-4 py-6 text-center text-neutral-600">
      {text}
    </div>
  );
}
