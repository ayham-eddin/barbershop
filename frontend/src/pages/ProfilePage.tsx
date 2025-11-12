import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe, updateMe, type MeUser } from '../api/me';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const qc = useQueryClient();

  // load current profile
  const { data, isLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });

  // local form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  // hydrate form once we have data
  useEffect(() => {
    if (!data) return;
    setName(data.name ?? '');
    setPhone(data.phone ?? '');
    setAddress(data.address ?? '');
    setAvatarUrl(data.avatarUrl ?? '');
  }, [data]);

  const mut = useMutation({
    mutationFn: async () => {
      // map empty strings to undefined (don’t send nulls)
      const patch = {
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      };
      return updateMe(patch);
    },
    onMutate: async () => {
      // optimistic update cache
      await qc.cancelQueries({ queryKey: ['me'] });
      const previous = qc.getQueryData<MeUser>(['me']);
      if (previous) {
        const optimistic: MeUser = {
          ...previous,
          name: name.trim() || previous.name,
          phone: (phone.trim() || previous.phone || '') as string | null,
          address: (address.trim() || previous.address || '') as string | null,
          avatarUrl: (avatarUrl.trim() || previous.avatarUrl || '') as string | null,
        };
        qc.setQueryData(['me'], optimistic);
      }
      return { previous };
    },
    onSuccess: () => {
      toast.success('Profile updated.');
      qc.invalidateQueries({ queryKey: ['me'] }).catch(() => {});
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(['me'], ctx.previous);
      toast.error('Could not update profile.');
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // quick client-side sanity checks
    if (name.trim().length > 0 && name.trim().length < 2) {
      toast.error('Name must be at least 2 characters.');
      return;
    }
    if (avatarUrl && !/^https?:\/\//i.test(avatarUrl.trim())) {
      toast.error('Avatar URL must be a valid http(s) URL.');
      return;
    }
    mut.mutate();
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">My Profile</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Update your personal information.
        </p>
      </header>

      {isLoading && (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 rounded-xl bg-neutral-200 animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm">
          Couldn’t load your profile.
        </div>
      )}

      {data && (
        <div className="rounded-2xl bg-white border border-neutral-200 p-6 shadow-sm">
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-neutral-700">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                placeholder="Your name"
                minLength={2}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-neutral-700">Phone</span>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                placeholder="+49 …"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-neutral-700">Address</span>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                placeholder="Street, City"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-neutral-700">Avatar URL</span>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                placeholder="https://…"
              />
            </label>

            {avatarUrl.trim() && /^https?:\/\//i.test(avatarUrl.trim()) && (
              <div className="sm:col-span-2">
                <span className="text-xs uppercase tracking-wide text-neutral-500">Preview</span>
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={avatarUrl}
                    alt="Avatar preview"
                    className="h-16 w-16 rounded-full border border-neutral-200 object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span className="text-xs text-neutral-500">
                    If the image doesn’t load, check the URL.
                  </span>
                </div>
              </div>
            )}

            <div className="sm:col-span-2 flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={mut.isPending}
                className="rounded-lg bg-neutral-900 text-white px-4 py-2 text-sm font-semibold hover:bg-neutral-800 disabled:opacity-50"
              >
                {mut.isPending ? 'Saving…' : 'Save changes'}
              </button>
              <span className="text-xs text-neutral-500">
                Changes apply immediately.
              </span>
            </div>
          </form>

          {/* read-only bits */}
          <div className="mt-6 grid sm:grid-cols-3 gap-4 text-sm">
            <Info label="Email" value={data.email} />
            <Info label="Role" value={data.role} />
            <Info
              label="Booking status"
              value={data.is_online_booking_blocked ? 'Blocked' : 'OK'}
            />
          </div>
        </div>
      )}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
