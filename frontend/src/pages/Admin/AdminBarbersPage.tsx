// frontend/src/pages/Admin/AdminBarbersPage.tsx
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/client';
import Modal from '../../components/Modal';
import { formatBerlin } from '../../utils/datetime';

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

// For the “cannot delete; future bookings” box
type ConflictBooking = {
  id: string;
  startsAt: string;
  serviceName: string;
  userName?: string;
  userEmail?: string;
};

type DeleteConflictState = {
  barberId: string;
  barberName: string;
  bookings: ConflictBooking[];
};

// Default schedule: Mon–Fri 09:00–17:00
const DEFAULT_WORKING_HOURS: WorkingHour[] = [
  { day: 1, start: '09:00', end: '17:00' },
  { day: 2, start: '09:00', end: '17:00' },
  { day: 3, start: '09:00', end: '17:00' },
  { day: 4, start: '09:00', end: '17:00' },
  { day: 5, start: '09:00', end: '17:00' },
];

function weekdayLabel(day: number): string {
  const map: Record<number, string> = {
    0: 'Sun',
    1: 'Mon',
    2: 'Tue',
    3: 'Wed',
    4: 'Thu',
    5: 'Fri',
    6: 'Sat',
  };
  return map[day] ?? String(day);
}

function formatWorkingHours(blocks: WorkingHour[]): string {
  if (!blocks.length) return 'Not set';
  return blocks
    .sort((a, b) => a.day - b.day)
    .map((b) => `${weekdayLabel(b.day)} ${b.start}–${b.end}`)
    .join(', ');
}

