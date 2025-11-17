type StatusBadgeProps = {
  status: string;
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const colors: Record<string, string> = {
    booked: "bg-amber-100 text-amber-800 border-amber-200",
    rescheduled: "bg-sky-100 text-sky-800 border-sky-200",
    no_show: "bg-rose-100 text-rose-800 border-rose-200",
    cancelled: "bg-neutral-100 text-neutral-700 border-neutral-200",
    completed: "bg-green-100 text-green-800 border-green-200",
  };

  const color =
    colors[status] ||
    "bg-neutral-100 text-neutral-700 border-neutral-200";

  return (
    <span
      className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${color}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export default StatusBadge;