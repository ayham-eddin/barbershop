// src/pages/Admin/AdminServicesPage.tsx
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../../components/Modal';
import {
  adminListServices,
  adminCreateService,
  adminUpdateService,
  adminDeleteService,
  type Service,
  type AdminListResponse,
} from '../../api/adminServices';

export default function AdminServicesPage() {
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch, isFetching } = useQuery<AdminListResponse>({
    queryKey: ['adminServices'],
    queryFn: adminListServices,
    staleTime: 5_000,
  });

  const services = useMemo<Service[]>(
    () => data?.services ?? [],
    [data],
  );

  // ---------- Create form state ----------
  const [name, setName] = useState('');
  const [durationMin, setDurationMin] = useState<number>(30);
  const [price, setPrice] = useState<number>(10);

  // ---------- Modal edit state ----------
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [editName, setEditName] = useState('');
  const [editDuration, setEditDuration] = useState<number>(30);
  const [editPrice, setEditPrice] = useState<number>(10);

  // ---------- Delete confirm state ----------
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const beginEdit = (s: Service) => {
    setEditing(s);
    setEditName(s.name);
    setEditDuration(s.durationMin);
    setEditPrice(s.price);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditing(null);
  };

  // ---------- Mutations ----------
  const createMut = useMutation({
    mutationFn: adminCreateService,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminServices'] }).catch(() => {});
      setName('');
      setDurationMin(30);
      setPrice(10);
    },
  });

  const updateMut = useMutation({
    mutationFn: async (args: { id: string; patch: Partial<Pick<Service, 'name' | 'durationMin' | 'price'>> }) =>
      adminUpdateService(args.id, args.patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminServices'] }).catch(() => {});
      closeEdit();
    },
  });

  const deleteMut = useMutation({
    mutationFn: adminDeleteService,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminServices'] }).catch(() => {});
      setDeleteId(null);
    },
  });

  // ---------- Handlers ----------
  const onSubmitCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createMut.mutate({ name, durationMin, price });
  };

  const onSubmitEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;

    const patch: Partial<Pick<Service, 'name' | 'durationMin' | 'price'>> = {};
    if (editName.trim() !== editing.name) patch.name = editName.trim();
    if (editDuration !== editing.durationMin) patch.durationMin = editDuration;
    if (editPrice !== editing.price) patch.price = editPrice;

    if (Object.keys(patch).length === 0) {
      closeEdit();
      return;
    }
    updateMut.mutate({ id: editing._id, patch });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Manage Services</h1>
        <button
          onClick={() => refetch()}
          className="rounded-lg bg-neutral-900 text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800 transition disabled:opacity-60"
          disabled={isFetching}
        >
          {isFetching ? 'Refreshing…' : 'Refresh'}
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          placeholder="Service name"
          className="rounded-lg border border-neutral-300 px-3 py-2"
          required
        />
        <input
          type="number"
          min={5}
          max={480}
          value={durationMin}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDurationMin(Number(e.target.value))}
          placeholder="Duration (min)"
          className="rounded-lg border border-neutral-300 px-3 py-2"
          required
        />
        <input
          type="number"
          min={0}
          step={0.5}
          value={price}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrice(Number(e.target.value))}
          placeholder="Price (€)"
          className="rounded-lg border border-neutral-300 px-3 py-2"
          required
        />
        <button
          type="submit"
          className="rounded-lg bg-amber-400 text-neutral-900 font-semibold px-4 py-2 hover:bg-amber-300 transition"
          disabled={createMut.isPending}
        >
          {createMut.isPending ? 'Adding…' : 'Add Service'}
        </button>
      </form>

      {isLoading && <div className="text-center text-neutral-500 py-12">Loading…</div>}
      {isError && (
        <div className="text-center text-rose-600 bg-rose-50 border border-rose-200 rounded-lg py-4">
          Failed to load services.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-neutral-100 text-neutral-700 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s._id} className="border-top border-neutral-100">
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3">{s.durationMin} min</td>
                  <td className="px-4 py-3">€{s.price}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => beginEdit(s)}
                        className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteId(s._id)}
                        className="rounded-md border border-rose-300 text-rose-700 px-3 py-1.5 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {services.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                    No services yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        onClose={closeEdit}
        title="Edit Service"
        footer={
          <div className="flex gap-2">
            <button
              onClick={closeEdit}
              className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100"
              type="button"
            >
              Cancel
            </button>
            <button
              form="edit-service-form"
              type="submit"
              disabled={updateMut.isPending}
              className="rounded-md bg-neutral-900 text-white px-3 py-1.5 hover:bg-neutral-800 disabled:opacity-50"
            >
              {updateMut.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        }
      >
        <form id="edit-service-form" onSubmit={onSubmitEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700">Duration (min)</label>
              <input
                type="number"
                min={5}
                max={480}
                value={editDuration}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditDuration(Number(e.target.value))
                }
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">Price (€)</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={editPrice}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditPrice(Number(e.target.value))
                }
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                required
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Delete Service"
        footer={
          <div className="flex gap-2">
            <button
              onClick={() => setDeleteId(null)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteId && deleteMut.mutate(deleteId)}
              disabled={deleteMut.isPending}
              className="rounded-md bg-rose-600 text-white px-3 py-1.5 hover:bg-rose-700 disabled:opacity-50"
            >
              {deleteMut.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-neutral-700">
          Are you sure you want to delete this service? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
