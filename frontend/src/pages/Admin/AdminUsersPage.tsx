import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";
import { adminUnblockUser } from "../../api/bookings";
import toast from "react-hot-toast";
import { errorMessage } from "../../lib/errors";

type UserRow = {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  warning_count?: number;
  last_warning_at?: string;
  is_online_booking_blocked?: boolean;
  block_reason?: string;
};

type UsersResponse = { users: UserRow[] };

export default function AdminUsersPage() {
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch, isFetching } = useQuery<UsersResponse>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await api.get("/api/admin/users");
      return res.data as UsersResponse;
    },
    staleTime: 5_000,
  });

  const unblock = useMutation({
    mutationFn: async (id: string) => {
      return adminUnblockUser(id);
    },
    onSuccess: () => {
      toast.success("User unblocked.");
      (async () => {
        await qc.invalidateQueries({ queryKey: ["admin-users"] });
      })().catch(() => {});
    },
    onError: (err) => {
      toast.error(errorMessage(err));
    },
  });

  const rows = data?.users ?? [];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Users</h1>
        <button
          onClick={() => refetch()}
          className="rounded-lg bg-neutral-900 text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800 transition disabled:opacity-60"
          disabled={isFetching}
        >
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {isLoading && (
        <div className="text-center text-neutral-500 py-12">Loading…</div>
      )}

      {isError && (
        <div className="text-center text-rose-600 bg-rose-50 border border-rose-200 rounded-lg py-4">
          Failed to load users. Try again later.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-neutral-100 text-neutral-700 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Warnings</th>
                <th className="px-4 py-3">Blocked</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr
                  key={u._id}
                  className="border-t border-neutral-100 hover:bg-neutral-50 transition"
                >
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3 text-neutral-700">{u.email}</td>
                  <td className="px-4 py-3">{u.role}</td>
                  <td className="px-4 py-3">{u.warning_count ?? 0}</td>
                  <td className="px-4 py-3">
                    {u.is_online_booking_blocked ? (
                      <span className="rounded-full border px-2 py-0.5 text-xs bg-rose-100 border-rose-200 text-rose-700">
                        blocked
                      </span>
                    ) : (
                      <span className="rounded-full border px-2 py-0.5 text-xs bg-green-100 border-green-200 text-green-700">
                        ok
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {u.block_reason ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        disabled={!u.is_online_booking_blocked || unblock.isPending}
                        onClick={() => unblock.mutate(u._id)}
                        className="rounded-md bg-neutral-900 text-white px-3 py-1.5 hover:bg-neutral-800 disabled:opacity-50"
                        title={
                          u.is_online_booking_blocked
                            ? "Unblock user"
                            : "User is not blocked"
                        }
                      >
                        {unblock.isPending ? "Working…" : "Unblock"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-neutral-500"
                  >
                    No users found.
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
