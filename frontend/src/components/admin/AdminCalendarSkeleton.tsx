const AdminCalendarSkeleton = () => {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-6 w-40 rounded-md bg-neutral-100" />
        <div className="space-y-1 text-right">
          <div className="h-4 w-24 rounded-md bg-neutral-100" />
          <div className="h-3 w-20 rounded-md bg-neutral-100" />
        </div>
      </div>
      <div className="h-64 md:h-80 w-full rounded-xl border border-neutral-200 bg-neutral-50" />
    </div>
  );
}
export default AdminCalendarSkeleton;