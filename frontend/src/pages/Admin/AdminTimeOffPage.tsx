// src/pages/Admin/AdminTimeOffPage.tsx
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

// NEW UI COMPONENTS
import Select from "../../components/ui/Select";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import FormGrid from "../../components/ui/FormGrid";
import PageHeader from "../../components/admin/PageHeader";
import AdminPageLayout from "../../components/admin/AdminPageLayout";

type Barber = { _id: string; name: string };

function toISO(dtLocal: string): string {
  const d = new Date(dtLocal);
  return d.toISOString();
}

const AdminTimeOffPage = () => {
  const qc = useQueryClient();

  // ---------- Load Barbers ----------
  const barbersQ = useQuery({
    queryKey: ["barbers"],
    queryFn: async () => {
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

  // ---------- Load Time-Off ----------
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

  // ---------- Create Form State ----------
  const [form, setForm] = useState<{
    barberId: string;
    start: string;
    end: string;
    reason: string;
  }>({ barberId: "", start: "", end: "", reason: "" });

  useEffect(() => {
    setForm((f) => ({ ...f, barberId: selectedBarber || f.barberId }));
  }, [selectedBarber]);

  // ---------- Create Mutation ----------
  const createMut = useMutation({
    mutationFn: async () => {
      const { barberId, start, end, reason } = form;

      if (!barberId) throw new Error("Select a barber");
      if (!start || !end) throw new Error("Start and end required");

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
    onSuccess: () => {
      toast.success("Time-off created.");
      setForm((f) => ({ ...f, start: "", end: "", reason: "" }));
      qc.invalidateQueries({ queryKey: ["admin-timeoff"] }).catch(() => {});
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  // ---------- Delete Mutation ----------
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
    onSuccess: () => toast.success("Time-off removed."),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin-timeoff"] }).catch(() => {});
    },
  });

  // ---------- UI ----------
  return (
    <AdminPageLayout>
      <PageHeader
        title="Time Off"
        onRefresh={() => timeoffQ.refetch()}
        loading={timeoffQ.isFetching}
      />

      {/* Create + Filter Form */}
      <FormGrid columns={4} className="shadow-sm">
        <Select
          label="Barber"
          value={selectedBarber}
          onChange={(e) => setSelectedBarber(e.target.value)}
        >
          {(barbersQ.data ?? []).map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </Select>

        <Input
          label="Start"
          type="datetime-local"
          value={form.start}
          onChange={(e) =>
            setForm((f) => ({ ...f, start: e.target.value }))
          }
        />

        <Input
          label="End"
          type="datetime-local"
          value={form.end}
          onChange={(e) =>
            setForm((f) => ({ ...f, end: e.target.value }))
          }
        />

        <Input
          label="Reason (optional)"
          value={form.reason}
          maxLength={200}
          placeholder="e.g., vacation"
          onChange={(e) =>
            setForm((f) => ({ ...f, reason: e.target.value }))
          }
        />
      </FormGrid>

      <div className="flex justify-end">
        <Button
          variant="primary"
          className="mt-2"
          loading={createMut.isPending}
          disabled={!form.start || !form.end || !form.barberId}
          onClick={() => createMut.mutate()}
        >
          Add time-off
        </Button>
      </div>

      {/* Table */}
      <AdminTimeOffTable
        items={timeoffQ.data ?? []}
        barberMap={barberMap}
        isLoading={timeoffQ.isLoading}
        isError={timeoffQ.isError ?? false}
        isRemoving={delMut.isPending}
        onRemove={(id) => delMut.mutate(id)}
      />
    </AdminPageLayout>
  );
};

export default AdminTimeOffPage;
