// frontend/src/pages/Admin/AdminBarbersPage.tsx
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/client';
import Modal from '../../components/Modal';

type WorkingHour = {
  day: number; // 0-6
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
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

type AffectedBooking = {
  id: string;
  startsAt: string;
  durationMin: number;
  userName: string | null;
  userEmail: string | null;
};

// Default schedule: Mon–Fri 09:00–17:00
const DEFAULT_WORKING_HOURS: WorkingHour[] = [
  { day: 1, start: '09:00', end: '17:00' },
  { day: 2, start: '09:00', end: '17:00' },
  { day: 3, start: '09:00', end: '17:00' },
  { day: 4, start: '09:00', end: '17:00' },
  { day: 5, start: '09:00', end: '17:00' },
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
  const [editWorkingHours, setEditWorkingHours] = useState<WorkingHour[]>(DEFAULT_WORKING_HOURS);

  // ---- affected bookings (after hours change) ----
  const [lastAffected, setLastAffected] = useState<AffectedBooking[] | null>(null);
  const [lastAffectedBarber, setLastAffectedBarber] = useState<{
    id: string;
    name: string;
  } | null>(null);

  function openEdit(b: Barber) {
    setEditId(b._id);
    setEditName(b.name);
    setEditSpecialtiesInput(b.specialties.join(', '));
    setEditActive(b.active);
    setEditWorkingHours(
      b.workingHours && b.workingHours.length > 0 ? b.workingHours : DEFAULT_WORKING_HOURS,
    );
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
    return def;
  };

  /* ─────────────── helpers ─────────────── */

  const parseSpecialties = (val: string) =>
    val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const formatHoursSummary = (wh: WorkingHour[]): string => {
    if (!wh.length) return 'Hours not set';
    const days = wh
      .slice()
      .sort((a, b) => a.day - b.day)
      .map((h) => `${DAY_LABELS[h.day]} ${h.start}–${h.end}`);
    return days.join(', ');
  };

  const handleHourChange = (day: number, field: 'start' | 'end', value: string) => {
    setEditWorkingHours((prev) => {
      const existing = prev.find((h) => h.day === day);
      if (existing) {
        return prev.map((h) =>
          h.day === day ? { ...h, [field]: value } : h,
        );
      }
      const defaultStart = field === 'start' ? value : '09:00';
      const defaultEnd = field === 'end' ? value : '17:00';
      return [...prev, { day, start: defaultStart, end: defaultEnd }];
    });
  };

  const affectedEmails = useMemo(() => {
    if (!lastAffected) return [];
    const set = new Set<string>();
    for (const b of lastAffected) {
      if (b.userEmail) set.add(b.userEmail);
    }
    return Array.from(set);
  }, [lastAffected]);

  const handleCopyEmails = async () => {
    if (!affectedEmails.length) return;
    const text = affectedEmails.join(', ');
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        toast.success('Email list copied to clipboard.');
      } else {
        throw new Error('Clipboard not available');
      }
    } catch {
      toast.error('Could not copy emails. Please copy them manually.');
    }
  };

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
      patch: Partial<Pick<Barber, 'name' | 'specialties' | 'active' | 'workingHours'>>;
    }) => {
      const res = await api.patch(`/api/admin/barbers/${payload.id}`, payload.patch);
      return res.data as { barber: Barber; affectedBookings?: AffectedBooking[] };
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ['adminBarbers'] }).catch(() => {});
      toast.success('Barber updated.');

      const affected = data.affectedBookings ?? [];
      if (affected.length > 0) {
        setLastAffected(affected);

        const barber =
          barbers.find((b) => b._id === variables.id) ?? null;

        setLastAffectedBarber(
          barber
            ? { id: barber._id, name: barber.name }
            : { id: variables.id, name: editName || 'This barber' },
        );

        toast(
          `${affected.length} future booking${affected.length > 1 ? 's' : ''} now fall outside the new working hours.`,
          { duration: 7000 },
        );
      } else {
        setLastAffected(null);
        setLastAffectedBarber(null);
      }

      // Close modal if it was open
      closeEdit();
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
      toast.success('Barber deleted.');
    },
    onError: (err) => {
      const fallback =
        'Cannot delete this barber. They still might have future bookings.';

      if (err && typeof err === 'object') {
        const ax = err as {
          response?: { data?: { error?: string; message?: string } };
          message?: string;
        };

        const msg =
          ax.response?.data?.error ??
          ax.response?.data?.message ??
          ax.message ??
          fallback;

        toast.error(msg);
      } else {
        toast.error(fallback);
      }
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
      // new barbers are immediately bookable with default hours
      workingHours: DEFAULT_WORKING_HOURS,
    });
  };

  const onSubmitEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editId) return;
    if (!editName.trim()) return toast.error('Name is required.');
    updateMut.mutate({
      id: editId,
      patch: {
        name: editName.trim(),
        specialties: parseSpecialties(editSpecialtiesInput),
        active: editActive,
        workingHours: editWorkingHours,
      },
    });
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

      {/* Affected bookings info (polished UX) */}
      {lastAffected && lastAffected.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm shadow-sm space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 font-semibold text-amber-900">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-[11px]">
                  !
                </span>
                Schedule changed for{' '}
                <span className="underline underline-offset-2">
                  {lastAffectedBarber?.name ?? 'this barber'}
                </span>
              </p>
              <p className="mt-1 text-xs sm:text-[13px] text-amber-800">
                {lastAffected.length} future booking
                {lastAffected.length > 1 ? 's are' : ' is'} now outside the updated
                working hours. Please contact these customers to reschedule or cancel.
              </p>
            </div>
            <button
              type="button"
              aria-label="Dismiss affected bookings"
              className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-amber-200 text-amber-700 hover:bg-amber-100 text-xs"
              onClick={() => {
                setLastAffected(null);
                setLastAffectedBarber(null);
              }}
            >
              ×
            </button>
          </div>

          {affectedEmails.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-[13px]">
              <span className="text-amber-900">
                Emails:{' '}
                <span className="font-medium">
                  {affectedEmails.join(', ')}
                </span>
              </span>
              <button
                type="button"
                onClick={handleCopyEmails}
                className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-200"
              >
                Copy email list
              </button>
            </div>
          )}

          <div className="max-h-40 overflow-y-auto rounded-xl border border-amber-100 bg-amber-50/70">
            <table className="min-w-full text-xs sm:text-[13px]">
              <thead className="bg-amber-100/80 sticky top-0">
                <tr className="text-amber-900">
                  <th className="px-3 py-1 text-left font-semibold">Date & time</th>
                  <th className="px-3 py-1 text-left font-semibold">Duration</th>
                  <th className="px-3 py-1 text-left font-semibold">Customer</th>
                </tr>
              </thead>
              <tbody>
                {lastAffected.map((b) => (
                  <tr key={b.id} className="border-t border-amber-100">
                    <td className="px-3 py-1 text-amber-900">
                      {new Date(b.startsAt).toLocaleString('de-DE', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="px-3 py-1 text-amber-900">
                      {b.durationMin} min
                    </td>
                    <td className="px-3 py-1 text-amber-900">
                      <div className="flex flex-col">
                        <span>{b.userName ?? 'Unknown'}</span>
                        {b.userEmail && (
                          <span className="text-[11px] text-amber-800">
                            {b.userEmail}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && !isError && (
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
                  <td className="px-4 py-3 text-neutral-600 text-xs sm:text-sm">
                    {formatHoursSummary(b.workingHours)}
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
      )}

      {/* Edit modal */}
      <Modal open={editOpen} title="Edit barber" onClose={closeEdit}>
        <form onSubmit={onSubmitEdit} className="space-y-4">
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

          {/* Working hours editor */}
          <div className="border-t border-neutral-200 pt-3">
            <p className="text-sm font-medium text-neutral-800 mb-2">
              Working hours
            </p>
            <p className="text-xs text-neutral-500 mb-3">
              Adjust the weekly schedule. Times are in HH:MM (24h).
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {DAY_LABELS.map((label, day) => {
                const block =
                  editWorkingHours.find((h) => h.day === day) ?? {
                    day,
                    start: '09:00',
                    end: '17:00',
                  };
                return (
                  <div
                    key={day}
                    className="grid grid-cols-[60px,1fr,1fr] items-center gap-2 text-xs sm:text-sm"
                  >
                    <span className="text-neutral-700">{label}</span>
                    <input
                      type="time"
                      value={block.start}
                      onChange={(e) =>
                        handleHourChange(day, 'start', e.target.value)
                      }
                      className="rounded-lg border border-neutral-300 px-2 py-1"
                    />
                    <input
                      type="time"
                      value={block.end}
                      onChange={(e) =>
                        handleHourChange(day, 'end', e.target.value)
                      }
                      className="rounded-lg border border-neutral-300 px-2 py-1"
                    />
                  </div>
                );
              })}
            </div>
          </div>

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
