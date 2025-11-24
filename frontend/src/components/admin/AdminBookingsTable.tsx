import StatusBadge from "../StatusBadge";
import AdminTableSkeleton from "./AdminTableSkeleton";
import { formatBerlin } from "../../utils/datetime";
import Pagination from "../ui/Pagination";
import Button from "../ui/Button";
export interface AdminBooking {
  _id: string;
  serviceName: string;
  durationMin: number;
  startsAt: string; // ISO
  endsAt: string;   // ISO
  status:
    | "booked"
    | "cancelled"
    | "completed"
    | "no_show"
    | "rescheduled"
    | string;
  user?: {
    id: string;
    name?: string;
    email?: string;
    warning_count?: number;
  };
  barber?: { id: string; name?: string };
  notes?: string;
}

interface AdminBookingsTableProps {
  bookings: AdminBooking[];
  isLoading: boolean;
  isError: boolean;
  isActing: boolean;
  curPage: number;
  totalPages: number;
  onPageChange: (updater: (prev: number) => number) => void;
  onEdit: (booking: AdminBooking) => void;
  onCancel: (id: string) => void;
  onNoShow: (id: string) => void;
  onComplete: (id: string) => void;
}

const AdminBookingsTable = ({
  bookings,
  isLoading,
  isError,
  isActing,
  curPage,
  totalPages,
  onPageChange,
  onEdit,
  onCancel,
  onNoShow,
  onComplete,
}: AdminBookingsTableProps) => {
  if (isError) {
    return (
      <div className="text-center text-rose-600 bg-rose-50 border border-rose-200 rounded-lg py-4">
        Failed to load bookings. Try again later.
      </div>
    );
  }

  if (isLoading) return <AdminTableSkeleton />;

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-neutral-100 text-neutral-700 uppercase text-xs">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Service</th>
            <th className="px-4 py-3">Barber</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {bookings.map((b) => {
            const canEdit = b.status === "booked";
            const canCancel =
              b.status === "booked" || b.status === "rescheduled";
            const canComplete =
              b.status === "booked" || b.status === "rescheduled";
            const canNoShow =
              b.status === "booked" || b.status === "rescheduled";

            return (
              <tr
                key={b._id}
                className="border-t border-neutral-100 text-neutral-800 hover:bg-neutral-50 transition"
              >
                <td className="px-4 py-3 text-neutral-800">
                  {formatBerlin(b.startsAt)}
                </td>

                <td className="px-4 py-3">
                  <div className="flex flex-col text-neutral-800">
                    <span>{b.serviceName}</span>
                    {b.notes && (
                      <span
                        className="text-xs text-neutral-800 truncate max-w-[180px]"
                        title={b.notes}
                      >
                        📝 {b.notes}
                      </span>
                    )}
                  </div>
                </td>

                <td className="px-4 py-3 font-medium">
                  {b.barber?.name ?? "—"}
                </td>

                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium">{b.user?.name ?? "—"}</span>
                    <span className="text-neutral-500 text-xs">
                      {b.user?.email ?? ""}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <StatusBadge status={b.status} />
                </td>

                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <Button
                      size="sm"
                      disabled={!canEdit || isActing}
                      variant="normal"
                      className="bg-neutral-200 text-black border border-amber-400 hover:bg-amber-100"
                      onClick={() => onEdit(b)}
                    >
                      Edit
                    </Button>
                    <Button
                      disabled={!canCancel || isActing}
                      onClick={() => onCancel(b._id)}
                      size="sm"
                      variant="secondary"
                      className="rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
                    >
                      Cancel
                    </Button>

                    <Button
                      disabled={!canNoShow || isActing}
                      onClick={() => onNoShow(b._id)}
                      size="sm"
                      variant="danger"
                    >
                      No-Show
                    </Button>
                  <Button
                    size="sm"
                    disabled={!canComplete || isActing}
                    variant="primary"
                    className="bg-neutral-900 hover:bg-neutral-700"
                    onClick={() => onComplete(b._id)}
                  >
                    Complete
                  </Button>
                  </div>
                </td>
              </tr>
            );
          })}

          {bookings.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                No bookings match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <Pagination
        page={curPage}
        totalPages={totalPages}
        onChange={(newPage) => onPageChange(() => newPage)}
        className="bg-neutral-900 border-t border-neutral-200"
      />
    </div>
  );
};

export default AdminBookingsTable;
