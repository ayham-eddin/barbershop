import { useEffect, useMemo, useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import api from "../../api/client";
import { patchAdminBooking } from "../../api/adminBookings";
import toast from "react-hot-toast";
import { errorMessage } from "../../lib/errors";
import {
  localInputToUtcIso,
  isoToLocalInput,
} from "../../utils/datetime";
import { adminMarkNoShow } from "../../api/bookings";
import CalendarGrid, {
  type Booking as CalBooking,
} from "../../components/CalendarGrid";
import AdminBookingEditModal from "../../components/admin/AdminBookingEditModal";
import AdminCalendarSkeleton from "../../components/admin/AdminCalendarSkeleton";
import AdminBookingsTable from "../../components/admin/AdminBookingsTable";

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

const ymd = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
const addDays = (d: Date, n: number) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

/* ========================= Component ============================= */

const AdminBookingsPage = () => {
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();

  const workingHours = { startHour: 9, endHour: 19 };

  // Day shown in the calendar
  const [viewDate, setViewDate] = useState<Date>(() => new Date());

  // Date range for which bookings are fetched / listed in the table
  const [listFrom, setListFrom] = useState<Date>(() => new Date());
  const [listTo, setListTo] = useState<Date>(() => new Date());

  // Filters (list + query)
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");
  const [barberId, setBarberId] = useState<string>("");
  const [q, setQ] = useState<string>("");

  // Show / hide day calendar + list range filters
  const [showCalendar, setShowCalendar] = useState<boolean>(true);
  const [showRangeFilters, setShowRangeFilters] = useState<boolean>(false);

  // ---------- Sync from URL on first render ----------
  useEffect(() => {
    const barberFromUrl = searchParams.get("barberId");
    const dateFromUrl = searchParams.get("date");

    if (barberFromUrl) setBarberId(barberFromUrl);

    if (dateFromUrl) {
      const d = new Date(dateFromUrl);
      if (!Number.isNaN(d.getTime())) {
        setViewDate(d);
        setListFrom(d);
        setListTo(d);
        return;
      }
    }

    // Fallback: today for everything
    const today = new Date();
    setViewDate(today);
    setListFrom(today);
    setListTo(today);
  }, [searchParams]);

  // Helper: when user changes view day, keep list range in sync
  const setViewDateAndSync = (d: Date) => {
    setViewDate(d);
    setListFrom(d);
    setListTo(d);
  }

  // ---------- Derived start/end for calendar ----------
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

  // barbers for dropdown/edit
  const [barbers, setBarbers] = useState<Barber[]>([]);
  useEffect(() => {
    (async () => {
      const res = await api.get<{ barbers: Barber[] }>("/api/barbers");
      setBarbers(res.data.barbers);
    })().catch(() => setBarbers([]));
  }, []);

  const selectedBarber = useMemo(
    () => barbers.find((b) => b._id === barberId) ?? null,
    [barbers, barberId]
  );

  // ---------- Query string for admin bookings ----------
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "50"); // fetch enough for the view
    if (status) params.set("status", status);
    if (barberId) params.set("barberId", barberId);

    // Use list range for backend filtering (table + calendar data source)
    params.set("dateFrom", ymd(listFrom));
    params.set("dateTo", ymd(listTo));

    if (q.trim()) params.set("q", q.trim());
    return params.toString();
  }, [page, status, barberId, listFrom, listTo, q]);

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

  const bookings: AdminBooking[] = useMemo(
    () => data?.bookings ?? [],
    [data]
  );
  const curPage = data?.page ?? page;
  const totalPages = data?.pages ?? 1;

  useEffect(() => {
    setPage(1);
  }, [status, barberId, q, listFrom, listTo, viewDate]);

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

  const openEdit = (b: AdminBooking) => {
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

  const today = new Date();
  const isToday = ymd(viewDate) === ymd(today);
  const nowForCalendar = isToday ? today : undefined;
  const calendarSubtitle = selectedBarber
    ? `Barber: ${selectedBarber.name}`
    : "All barbers";

  /* ------------------------------ UI ------------------------------ */

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header with actions (responsive) */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900">
          Admin Bookings
        </h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowCalendar((v) => !v)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-xs sm:text-sm font-medium text-neutral-800 hover:bg-neutral-100 transition"
          >
            {showCalendar ? "Hide day view" : "Show day view"}
          </button>
          <button
            type="button"
            onClick={() => setShowRangeFilters((v) => !v)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-xs sm:text-sm font-medium text-neutral-800 hover:bg-neutral-100 transition"
          >
            {showRangeFilters ? "Hide list range" : "Show list range"}
          </button>
          <button
            onClick={() => refetch()}
            className="rounded-lg bg-neutral-900 text-white px-4 py-2 text-xs sm:text-sm font-medium hover:bg-neutral-800 transition disabled:opacity-60"
            disabled={isFetching}
          >
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Top filters */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-6 bg-white border border-neutral-200 rounded-xl p-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
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
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">All barbers</option>
          {barbers.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>

        {/* Day controls (calendar view) */}
        <div className="col-span-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-100"
            onClick={() => setViewDateAndSync(addDays(viewDate, -1))}
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
              setViewDateAndSync(d);
            }}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm flex-1 min-w-[120px]"
          />
          <button
            type="button"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-100"
            onClick={() => setViewDateAndSync(new Date())}
            title="Today"
          >
            Today
          </button>
          <button
            type="button"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-100"
            onClick={() => setViewDateAndSync(addDays(viewDate, +1))}
            title="Next day"
          >
            →
          </button>
        </div>

        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          placeholder="Search customer (name/email)"
        />

        <button
          onClick={() => {
            const todayDate = new Date();
            setStatus("");
            setBarberId("");
            setQ("");
            setViewDateAndSync(todayDate);
          }}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-100"
        >
          Reset
        </button>
      </div>

      {/* List range controls */}
      {showRangeFilters && (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-3 bg-white border border-neutral-200 rounded-xl p-4 text-xs text-neutral-700">
          <div className="flex flex-col gap-1">
            <span className="font-medium">From (list range)</span>
            <input
              type="date"
              value={ymd(listFrom)}
              onChange={(e) => {
                const d = e.target.value
                  ? new Date(e.target.value)
                  : new Date();
                // Ensure from <= to
                if (d > listTo) {
                  setListFrom(d);
                  setListTo(d);
                } else {
                  setListFrom(d);
                }
              }}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-medium">To (list range)</span>
            <input
              type="date"
              value={ymd(listTo)}
              onChange={(e) => {
                const d = e.target.value
                  ? new Date(e.target.value)
                  : new Date();
                // Ensure from <= to
                if (d < listFrom) {
                  setListFrom(d);
                  setListTo(d);
                } else {
                  setListTo(d);
                }
              }}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <p className="self-center md:text-left text-center text-[11px] text-neutral-500">
            This range controls which bookings appear in the table below (and in
            the optional day view, as long as the selected day falls within the
            range).
          </p>
        </div>
      )}

      {/* Table + pagination (moved to component) */}
      <AdminBookingsTable
        bookings={bookings}
        isLoading={isLoading}
        isError={isError}
        isActing={isActing}
        curPage={curPage}
        totalPages={totalPages}
        onPageChange={setPage}
        onEdit={(b) => openEdit(b)}
        onCancel={(id) => cancelMutation.mutate(id)}
        onNoShow={(id) => noShowMutation.mutate(id)}
        onComplete={(id) => completeMutation.mutate(id)}
      />

      {/* Optional day view calendar */}
      {showCalendar && (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4">
          {isLoading ? (
            <AdminCalendarSkeleton />
          ) : (
            <CalendarGrid
              bookings={calendarEvents}
              startDate={startDate}
              endDate={endDate}
              workingHours={workingHours}
              now={nowForCalendar}
              subtitle={calendarSubtitle}
              onEventClick={(ev) => {
                const b = bookings.find((x) => x._id === ev.id);
                if (b) openEdit(b);
              }}
              onEmptySlotClick={(dt) => {
                const sameDayBookings = bookings.filter(
                  (b) => b.startsAt.slice(0, 10) === ymd(viewDate)
                );

                const seed =
                  sameDayBookings.find(
                    (b) => barberId && b.barber?.id === barberId
                  ) ?? sameDayBookings[0];

                setEditId(seed?._id ?? null);
                setEditBarberId(barberId || seed?.barber?.id || "");
                setEditServiceName(seed?.serviceName ?? "");
                setEditDurationMin(seed?.durationMin ?? 30);
                setEditStartsAtLocal(isoToLocalInput(dt.toISOString()));
                setEditNotes("");
                setEditOpen(true);
              }}
            />
          )}
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
export default AdminBookingsPage;
