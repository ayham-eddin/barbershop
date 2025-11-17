import type { TimeOff } from "../../../api/timeoff";

interface AdminTimeOffTableProps {
  items: TimeOff[];
  barberMap: Map<string, string>;
  isLoading: boolean;
  isError: boolean;
  isRemoving: boolean;
  onRemove: (id: string) => void;
}

export default function AdminTimeOffTable({
  items,
  barberMap,
  isLoading,
  isError,
  isRemoving,
  onRemove,
}: AdminTimeOffTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
      {isLoading ? (
        <div className="text-center text-neutral-500 py-12">Loading…</div>
      ) : isError ? (
        <div className="text-center text-rose-600 bg-rose-50 border border-rose-200 rounded-lg py-4">
          Failed to load time-off.
        </div>
      ) : (
        <table className="min-w-full text-sm text-left">
          <thead className="bg-neutral-100 text-neutral-700 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Barber</th>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">End</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr
                key={t._id}
                className="border-t border-neutral-100 hover:bg-neutral-50 transition"
              >
                <td className="px-4 py-3">
                  {barberMap.get(t.barberId) ?? t.barberId}
                </td>
                <td className="px-4 py-3">
                  {new Date(t.start).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  {new Date(t.end).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {t.reason ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <button
                      onClick={() => onRemove(t._id)}
                      disabled={isRemoving}
                      className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100 disabled:opacity-50"
                    >
                      {isRemoving ? "Removing…" : "Remove"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-neutral-500"
                >
                  No time-off entries for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
