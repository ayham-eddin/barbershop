import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";
import {
  createTimeOff,
  deleteTimeOff,
  listTimeOff,
  type TimeOff,
} from "../../api/timeoff";
import toast from "react-hot-toast";
import { errorMessage } from "../../lib/errors";
import AdminTimeOffTable from "../../components/admin/timeoff/AdminTimeOffTable";

type Barber = { _id: string; name: string };

function toISO(dtLocal: string): string {
  // dtLocal like "2025-11-12T09:00"
  // Treat as local and convert to ISO
  const d = new Date(dtLocal);
  return d.toISOString();
}

const AdminTimeOffPage = () => {
  const qc = useQueryClient();

  // Load barbers for select
  const barbersQ = useQuery({
    queryKey: ["barbers"],
    queryFn: async () => {
      // Public list endpoint is assumed (/api/barbers). If you have admin-only, switch URL.
      const { data } = await api.get<{ barbers: Barber[] }>("/api/barbers");
      return data.barbers ?? [];
    },
    staleTime: 30_000,
  });

  const [selectedBarber, setSelectedBarber] = useState<string>("");
  useEffect(() => {
    if (!selectedBarber && barbersQ.data && barbersQ.data.length > 0) {
      setSelectedBarber(barbersQ.data[0]._id);
    }
  }, [barbersQ.data, selectedBarber]);

  // Time-off list (optionally filter by barber)
  const timeoffQ = useQuery({
    queryKey: ["admin-timeoff", selectedBarber || "all"],
    queryFn: () =>
      listTimeOff(selectedBarber ? { barberId: selectedBarber } : {}),
    enabled: true,
    staleTime: 10_000,
  });

  const barberMap = useMemo(() => {
    const m = new Map<string, string>();
    (barbersQ.data ?? []).forEach((b) => m.set(b._id, b.name));
    return m;
  }, [barbersQ.data]);

  // Form state
  const [form, setForm] = useState<{
    barberId: string;
    start: string;
    end: string;
    reason: string;
  }>({ barberId: "", start: "", end: "", reason: "" });

  useEffect(() => {
    setForm((f) => ({ ...f, barberId: selectedBarber || f.barberId }));
  }, [selectedBarber]);

  // Create mutation
  const createMut = useMutation({
    mutationFn: async () => {
      const { barberId, start, end, reason } = form;
      if (!barberId) throw new Error("Select a barber");
      if (!start || !end) throw new Error("Start and end are required");
      const startIso = toISO(start);
      const endIso = toISO(end);
      if (new Date(endIso) <= new Date(startIso))
        throw new Error("End must be after start");

      return createTimeOff({
        barberId,
        start: startIso,
        end: endIso,
        reason: reason.trim() || undefined,
      });
    },
    onMutate: async () => {
      await qc.cancelQueries({
        queryKey: ["admin-timeoff", selectedBarber || "all"],
      });
    },
    onSuccess: () => {
      toast.success("Time-off created.");
      setForm((f) => ({ ...f, start: "", end: "", reason: "" }));
      qc.invalidateQueries({ queryKey: ["admin-timeoff"] }).catch(() => {});
    },
    onError: (err) => {
      toast.error(errorMessage(err));
    },
  });

  // Delete mutation
  const delMut = useMutation({
    mutationFn: async (id: string) => deleteTimeOff(id),
    onMutate: async (id) => {
      await qc.cancelQueries({
        queryKey: ["admin-timeoff", selectedBarber || "all"],
      });
      const prev = qc.getQueryData<TimeOff[]>([
        "admin-timeoff",
        selectedBarber || "all",
      ]);
      if (prev) {
        qc.setQueryData<TimeOff[]>(
          ["admin-timeoff", selectedBarber || "all"],
          prev.filter((t) => t._id !== id),
        );
      }
      return { prev };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev)
        qc.setQueryData(
          ["admin-timeoff", selectedBarber || "all"],
          ctx.prev,
        );
      toast.error(errorMessage(err));
    },
    onSuccess: () => {
      toast.success("Time-off removed.");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin-timeoff"] }).catch(() => {});
    },
  });

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Time off</h1>
        <button
          className="rounded-lg bg-neutral-900 text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800 transition disabled:opacity-60"
          onClick={() => timeoffQ.refetch()}
          disabled={timeoffQ.isFetching}
        >
          {timeoffQ.isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {/* Filter + Create */}
      <div className="rounded-2xl bg-white border border-neutral-200 p-5 shadow-sm space-y-4">
        <div className="grid sm:grid-cols-4 gap-3">
          <label className="block text-sm font-medium text-neutral-700">
            Barber
            <select
              value={selectedBarber}
              onChange={(e) => setSelectedBarber(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            >
              {(barbersQ.data ?? []).map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-neutral-700">
            Start
            <input
              type="datetime-local"
              value={form.start}
              onChange={(e) =>
                setForm((f) => ({ ...f, start: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </label>

          <label className="block text-sm font-medium text-neutral-700">
            End
            <input
              type="datetime-local"
              value={form.end}
              onChange={(e) =>
                setForm((f) => ({ ...f, end: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            />
          </label>

          <label className="block text-sm font-medium text-neutral-700">
            Reason (optional)
            <input
              type="text"
              value={form.reason}
              maxLength={200}
              onChange={(e) =>
                setForm((f) => ({ ...f, reason: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
              placeholder="e.g., vacation"
            />
          </label>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => createMut.mutate()}
            disabled={
              createMut.isPending ||
              !form.start ||
              !form.end ||
              !form.barberId
            }
            className="rounded-md bg-amber-500 text-neutral-900 px-4 py-2 hover:bg-amber-400 disabled:opacity-50"
          >
            {createMut.isPending ? "Adding…" : "Add time-off"}
          </button>
        </div>
      </div>

      {/* List */}
      <AdminTimeOffTable
        items={timeoffQ.data ?? []}
        barberMap={barberMap}
        isLoading={timeoffQ.isLoading}
        isError={timeoffQ.isError ?? false}
        isRemoving={delMut.isPending}
        onRemove={(id) => delMut.mutate(id)}
      />
    </div>
  );
}
export default AdminTimeOffPage;
