import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

type Service = {
  _id: string;
  name: string;
  durationMin: number;
  price: number;
};

type AdminListResponse = { services: Service[] };

export default function AdminServicesPage() {
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery<AdminListResponse>({
    queryKey: ['adminServices'],
    queryFn: async () => {
      const res = await api.get('/api/admin/services');
      return res.data as AdminListResponse;
    },
    staleTime: 5_000,
  });

  const services = useMemo<Service[]>(
    () => data?.services ?? [],
    [data],
  );

  // Local form state
  const [name, setName] = useState('');
  const [durationMin, setDurationMin] = useState<number>(30);
  const [price, setPrice] = useState<number>(10);

  // Create
  const createMut = useMutation({
    mutationFn: async (payload: { name: string; durationMin: number; price: number }) => {
      const res = await api.post('/api/admin/services', payload);
      return res.data as { service: Service };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminServices'] }).catch(() => {});
      setName('');
      setDurationMin(30);
      setPrice(10);
    },
  });

  // Update
  const updateMut = useMutation({
    mutationFn: async (payload: { id: string; patch: Partial<Pick<Service, 'name' | 'durationMin' | 'price'>> }) => {
      const res = await api.patch(`/api/admin/services/${payload.id}`, payload.patch);
      return res.data as { service: Service };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminServices'] }).catch(() => {});
    },
  });

  // Delete
  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/api/admin/services/${id}`);
      return res.data as { deleted: Service };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminServices'] }).catch(() => {});
    },
  });

  const onSubmitCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createMut.mutate({ name, durationMin, price });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Manage Services</h1>
        <button
          onClick={() => refetch()}
          className="rounded-lg bg-neutral-900 text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800 transition disabled:opacity-60"
          disabled={isLoading}
        >
          Refresh
        </button>
      </div>

      {/* Create form */}
      <form onSubmit={onSubmitCreate} className="grid gap-3 sm:grid-cols-4 bg-white border border-neutral-200 rounded-xl p-4">
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
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s._id} className="border-t border-neutral-100">
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3">{s.durationMin} min</td>
                  <td className="px-4 py-3">€{s.price}</td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      onClick={() =>
                        updateMut.mutate({
                          id: s._id,
                          patch: { price: Math.max(0, s.price + 1) },
                        })
                      }
                      className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100"
                    >
                      +€1
                    </button>
                    <button
                      onClick={() => deleteMut.mutate(s._id)}
                      className="rounded-md border border-rose-300 text-rose-700 px-3 py-1.5 hover:bg-rose-50"
                    >
                      Delete
                    </button>
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
    </div>
  );
}
