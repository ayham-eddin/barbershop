import { formatBerlin } from "../../../utils/datetime";

export type ConflictBooking = {
  id: string;
  startsAt: string;
  serviceName: string;
  userName?: string;
  userEmail?: string;
};

export type DeleteConflictState = {
  barberId: string;
  barberName: string;
  bookings: ConflictBooking[];
};

function isoToYmd(iso: string): string {
  return iso.slice(0, 10);
}

type Props = {
  conflict: DeleteConflictState;
  onClose: () => void;
};

export default function DeleteConflictPanel({ conflict, onClose }: Props) {
  const { barberId, barberName, bookings } = conflict;

  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-amber-900">
            Cannot delete {barberName}
          </h2>
          <p className="mt-1 text-xs text-amber-800">
            This barber still has {bookings.length} future booking
            {bookings.length === 1 ? "" : "s"}. Set them inactive, or update /
            cancel the bookings below.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-amber-300 px-2 py-1 text-xs text-amber-800 hover:bg-amber-100"
        >
          Close
        </button>
      </div>

      <div className="rounded-lg bg-white border border-amber-100 max-h-60 overflow-y-auto">
        <table className="min-w-full text-xs text-left">
          <thead className="bg-amber-50 text-amber-900 uppercase">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Service</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-t border-amber-100">
                <td className="px-3 py-2 text-neutral-800">
                  {formatBerlin(b.startsAt)}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-col">
                    <span className="font-medium text-neutral-900">
                      {b.userName ?? "—"}
                    </span>
                    {b.userEmail && (
                      <span className="text-[11px] text-neutral-500">
                        {b.userEmail}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-neutral-800">
                  {b.serviceName}
                </td>
                <td className="px-3 py-2 text-right">
                  <a
                    href={`/admin/bookings?barberId=${encodeURIComponent(
                      barberId,
                    )}&date=${encodeURIComponent(isoToYmd(b.startsAt))}`}
                    className="inline-flex items-center rounded-full border border-amber-300 px-3 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-50"
                  >
                    Open in bookings
                  </a>
                </td>
              </tr>
            ))}

            {bookings.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-4 text-center text-neutral-500"
                >
                  No upcoming bookings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
