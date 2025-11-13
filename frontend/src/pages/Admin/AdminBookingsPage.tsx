// frontend/src/pages/Admin/AdminBookingsPage.tsx

import { useEffect, useMemo, useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import api from "../../api/client";
import { patchAdminBooking } from "../../api/adminBookings";
import toast from "react-hot-toast";
import { errorMessage } from "../../lib/errors";
import {
  formatBerlin,
  localInputToUtcIso,
  isoToLocalInput,
} from "../../utils/datetime";
import { adminMarkNoShow } from "../../api/bookings";
import CalendarGrid, {
  type Booking as CalBooking,
} from "../../components/CalendarGrid";
import StatusBadge from "../../components/StatusBadge";
import AdminBookingEditModal from "../../components/admin/AdminBookingEditModal";

/* ----------------------------- Types ----------------------------- */

interface AdminBooking {
  _id: string;
  serviceName: string;
  durationMin: number;
  startsAt: string; // ISO
  endsAt: string; // ISO
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

/* ------------------------- Date helpers -------------------------- */

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function addDays(d: Date, n: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

/* ========================= Component ============================= */

export default function AdminBookingsPage() {
  const qc = useQueryClient();

  // Day-view navigation
  const [viewDate, setViewDate] = useState<Date>(() => new Date());
  const workingHours = { startHour: 9, endHour: 19 };

  const startDate = useMemo(
    () =>
      new Date(
        `${ymd(viewDate)}T${String(workingHours.startHour).padStart(
          2,
          "0"
        )}:00:00`
      ),
    [viewDate, workingHours.startHour]
  );
  const endDate = useMemo(
    () =>
      new Date(
        `${ymd(viewDate)}T${String(workingHours.endHour).padStart(
          2,
          "0"
        )}:00:00`
      ),
    [viewDate, workingHours.endHour]
  );

  // filters (list + query)
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");
  const [barberId, setBarberId] = useState<string>("");
  const [q, setQ] = useState<string>("");

  // barbers for dropdown/edit
  const [barbers, setBarbers] = useState<Barber[]>([]);
  useEffect(() => {
    (async () => {
      const res = await api.get<{ barbers: Barber[] }>("/api/barbers");
      setBarbers(res.data.barbers);
    })().catch(() => setBarbers([]));
  }, []);

  // query string
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "50"); // fetch enough for the day
    if (status) params.set("status", status);
    if (barberId) params.set("barberId", barberId);
    // bind to the selected day
    params.set("dateFrom", ymd(viewDate));
    params.set("dateTo", ymd(viewDate));
    if (q.trim()) params.set("q", q.trim());
    return params.toString();
  }, [page, status, barberId, viewDate, q]);

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

  const fmtDate = (iso: string) => formatBerlin(iso);
  const bookings: AdminBooking[] = useMemo(
    () => data?.bookings ?? [],
    [data]
  );
  const curPage = data?.page ?? page;
  const totalPages = data?.pages ?? 1;

  useEffect(() => {
    setPage(1);
  }, [status, barberId, viewDate, q]);

  /* ---------------------- Admin mutations ----------------------- */

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/api/bookings/admin/${id}/cancel`, {});
      return res.data as { booking: AdminBooking };
    },
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: qKey });
      const prev = qc.getQueryData<AdminResponse>(qKey);
      if (prev) {
        qc.setQueryData<AdminResponse>(qKey, {
          ...prev,
          bookings: prev.bookings.map((b) =>
            b._id === id ? { ...b, status: "cancelled" } : b
          ),
        });
      }
      return { prev };
    },
    onSuccess: () => toast.success("Booking cancelled."),
    onError: (err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(qKey, ctx.prev);
      toast.error(errorMessage(err));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qKey }),
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
        qc.setQueryData<AdminResponse>(qKey, {
          ...prev,
          bookings: prev.bookings.map((b) =>
            b._id === id ? { ...b, status: "completed" } : b
          ),
        });
      }
      return { prev };
    },
    onSuccess: () => toast.success("Booking marked as completed."),
    onError: (err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(qKey, ctx.prev);
      toast.error(errorMessage(err));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qKey }),
  });

  const noShowMutation = useMutation({
    mutationFn: async (id: string) => adminMarkNoShow(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: qKey });
      const prev = qc.getQueryData<AdminResponse>(qKey);
      if (prev) {
        qc.setQueryData<AdminResponse>(qKey, {
          ...prev,
          bookings: prev.bookings.map((b) =>
            b._id === id ? { ...b, status: "no_show" } : b
          ),
        });
      }
      return { prev };
    },
    onSuccess: () => toast.success("Marked as no-show."),
    onError: (err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(qKey, ctx.prev);
      toast.error(errorMessage(err));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qKey }),
  });

  /* ------------------------- Edit modal -------------------------- */

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editBarberId, setEditBarberId] = useState<string>("");
  const [editServiceName, setEditServiceName] = useState<string>("");
  const [editDurationMin, setEditDurationMin] = useState<number>(30);
  const [editStartsAtLocal, setEditStartsAtLocal] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");

  function openEdit(b: AdminBooking) {
    setEditId(b._id);
    setEditBarberId(b.barber?.id ?? "");
    setEditServiceName(b.serviceName);
    setEditDurationMin(b.durationMin);
    setEditStartsAtLocal(isoToLocalInput(b.startsAt));
    setEditNotes(b.notes ?? "");
    setEditOpen(true);
  }

  const patchMutation = useMutation({
    mutationFn: async () => {
      if (!editId) return null;
      const startsAt = editStartsAtLocal
        ? localInputToUtcIso(editStartsAtLocal)
        : undefined;

      const patch: Record<string, unknown> = {};
      if (startsAt) patch.startsAt = startsAt;
      if (Number.isFinite(editDurationMin)) patch.durationMin = editDurationMin;
      if (editBarberId) patch.barberId = editBarberId;
      if (editServiceName.trim())
        patch.serviceName = editServiceName.trim();
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
    onError: (err) => toast.error(errorMessage(err)),
  });

  const isActing =
    cancelMutation.isPending ||
    completeMutation.isPending ||
    noShowMutation.isPending ||
    patchMutation.isPending;

  /* ------------------- Calendar-mapped events --------------------- */

  const calendarEvents: CalBooking[] = useMemo(
    () =>
      bookings
        .filter((b) => b.startsAt.slice(0, 10) === ymd(viewDate))
        .map<CalBooking>((b) => ({
          id: b._id,
          start: new Date(b.startsAt),
          end: new Date(b.endsAt),
          status: b.status,
          label: b.serviceName,
        })),
    [bookings, viewDate]
  );

  /* ------------------------------ UI ------------------------------ */

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Admin Bookings
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
      <div className="grid gap-3 grid-cols-1 md:grid-cols-6 bg-white border border-neutral-200 rounded-xl p-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2"
        >
          <option value="">All statuses</option>
          <option value="booked">Booked</option>
          <option value="rescheduled">Rescheduled</option>
          <option value="no_show">No-Show</option>
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

        {/* Day controls */}
        <div className="col-span-2 flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-neutral-300 px-3 py-2 hover:bg-neutral-100"
            onClick={() => setViewDate((d) => addDays(d, -1))}
            title="Previous day"
          >
            ←
          </button>
          <input
            type="date"
            value={ymd(viewDate)}
            onChange={(e) => {
              const d = e.target.value
                ? new Date(e.target.value)
                : new Date();
              setViewDate(d);
            }}
            className="rounded-lg border border-neutral-300 px-3 py-2 w-full"
          />
          <button
            type="button"
            className="rounded-lg border border-neutral-300 px-3 py-2 hover:bg-neutral-100"
            onClick={() => setViewDate(new Date())}
            title="Today"
          >
            Today
          </button>
          <button
            type="button"
            className="rounded-lg border border-neutral-300 px-3 py-2 hover:bg-neutral-100"
            onClick={() => setViewDate((d) => addDays(d, +1))}
            title="Next day"
          >
            →
          </button>
        </div>

        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2"
          placeholder="Search customer (name/email)"
        />

        <button
          onClick={() => {
            setStatus("");
            setBarberId("");
            setQ("");
            setViewDate(new Date());
          }}
          className="rounded-lg border border-neutral-300 px-3 py-2 hover:bg-neutral-100"
        >
          Reset
        </button>
      </div>

      {/* Calendar (day view) */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4">
        <CalendarGrid
          bookings={calendarEvents}
          startDate={startDate}
          endDate={endDate}
          workingHours={workingHours}
          onEventClick={(ev) => {
            const b = bookings.find((x) => x._id === ev.id);
            if (b) openEdit(b);
          }}
          onEmptySlotClick={(dt) => {
            // Pre-fill with the first booking of the day (if available)
            const seed = bookings.find(
              (b) => b.startsAt.slice(0, 10) === ymd(viewDate)
            );
            setEditId(seed?._id ?? null);
            setEditBarberId(seed?.barber?.id ?? "");
            setEditServiceName(seed?.serviceName ?? "");
            setEditDurationMin(seed?.durationMin ?? 30);
            setEditStartsAtLocal(isoToLocalInput(dt.toISOString()));
            setEditNotes("");
            setEditOpen(true);
          }}
        />
      </div>

      {/* Optional list/table below (kept for parity with earlier UI) */}
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
                      {fmtDate(b.startsAt)}
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
                          onClick={() => openEdit(b)}
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
                          onClick={() => cancelMutation.mutate(b._id)}
                          className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100 disabled:opacity-50"
                          title="Cancel booking"
                        >
                          Cancel
                        </button>
                        <button
                          disabled={!canNoShow || isActing}
                          onClick={() => noShowMutation.mutate(b._id)}
                          className="rounded-md border border-rose-300 text-rose-800 px-3 py-1.5 hover:bg-rose-50 disabled:opacity-50"
                          title="Mark no-show (adds a warning; blocks at 2)"
                        >
                          No-Show
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
      <AdminBookingEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        barbers={barbers}
        startsAtLocal={editStartsAtLocal}
        onChangeStartsAtLocal={setEditStartsAtLocal}
        durationMin={editDurationMin}
        onChangeDurationMin={(value) => setEditDurationMin(value)}
        barberId={editBarberId}
        onChangeBarberId={setEditBarberId}
        serviceName={editServiceName}
        onChangeServiceName={setEditServiceName}
        notes={editNotes}
        onChangeNotes={setEditNotes}
        onSubmit={() => {
          patchMutation.mutate();
        }}
        isSubmitting={patchMutation.isPending}
      />
    </div>
  );
}
