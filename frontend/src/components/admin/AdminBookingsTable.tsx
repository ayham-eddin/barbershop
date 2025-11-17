// src/components/admin/AdminBookingsTable.tsx
import StatusBadge from "../StatusBadge";
import AdminTableSkeleton from "./AdminTableSkeleton";
import { formatBerlin } from "../../utils/datetime";

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

  if (isLoading) {
    return <AdminTableSkeleton />;
  }

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
                className="border-t border-neutral-100 hover:bg-neutral-50 transition"
              >
                <td className="px-4 py-3 text-neutral-800">
                  {formatBerlin(b.startsAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span>{b.serviceName}</span>
                    {b.notes && (
                      <span
                        title={b.notes}
                        className="text-xs text-neutral-500 truncate max-w-[180px]"
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
                    <span className="font-medium">
                      {b.user?.name ?? "—"}
                    </span>
                    <span className="text-neutral-500 text-xs">
                      {b.user?.email ?? ""}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={b.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(b)}
                      disabled={!canEdit || isActing}
                      className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100 disabled:opacity-50"
                      title={
                        canEdit
                          ? "Edit booking"
                          : "Only booked appointments can be edited"
                      }
                    >
                      Edit
                    </button>
                    <button
                      disabled={!canCancel || isActing}
                      onClick={() => onCancel(b._id)}
                      className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100 disabled:opacity-50"
                      title="Cancel booking"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!canNoShow || isActing}
                      onClick={() => onNoShow(b._id)}
                      className="rounded-md border border-rose-300 text-rose-800 px-3 py-1.5 hover:bg-rose-50 disabled:opacity-50"
                      title="Mark no-show (adds a warning; blocks at 2)"
                    >
                      No-Show
                    </button>
                    <button
                      disabled={!canComplete || isActing}
                      onClick={() => onComplete(b._id)}
                      className="rounded-md bg-neutral-900 text-white px-3 py-1.5 hover:bg-neutral-800 disabled:opacity-50"
                      title="Mark as completed"
                    >
                      Complete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}

          {bookings.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-8 text-center text-neutral-500"
              >
                No bookings match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center px-4 py-3 border-t border-neutral-200 text-sm bg-neutral-50">
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            disabled={curPage <= 1}
            onClick={() => onPageChange((p) => Math.max(1, p - 1))}
            className="flex-1 sm:flex-none rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={curPage >= totalPages}
            onClick={() => onPageChange((p) => p + 1)}
            className="flex-1 sm:flex-none rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <span className="text-neutral-600 text-center sm:text-right">
          Page {curPage} / {totalPages}
        </span>
      </div>
    </div>
  );
}
export default AdminBookingsTable;