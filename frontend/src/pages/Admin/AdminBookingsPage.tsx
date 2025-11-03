import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import api from "../../api/client";

interface AdminBooking {
  _id: string;
  serviceName: string;
  durationMin: number;
  startsAt: string;
  endsAt: string;
  status: string;
  user?: { id: string; name?: string; email?: string };
  barber?: { id: string; name?: string };
}

interface AdminResponse {
  bookings: AdminBooking[];
  page: number;
  limit: number;
  pages: number;
  total: number;
}

export default function AdminBookingsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<AdminResponse>({
    queryKey: ["adminBookings", page],
    queryFn: async () => {
      const res = await api.get(`/api/bookings/admin/all?page=${page}&limit=5`);
      return res.data as AdminResponse;
    },
    // React Query v5: this replaces `keepPreviousData: true`
    placeholderData: keepPreviousData,
    // Optional: small stale window to avoid extra flashes
    staleTime: 5_000,
  });

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString("de-DE", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const bookings: AdminBooking[] = data?.bookings ?? [];
  const curPage = data?.page ?? page;
  const totalPages = data?.pages ?? 1;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Admin Dashboard
        </h1>
        <button
          onClick={() => refetch()}
          className="rounded-lg bg-neutral-900 text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800 transition disabled:opacity-60"
          disabled={isFetching}
        >
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {isLoading && (
        <div className="text-center text-neutral-500 py-12">Loading…</div>
      )}

      {isError && (
        <div className="text-center text-rose-600 bg-rose-50 border border-rose-200 rounded-lg py-4">
          Failed to load bookings. Try again later.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-neutral-100 text-neutral-700 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Barber</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b: AdminBooking) => (
                <tr
                  key={b._id}
                  className="border-t border-neutral-100 hover:bg-neutral-50 transition"
                >
                  <td className="px-4 py-3 text-neutral-800">
                    {fmtDate(b.startsAt)}
                  </td>
                  <td className="px-4 py-3">{b.serviceName}</td>
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
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-neutral-500"
                  >
                    No bookings to show.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-between items-center px-4 py-3 border-t border-neutral-200 text-sm bg-neutral-50">
            <button
              disabled={curPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100 disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-neutral-600">
              Page {curPage} / {totalPages}
            </span>
            <button
              disabled={curPage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------- UI Subcomponents ---------------------------- */

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    booked: "bg-amber-100 text-amber-800 border-amber-200",
    cancelled: "bg-rose-100 text-rose-800 border-rose-200",
    completed: "bg-green-100 text-green-800 border-green-200",
  };

  const color =
    colors[status] || "bg-neutral-100 text-neutral-700 border-neutral-200";

  return (
    <span
      className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${color}`}
    >
      {status}
    </span>
  );
}
