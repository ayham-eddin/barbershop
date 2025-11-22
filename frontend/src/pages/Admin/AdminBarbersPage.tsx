import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../api/client";
import Modal from "../../components/Modal";
import { extractErrorMessage } from "../../utils/httpErrors";
import DeleteConflictPanel, {
  type ConflictBooking,
  type DeleteConflictState,
} from "../../components/admin/barbers/DeleteConflictPanel";
import AdminPageLayout from "../../components/admin/AdminPageLayout";
import PageHeader from "../../components/admin/PageHeader";
import TableContainer from "../../components/ui/TableContainer";
import ModalFooter from "../../components/admin/modals/ModalFooter";
import Input from "../../components/ui/Input";
import Checkbox from "../../components/ui/Checkbox";
import Button from "../../components/ui/Button";

type WorkingHour = {
  day: number; // 0-6
  start: string;
  end: string;
};

type Barber = {
  _id: string;
  name: string;
  specialties: string[];
  workingHours: WorkingHour[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type AdminListResponse = { barbers: Barber[] };

// Default schedule: Mon–Fri 09:00–17:00
const DEFAULT_WORKING_HOURS: WorkingHour[] = [
  { day: 1, start: "09:00", end: "17:00" },
  { day: 2, start: "09:00", end: "17:00" },
  { day: 3, start: "09:00", end: "17:00" },
  { day: 4, start: "09:00", end: "17:00" },
  { day: 5, start: "09:00", end: "17:00" },
];

const DAY_ORDER: number[] = [1, 2, 3, 4, 5, 6, 0];

const weekdayLabel = (day: number): string => {
  const map: Record<number, string> = {
    0: "Sun",
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    5: "Fri",
    6: "Sat",
  };
  return map[day] ?? String(day);
};

const AdminBarbersPage = () => {
  const qc = useQueryClient();

  // ---- load list ----
  const { data, isLoading, isError, refetch } = useQuery<AdminListResponse>({
    queryKey: ["adminBarbers"],
    queryFn: async () => {
      const res = await api.get("/api/admin/barbers");
      return res.data as AdminListResponse;
    },
    staleTime: 5_000,
  });

  const barbers = useMemo<Barber[]>(() => data?.barbers ?? [], [data]);

  // ---- create form state ----
  const [name, setName] = useState("");
  const [specialtiesInput, setSpecialtiesInput] = useState("");
  const [active, setActive] = useState(true);

  // ---- edit modal state ----
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSpecialtiesInput, setEditSpecialtiesInput] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editWorkingHours, setEditWorkingHours] = useState<WorkingHour[]>([]);

  // ---- delete conflict box state ----
  const [deleteConflict, setDeleteConflict] =
    useState<DeleteConflictState | null>(null);

  const openEdit = (b: Barber) => {
    setEditId(b._id);
    setEditName(b.name);
    setEditSpecialtiesInput(b.specialties.join(", "));
    setEditActive(b.active);
    setEditWorkingHours(b.workingHours ?? []);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditId(null);
  };

  /* ─────────────── helpers ─────────────── */

  const parseSpecialties = (val: string) =>
    val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  // working-hour helpers for edit modal
  const setDayEnabled = (day: number, enabled: boolean) => {
    setEditWorkingHours((prev) => {
      const exists = prev.find((w) => w.day === day);
      if (enabled) {
        if (exists) return prev;
        return [
          ...prev,
          {
            day: day as WorkingHour["day"],
            start: "09:00",
            end: "17:00",
          },
        ];
      }
      return prev.filter((w) => w.day !== day);
    });
  };

  const updateDayField = (
    day: number,
    field: "start" | "end",
    value: string,
  ) => {
    setEditWorkingHours((prev) => {
      const exists = prev.find((w) => w.day === day);
      if (!exists) {
        // auto-enable day if user starts typing a time
        const base: WorkingHour = {
          day: day as WorkingHour["day"],
          start: field === "start" ? value : "09:00",
          end: field === "end" ? value : "17:00",
        };
        return [...prev, base];
      }
      return prev.map((w) => (w.day === day ? { ...w, [field]: value } : w));
    });
  };

  const getDayConfig = (day: number): {
    enabled: boolean;
    start: string;
    end: string;
  } => {
    const block = editWorkingHours.find((w) => w.day === day);
    return {
      enabled: !!block,
      start: block?.start ?? "09:00",
      end: block?.end ?? "17:00",
    };
  };

  /* ─────────────── mutations ─────────────── */

  const createMut = useMutation({
    mutationFn: async (payload: {
      name: string;
      specialties: string[];
      active: boolean;
      workingHours: WorkingHour[];
    }) => {
      const res = await api.post("/api/admin/barbers", payload);
      return res.data as { barber: Barber };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminBarbers"] }).catch(() => {});
      setName("");
      setSpecialtiesInput("");
      setActive(true);
      toast.success("Barber created.");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const updateMut = useMutation({
    mutationFn: async (payload: {
      id: string;
      patch: Partial<
        Pick<Barber, "name" | "specialties" | "active" | "workingHours">
      >;
    }) => {
      const res = await api.patch(
        `/api/admin/barbers/${payload.id}`,
        payload.patch,
      );
      return res.data as { barber: Barber };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminBarbers"] }).catch(() => {});
      toast.success("Barber updated.");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/api/admin/barbers/${id}`);
      return res.data as { deleted: Barber };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminBarbers"] }).catch(() => {});
      setDeleteConflict(null);
      toast.success("Barber deleted.");
    },
    onError: (err) => {
      // Try to normalize error shape:
      const maybeData =
        (err as { response?: { data?: unknown } })?.response?.data ?? err;

      if (maybeData && typeof maybeData === "object") {
        const data = maybeData as {
          conflict_type?: string;
          barberId?: string;
          barberName?: string;
          bookings?: Array<{
            id?: string;
            _id?: string;
            startsAt?: string;
            serviceName?: string;
            userName?: string;
            userEmail?: string;
            user?: { name?: string; email?: string };
          }>;
        };

        if (data.conflict_type === "future_bookings") {
          const bookings: ConflictBooking[] = (data.bookings ?? [])
            .filter((b) => Boolean(b.startsAt))
            .map((b) => ({
              id: String(b.id ?? b._id ?? ""),
              startsAt: String(b.startsAt),
              serviceName: b.serviceName ?? "Booking",
              userName: b.userName ?? b.user?.name,
              userEmail: b.userEmail ?? b.user?.email,
            }));

          setDeleteConflict({
            barberId: data.barberId ?? "",
            barberName: data.barberName ?? "This barber",
            bookings,
          });

          toast.error("Cannot delete barber with future bookings.");
          return;
        }
      }

      // Fallback generic error
      toast.error(extractErrorMessage(err));
      console.log("DELETE BARBER ERROR 👉", err);
    },
  });

  /* ─────────────── submit handlers ─────────────── */

  const onSubmitCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name is required.");
    createMut.mutate({
      name: name.trim(),
      specialties: parseSpecialties(specialtiesInput),
      active,
      // new barbers are immediately bookable
      workingHours: DEFAULT_WORKING_HOURS,
    });
  };

  const onSubmitEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editId) return;
    if (!editName.trim()) return toast.error("Name is required.");

    // normalize working hours (drop disabled days, sort)
    const normalizedWH: WorkingHour[] = editWorkingHours
      .filter((w) => w.start && w.end)
      .map((w) => ({
        day: w.day,
        start: w.start.slice(0, 5),
        end: w.end.slice(0, 5),
      }))
      .sort((a, b) => a.day - b.day);

    updateMut.mutate(
      {
        id: editId,
        patch: {
          name: editName.trim(),
          specialties: parseSpecialties(editSpecialtiesInput),
          active: editActive,
          workingHours: normalizedWH,
        },
      },
      {
        onSuccess: () => {
          closeEdit();
        },
      },
    );
  };

  /* ─────────────── UI ─────────────── */

  return (
    <AdminPageLayout>
      <PageHeader
        title="Manage Barbers"
        onRefresh={() => refetch()}
        loading={isLoading}
      />

      {/* Create form (using shared UI components) */}
      <form
        onSubmit={onSubmitCreate}
        className="bg-white border border-neutral-200 rounded-xl p-4"
      >
        <div className="grid gap-3 sm:grid-cols-4">
          <Input
            placeholder="Barber name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            placeholder="Specialties (comma separated)"
            value={specialtiesInput}
            onChange={(e) => setSpecialtiesInput(e.target.value)}
          />

          <div className="flex items-center">
            <Checkbox
              label="Active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
          </div>

          <div className="flex items-center">
            <Button
              type="submit"
              loading={createMut.isPending}
              className="w-full sm:w-auto bg-amber-400 text-neutral-900 hover:bg-amber-300"
            >
              {createMut.isPending ? "Adding…" : "Add Barber"}
            </Button>
          </div>
        </div>
      </form>

      {isLoading && (
        <div className="text-center text-neutral-500 py-12">Loading…</div>
      )}
      {isError && (
        <div className="text-center text-rose-600 bg-rose-50 border border-rose-200 rounded-lg py-4">
          Failed to load barbers.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <TableContainer>
            <table className="min-w-full text-sm text-left">
              <thead className="bg-neutral-100 text-neutral-700 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Specialties</th>
                  <th className="px-4 py-3">Working hours</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {barbers.map((b) => (
                  <tr
                    key={b._id}
                    className="border-t border-neutral-100 hover:bg-neutral-50 transition"
                  >
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {b.name}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {b.specialties.length ? b.specialties.join(", ") : "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 align-top">
                      {b.workingHours && b.workingHours.length ? (
                        <div className="flex flex-col gap-0.5 text-xs sm:text-sm">
                          {b.workingHours
                            .slice()
                            .sort((a, b2) => a.day - b2.day)
                            .map((wh) => (
                              <span
                                key={`${b._id}-${wh.day}-${wh.start}-${wh.end}`}
                                className="whitespace-nowrap"
                              >
                                <span className="font-medium">
                                  {weekdayLabel(wh.day)}
                                </span>{" "}
                                {wh.start}–{wh.end}
                              </span>
                            ))}
                        </div>
                      ) : (
                        "Not set"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${
                          b.active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-neutral-50 text-neutral-600 border-neutral-200"
                        }`}
                      >
                        {b.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          updateMut.mutate({
                            id: b._id,
                            patch: { active: !b.active },
                          })
                        }
                        disabled={updateMut.isPending}
                      >
                        {b.active ? "Set inactive" : "Set active"}
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEdit(b)}
                      >
                        Edit
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteMut.mutate(b._id)}
                        disabled={deleteMut.isPending}
                        title="Delete barber (only allowed if no future bookings)"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}

                {barbers.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-neutral-500"
                    >
                      No barbers yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableContainer>

          {/* Conflict box when delete fails because of future bookings */}
          {deleteConflict && (
            <DeleteConflictPanel
              conflict={deleteConflict}
              onClose={() => setDeleteConflict(null)}
            />
          )}
        </>
      )}

      {/* Edit modal */}
      <Modal
        open={editOpen}
        title="Edit barber"
        onClose={closeEdit}
        footer={
          <ModalFooter
            onCancel={closeEdit}
            submitting={updateMut.isPending}
            submitLabel="Save changes"
          />
        }
      >
        <form
          id="edit-barber-form"
          onSubmit={onSubmitEdit}
          className="space-y-3"
        >
          <Input
            label="Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />

          <Input
            label="Specialties (comma separated)"
            value={editSpecialtiesInput}
            onChange={(e) => setEditSpecialtiesInput(e.target.value)}
          />

          <Checkbox
            label="Active"
            checked={editActive}
            onChange={(e) => setEditActive(e.target.checked)}
          />

          {/* Working hours editor */}
          <div className="mt-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-neutral-800">
                Working hours
              </p>
              <p className="text-[11px] text-neutral-500">
                Uncheck a day to mark it as closed.
              </p>
            </div>

            <div className="mt-2 space-y-1.5">
              {DAY_ORDER.map((day) => {
                const cfg = getDayConfig(day);
                return (
                  <div key={day} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      label={weekdayLabel(day)}
                      checked={cfg.enabled}
                      onChange={(e) => setDayEnabled(day, e.target.checked)}
                    />

                    <Input
                      type="time"
                      value={cfg.start}
                      onChange={(e) =>
                        updateDayField(day, "start", e.target.value)
                      }
                      disabled={!cfg.enabled}
                      className="w-24 text-xs"
                    />

                    <span className="text-neutral-500 text-xs">–</span>

                    <Input
                      type="time"
                      value={cfg.end}
                      onChange={(e) =>
                        updateDayField(day, "end", e.target.value)
                      }
                      disabled={!cfg.enabled}
                      className="w-24 text-xs"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      </Modal>
    </AdminPageLayout>
  );
};

export default AdminBarbersPage;
