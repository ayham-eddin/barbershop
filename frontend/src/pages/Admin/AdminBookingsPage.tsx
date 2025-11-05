import { useEffect, useMemo, useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import api from "../../api/client";
import Modal from "../../components/Modal";
import { patchAdminBooking } from "../../api/adminBookings";
import TimeField from "../../components/TimeField";
import toast from "react-hot-toast";
import type { AxiosError } from "axios";

interface AdminBooking {
  _id: string;
  serviceName: string;
  durationMin: number;
  startsAt: string;
  endsAt: string;
  status: "booked" | "cancelled" | "completed" | string;
  user?: { id: string; name?: string; email?: string };
  barber?: { id: string; name?: string };
  notes?: string; // ← NEW: include notes from backend
}

interface AdminResponse {
  bookings: AdminBooking[];
  page: number;
  limit: number;
  pages: number;
  total: number;
}

interface Barber {
  _id: string;
  name: string;
}

/** Human-friendly error message */
function errorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const ax = err as AxiosError<{ error?: string; message?: string }>;
    return (
      ax.response?.data?.error ||
      ax.response?.data?.message ||
      ax.message ||
      "Request failed"
    );
  }
  return "Request failed";
}

export default function AdminBookingsPage() {
  const qc = useQueryClient();

  // pagination + filters
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");
  const [barberId, setBarberId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [q, setQ] = useState<string>("");

  // load barbers for the filter dropdown + edit form
  const [barbers, setBarbers] = useState<Barber[]>([]);
  useEffect(() => {
    (async () => {
      const res = await api.get<{ barbers: Barber[] }>("/api/barbers");
      setBarbers(res.data.barbers);
    })().catch(() => setBarbers([]));
  }, []);

  // build query string whenever filters/page change
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "5");
    if (status) params.set("status", status);
    if (barberId) params.set("barberId", barberId);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (q.trim()) params.set("q", q.trim());
    return params.toString();
  }, [page, status, barberId, dateFrom, dateTo, q]);

  const qKey = ["adminBookings", queryString] as const;

  const { data, isLoading, isError, refetch, isFetching } =
    useQuery<AdminResponse>({
      queryKey: qKey,
      queryFn: async () => {
        const res = await api.get(`/api/bookings/admin/all?${queryString}`);
        return res.data as AdminResponse;
      },
      placeholderData: keepPreviousData,
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

  // reset to first page when any filter changes (except page itself)
  useEffect(() => {
    setPage(1);
  }, [status, barberId, dateFrom, dateTo, q]);

  // --------- admin actions (optimistic) ----------
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/api/bookings/admin/${id}/cancel`, {});
      return res.data as { booking: AdminBooking };
    },
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: qKey });
      const prev = qc.getQueryData<AdminResponse>(qKey);
      if (prev) {
        const next: AdminResponse = {
          ...prev,
          bookings: prev.bookings.map((b) =>
            b._id === id ? { ...b, status: "cancelled" } : b
          ),
        };
        qc.setQueryData(qKey, next);
      }
      return { prev };
    },
    onSuccess: () => {
      toast.success("Booking cancelled.");
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(qKey, ctx.prev);
      toast.error(errorMessage(err));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qKey });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/api/bookings/admin/${id}/complete`, {});
      return res.data as { booking: AdminBooking };
    },
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: qKey });
      const prev = qc.getQueryData<AdminResponse>(qKey);
      if (prev) {
        const next: AdminResponse = {
          ...prev,
          bookings: prev.bookings.map((b) =>
            b._id === id ? { ...b, status: "completed" } : b
          ),
        };
        qc.setQueryData(qKey, next);
      }
      return { prev };
    },
    onSuccess: () => {
      toast.success("Booking marked as completed.");
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(qKey, ctx.prev);
      toast.error(errorMessage(err));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qKey });
    },
  });

  // --------- edit modal state ----------
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editBarberId, setEditBarberId] = useState<string>("");
  const [editServiceName, setEditServiceName] = useState<string>("");
  const [editDurationMin, setEditDurationMin] = useState<number>(30);
  const [editStartsAtLocal, setEditStartsAtLocal] = useState<string>(""); // yyyy-MM-ddTHH:mm
  const [editNotes, setEditNotes] = useState<string>("");

  function openEdit(b: AdminBooking) {
    setEditId(b._id);
    setEditBarberId(b.barber?.id ?? "");
    setEditServiceName(b.serviceName);
    setEditDurationMin(b.durationMin);
    // convert ISO -> local input value
    const d = new Date(b.startsAt);
    const pad = (n: number) => String(n).padStart(2, "0");
    const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setEditStartsAtLocal(local);
    setEditNotes(b.notes ?? ""); // ← NEW: prefill notes in edit modal
    setEditOpen(true);
  }

  const patchMutation = useMutation({
    mutationFn: async () => {
      if (!editId) return null;
      // convert local -> ISO
      const startsAt = editStartsAtLocal
        ? new Date(editStartsAtLocal).toISOString()
        : undefined;

      const patch: Record<string, unknown> = {};
      if (startsAt) patch.startsAt = startsAt;
      if (Number.isFinite(editDurationMin)) patch.durationMin = editDurationMin;
      if (editBarberId) patch.barberId = editBarberId;
      if (editServiceName.trim()) patch.serviceName = editServiceName.trim();
      if (editNotes.trim()) patch.notes = editNotes.trim();

      return patchAdminBooking(editId, patch);
    },
    onSuccess: () => {
      toast.success("Booking updated.");
      setEditOpen(false);
      setEditId(null);
      (async () => {
        await qc.invalidateQueries({ queryKey: qKey });
      })().catch(() => {});
    },
    onError: (err) => {
      toast.error(errorMessage(err));
    },
  });

  const isActing =
    cancelMutation.isPending ||
    completeMutation.isPending ||
    patchMutation.isPending;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
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

      {/* Filters */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-5 bg-white border border-neutral-200 rounded-xl p-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2"
        >
          <option value="">All statuses</option>
          <option value="booked">Booked</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={barberId}
          onChange={(e) => setBarberId(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2"
        >
          <option value="">All barbers</option>
          {barbers.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2"
          placeholder="From"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2"
          placeholder="To"
        />

        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2"
          placeholder="Search customer (name/email)"
        />
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
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const canCancel = b.status === "booked";
                const canComplete = b.status === "booked";
                return (
                  <tr
                    key={b._id}
                    className="border-t border-neutral-100 hover:bg-neutral-50 transition"
                  >
                    <td className="px-4 py-3 text-neutral-800">
                      {fmtDate(b.startsAt)}
                    </td>

                    {/* Service + Notes */}
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
                          onClick={() => openEdit(b)}
                          disabled={b.status !== "booked" || isActing}
                          className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100 disabled:opacity-50"
                          title={
                            b.status !== "booked"
                              ? "Only booked appointments can be edited"
                              : "Edit booking"
                          }
                        >
                          Edit
                        </button>
                        <button
                          disabled={!canCancel || isActing}
                          onClick={() => cancelMutation.mutate(b._id)}
                          className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100 disabled:opacity-50"
                          title="Cancel booking"
                        >
                          Cancel
                        </button>
                        <button
                          disabled={!canComplete || isActing}
                          onClick={() => completeMutation.mutate(b._id)}
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

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        title="Edit booking"
        onClose={() => setEditOpen(false)}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            patchMutation.mutate();
          }}
          className="space-y-3"
        >
          <TimeField
            value={editStartsAtLocal}
            onChange={(iso) => setEditStartsAtLocal(iso)}
            label="Starts at"
            required
          />

          <label className="block text-sm font-medium text-neutral-700">
            Duration (min)
            <input
              type="number"
              min={5}
              max={480}
              value={editDurationMin}
              onChange={(e) => setEditDurationMin(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
              required
            />
          </label>

          <label className="block text-sm font-medium text-neutral-700">
            Barber
            <select
              value={editBarberId}
              onChange={(e) => setEditBarberId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
              required
            >
              <option value="" disabled>
                Select barber…
              </option>
              {barbers.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-neutral-700">
            Service name
            <input
              type="text"
              value={editServiceName}
              onChange={(e) => setEditServiceName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
              required
            />
          </label>

          <label className="block text-sm font-medium text-neutral-700">
            Notes (optional)
            <input
              type="text"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
              placeholder="Optional note for this booking"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={patchMutation.isPending}
              className="rounded-md bg-neutral-900 text-white px-4 py-1.5 hover:bg-neutral-800 disabled:opacity-50"
            >
              {patchMutation.isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </Modal>
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
