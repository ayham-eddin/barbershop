import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";
import {
  adminUnblockUser,
  adminBlockUser,
  adminClearWarning,
} from "../../api/bookings";
import toast from "react-hot-toast";
import { errorMessage } from "../../lib/errors";
import Modal from "../../components/Modal";

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

  // ---- Block modal state ----
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockUserId, setBlockUserId] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState<string>("");

  const rows = data?.users ?? [];

  // ---- Mutations ----
  const unblock = useMutation({
    mutationFn: async (id: string) => adminUnblockUser(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["admin-users"] });
      const prev = qc.getQueryData<UsersResponse>(["admin-users"]);
      if (prev) {
        const next: UsersResponse = {
          ...prev,
          users: prev.users.map(u =>
            u._id === id ? { ...u, is_online_booking_blocked: false, block_reason: "" } : u
          ),
        };
        qc.setQueryData(["admin-users"], next);
      }
      return { prev };
    },
    onSuccess: () => toast.success("User unblocked."),
    onError: (err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["admin-users"], ctx.prev);
      toast.error(errorMessage(err));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const block = useMutation({
    mutationFn: async (vars: { id: string; reason?: string }) =>
      adminBlockUser(vars.id, vars.reason),
    onMutate: async ({ id, reason }) => {
      await qc.cancelQueries({ queryKey: ["admin-users"] });
      const prev = qc.getQueryData<UsersResponse>(["admin-users"]);
      if (prev) {
        const next: UsersResponse = {
          ...prev,
          users: prev.users.map(u =>
            u._id === id
              ? { ...u, is_online_booking_blocked: true, block_reason: reason ?? "" }
              : u
          ),
        };
        qc.setQueryData(["admin-users"], next);
      }
      return { prev };
    },
    onSuccess: () => {
      toast.success("User blocked.");
      setBlockOpen(false);
      setBlockUserId(null);
      setBlockReason("");
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["admin-users"], ctx.prev);
      toast.error(errorMessage(err));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const clearWarning = useMutation({
    mutationFn: async (id: string) => adminClearWarning(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["admin-users"] });
      const prev = qc.getQueryData<UsersResponse>(["admin-users"]);
      if (prev) {
        const next: UsersResponse = {
          ...prev,
          users: prev.users.map(u =>
            u._id === id
              ? { ...u, warning_count: Math.max(0, (u.warning_count ?? 0) - 1) }
              : u
          ),
        };
        qc.setQueryData(["admin-users"], next);
      }
      return { prev };
    },
    onSuccess: () => toast.success("One warning removed."),
    onError: (err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["admin-users"], ctx.prev);
      toast.error(errorMessage(err));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const isWorking =
    unblock.isPending || block.isPending || clearWarning.isPending;

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
              {rows.map((u) => {
                const blocked = !!u.is_online_booking_blocked;
                const warnings = u.warning_count ?? 0;
                return (
                  <tr
                    key={u._id}
                    className="border-t border-neutral-100 hover:bg-neutral-50 transition"
                  >
                    <td className="px-4 py-3">{u.name}</td>
                    <td className="px-4 py-3 text-neutral-700">{u.email}</td>
                    <td className="px-4 py-3">{u.role}</td>
                    <td className="px-4 py-3">{warnings}</td>
                    <td className="px-4 py-3">
                      {blocked ? (
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
                      <div className="flex justify-end gap-2">
                        {/* Remove one warning */}
                        <button
                          disabled={warnings === 0 || isWorking}
                          onClick={() => clearWarning.mutate(u._id)}
                          className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100 disabled:opacity-50"
                          title={
                            warnings === 0
                              ? "No warnings to remove"
                              : "Remove one warning"
                          }
                        >
                          Remove warning
                        </button>

                        {/* Block / Unblock */}
                        {!blocked ? (
                          <button
                            disabled={isWorking}
                            onClick={() => {
                              setBlockUserId(u._id);
                              setBlockReason("");
                              setBlockOpen(true);
                            }}
                            className="rounded-md border border-amber-300 px-3 py-1.5 hover:bg-amber-50"
                            title="Block user (optional reason)"
                          >
                            Block
                          </button>
                        ) : (
                          <button
                            disabled={!blocked || isWorking}
                            onClick={() => unblock.mutate(u._id)}
                            className="rounded-md bg-neutral-900 text-white px-3 py-1.5 hover:bg-neutral-800 disabled:opacity-50"
                            title="Unblock user"
                          >
                            {unblock.isPending ? "Working…" : "Unblock"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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

      {/* Block Modal */}
      <Modal
        open={blockOpen}
        title="Block user"
        onClose={() => {
          if (!block.isPending) setBlockOpen(false);
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!blockUserId) return;
            block.mutate({ id: blockUserId, reason: blockReason.trim() || undefined });
          }}
          className="space-y-3"
        >
          <label className="block text-sm font-medium text-neutral-700">
            Reason (optional)
            <input
              type="text"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
              placeholder="e.g., repeated no-shows"
              maxLength={300}
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setBlockOpen(false)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100"
              disabled={block.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={block.isPending || !blockUserId}
              className="rounded-md bg-amber-500 text-neutral-900 px-4 py-1.5 hover:bg-amber-400 disabled:opacity-50"
            >
              {block.isPending ? "Blocking…" : "Confirm block"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