export default function AdminBarbersPage() {
  const qc = useQueryClient();

  // ---- load list ----
  const { data, isLoading, isError, refetch } = useQuery<AdminListResponse>({
    queryKey: ['adminBarbers'],
    queryFn: async () => {
      const res = await api.get('/api/admin/barbers');
      return res.data as AdminListResponse;
    },
    staleTime: 5_000,
  });

  const barbers = useMemo<Barber[]>(() => data?.barbers ?? [], [data]);

  // ---- create form state ----
  const [name, setName] = useState('');
  const [specialtiesInput, setSpecialtiesInput] = useState('');
  const [active, setActive] = useState(true);

  // ---- edit modal state ----
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSpecialtiesInput, setEditSpecialtiesInput] = useState('');
  const [editActive, setEditActive] = useState(true);

  // ---- delete conflict box state ----
  const [deleteConflict, setDeleteConflict] = useState<DeleteConflictState | null>(null);

  function openEdit(b: Barber) {
    setEditId(b._id);
    setEditName(b.name);
    setEditSpecialtiesInput(b.specialties.join(', '));
    setEditActive(b.active);
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditId(null);
  }

  const errorMessage = (e: unknown) => {
    const def = 'Request failed';
    if (typeof e === 'string') return e;
    if (e && typeof e === 'object' && 'response' in e) {
      const ax = e as {
        response?: { data?: { error?: string; message?: string } };
        message?: string;
      };
      return (
        ax.response?.data?.error ??
        ax.response?.data?.message ??
        ax.message ??
        def
      );
    }
    if (e && typeof e === 'object' && 'error' in e) {
      const data = e as { error?: string; message?: string };
      return data.error ?? data.message ?? def;
    }
    return def;
  };

  /* ─────────────── helpers ─────────────── */

  const parseSpecialties = (val: string) =>
    val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const isoToYmd = (iso: string) => iso.slice(0, 10);

  /* ─────────────── mutations ─────────────── */

  const createMut = useMutation({
    mutationFn: async (payload: {
      name: string;
      specialties: string[];
      active: boolean;
      workingHours: WorkingHour[];
    }) => {
      const res = await api.post('/api/admin/barbers', payload);
      return res.data as { barber: Barber };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminBarbers'] }).catch(() => {});
      setName('');
      setSpecialtiesInput('');
      setActive(true);
      toast.success('Barber created.');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const updateMut = useMutation({
    mutationFn: async (payload: {
      id: string;
      patch: Partial<Pick<Barber, 'name' | 'specialties' | 'active'>>;
    }) => {
      const res = await api.patch(
        `/api/admin/barbers/${payload.id}`,
        payload.patch,
      );
      return res.data as { barber: Barber };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminBarbers'] }).catch(() => {});
      toast.success('Barber updated.');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/api/admin/barbers/${id}`);
      return res.data as { deleted: Barber };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminBarbers'] }).catch(() => {});
      setDeleteConflict(null);
      toast.success('Barber deleted.');
    },
    onError: (err) => {
      // Try to normalize error shape:
      const maybeData =
        (err as { response?: { data?: unknown } })?.response?.data ?? err;

      if (maybeData && typeof maybeData === 'object') {
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

        if (data.conflict_type === 'future_bookings') {
          const bookings: ConflictBooking[] = (data.bookings ?? [])
            .filter((b) => Boolean(b.startsAt))
            .map((b) => ({
              id: String(b.id ?? b._id ?? ''),
              startsAt: String(b.startsAt),
              serviceName: b.serviceName ?? 'Booking',
              userName: b.userName ?? b.user?.name,
              userEmail: b.userEmail ?? b.user?.email,
            }));

          setDeleteConflict({
            barberId: data.barberId ?? '',
            barberName: data.barberName ?? 'This barber',
            bookings,
          });

          toast.error('Cannot delete barber with future bookings.');
          return;
        }
      }

      // Fallback generic error
      toast.error(errorMessage(err));

      console.log('DELETE BARBER ERROR 👉', err);
    },
  });

  /* ─────────────── submit handlers ─────────────── */

  const onSubmitCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name is required.');
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
    if (!editName.trim()) return toast.error('Name is required.');
    updateMut.mutate(
      {
        id: editId,
        patch: {
          name: editName.trim(),
          specialties: parseSpecialties(editSpecialtiesInput),
          active: editActive,
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Manage Barbers
        </h1>
        <button
          onClick={() => refetch()}
          className="rounded-lg bg-neutral-900 text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800 transition disabled:opacity-60"
          disabled={isLoading}
        >
          Refresh
        </button>
      </div>

      {/* Create form */}
      <form
        onSubmit={onSubmitCreate}
        className="grid gap-3 sm:grid-cols-4 bg-white border border-neutral-200 rounded-xl p-4"
      >
        <input
          type="text"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)
          }
          placeholder="Barber name"
          className="rounded-lg border border-neutral-300 px-3 py-2"
          required
        />
        <input
          type="text"
          value={specialtiesInput}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSpecialtiesInput(e.target.value)
          }
          placeholder="Specialties (comma separated)"
          className="rounded-lg border border-neutral-300 px-3 py-2"
        />
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            className="rounded border-neutral-300"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          Active
        </label>
        <button
          type="submit"
          className="rounded-lg bg-amber-400 text-neutral-900 font-semibold px-4 py-2 hover:bg-amber-300 transition"
          disabled={createMut.isPending}
        >
          {createMut.isPending ? 'Adding…' : 'Add Barber'}
        </button>
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
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
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
                      {b.specialties.length ? b.specialties.join(', ') : '—'}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {b.workingHours && b.workingHours.length
                        ? formatWorkingHours(b.workingHours)
                        : 'Not set'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${
                          b.active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                        }`}
                      >
                        {b.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      <button
                        onClick={() =>
                          updateMut.mutate({
                            id: b._id,
                            patch: { active: !b.active },
                          })
                        }
                        className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100"
                        disabled={updateMut.isPending}
                      >
                        {b.active ? 'Set inactive' : 'Set active'}
                      </button>
                      <button
                        onClick={() => openEdit(b)}
                        className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteMut.mutate(b._id)}
                        className="rounded-md border border-rose-300 text-rose-700 px-3 py-1.5 hover:bg-rose-50"
                        disabled={deleteMut.isPending}
                        title="Delete barber (only allowed if no future bookings)"
                      >
                        Delete
                      </button>
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
          </div>

          {/* Conflict box when delete fails because of future bookings */}
          {deleteConflict && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-amber-900">
                    Cannot delete {deleteConflict.barberName}
                  </h2>
                  <p className="mt-1 text-xs text-amber-800">
                    This barber still has {deleteConflict.bookings.length} future booking
                    {deleteConflict.bookings.length === 1 ? '' : 's'}. Set them inactive,
                    or update / cancel the bookings below.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteConflict(null)}
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
                    {deleteConflict.bookings.map((b) => (
                      <tr key={b.id} className="border-t border-amber-100">
                        <td className="px-3 py-2 text-neutral-800">
                          {formatBerlin(b.startsAt)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col">
                            <span className="font-medium text-neutral-900">
                              {b.userName ?? '—'}
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
                              deleteConflict.barberId,
                            )}&date=${encodeURIComponent(isoToYmd(b.startsAt))}`}
                            className="inline-flex items-center rounded-full border border-amber-300 px-3 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-50"
                          >
                            Open in bookings
                          </a>
                        </td>
                      </tr>
                    ))}

                    {deleteConflict.bookings.length === 0 && (
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
          )}
        </>
      )}

      {/* Edit modal */}
      <Modal open={editOpen} title="Edit barber" onClose={closeEdit}>
        <form onSubmit={onSubmitEdit} className="space-y-3">
          <label className="block text-sm font-medium text-neutral-700">
            Name
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </label>

          <label className="block text-sm font-medium text-neutral-700">
            Specialties (comma separated)
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
              value={editSpecialtiesInput}
              onChange={(e) => setEditSpecialtiesInput(e.target.value)}
            />
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              className="rounded border-neutral-300"
              checked={editActive}
              onChange={(e) => setEditActive(e.target.checked)}
            />
            Active
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100"
              onClick={closeEdit}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-neutral-900 text-white px-4 py-1.5 hover:bg-neutral-800 disabled:opacity-50"
              disabled={updateMut.isPending}
            >
              {updateMut.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
