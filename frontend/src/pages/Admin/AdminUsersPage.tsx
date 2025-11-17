import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";
import {
  adminUnblockUser,
  adminBlockUser,
  adminClearWarning,
} from "../../api/bookings";
import {
  getAdminUser,
  updateAdminUser,
  type AdminUser,
} from "../../api/adminUsers";
import toast from "react-hot-toast";
import { errorMessage } from "../../lib/errors";
import Modal from "../../components/Modal";
import AdminUsersTable, {
  type AdminUserRow,
} from "../../components/admin/users/AdminUsersTable";

type UsersResponse = { users: AdminUserRow[] };

export default function AdminUsersPage() {
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch, isFetching } =
    useQuery<UsersResponse>({
      queryKey: ["admin-users"],
      queryFn: async () => {
        const res = await api.get("/api/admin/users");
        return res.data as UsersResponse;
      },
      staleTime: 5_000,
    });

  const rows = data?.users ?? [];

  /* --------------------- row click → details modal --------------------- */
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: selectedUser, refetch: refetchSelected } = useQuery({
    queryKey: ["admin-user", selectedId],
    queryFn: () => getAdminUser(selectedId as string),
    enabled: !!selectedId,
    staleTime: 5_000,
  });

  // editable form state (sync when a new user is loaded)
  const [form, setForm] = useState<Partial<AdminUser>>({});
  useEffect(() => {
    if (selectedUser) {
      setForm({
        name: selectedUser.name,
        email: selectedUser.email,
        role: selectedUser.role,
        phone: selectedUser.phone ?? "",
        address: selectedUser.address ?? "",
        avatarUrl: selectedUser.avatarUrl ?? "",
        is_online_booking_blocked: !!selectedUser.is_online_booking_blocked,
        block_reason: selectedUser.block_reason ?? "",
      });
    } else {
      setForm({});
    }
  }, [selectedUser]);

  const onRowClick = (u: AdminUserRow) => {
    setSelectedId(u._id);
    setDetailsOpen(true);
  };

  /* -------------------------- mutations -------------------------- */
  const unblock = useMutation({
    mutationFn: async (id: string) => adminUnblockUser(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["admin-users"] });
      const prev = qc.getQueryData<UsersResponse>(["admin-users"]);
      if (prev) {
        qc.setQueryData<UsersResponse>(["admin-users"], {
          ...prev,
          users: prev.users.map((u) =>
            u._id === id
              ? { ...u, is_online_booking_blocked: false, block_reason: "" }
              : u,
          ),
        });
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
      if (selectedId) refetchSelected();
    },
  });

  const block = useMutation({
    mutationFn: async (vars: { id: string; reason?: string }) =>
      adminBlockUser(vars.id, vars.reason),
    onMutate: async ({ id, reason }) => {
      await qc.cancelQueries({ queryKey: ["admin-users"] });
      const prev = qc.getQueryData<UsersResponse>(["admin-users"]);
      if (prev) {
        qc.setQueryData<UsersResponse>(["admin-users"], {
          ...prev,
          users: prev.users.map((u) =>
            u._id === id
              ? {
                  ...u,
                  is_online_booking_blocked: true,
                  block_reason: reason ?? "",
                }
              : u,
          ),
        });
      }
      return { prev };
    },
    onSuccess: () => toast.success("User blocked."),
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["admin-users"], ctx.prev);
      toast.error(errorMessage(err));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      if (selectedId) refetchSelected();
    },
  });

  const clearWarning = useMutation({
    mutationFn: async (id: string) => adminClearWarning(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["admin-users"] });
      const prev = qc.getQueryData<UsersResponse>(["admin-users"]);
      if (prev) {
        qc.setQueryData<UsersResponse>(["admin-users"], {
          ...prev,
          users: prev.users.map((u) =>
            u._id === id
              ? {
                  ...u,
                  warning_count: Math.max(0, (u.warning_count ?? 0) - 1),
                }
              : u,
          ),
        });
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
      if (selectedId) refetchSelected();
    },
  });

  const saveDetails = useMutation({
    mutationFn: async () => {
      if (!selectedId) return null;
      const payload = {
        name: form.name?.trim() || undefined,
        email: form.email?.trim() || undefined,
        role: form.role, // 'user' | 'admin' | undefined
        phone: form.phone?.toString().trim() || undefined,
        address: form.address?.toString().trim() || undefined,
        avatarUrl: form.avatarUrl?.toString().trim() || undefined,
        is_online_booking_blocked: form.is_online_booking_blocked,
        block_reason: form.block_reason?.toString().trim() || undefined,
      };
      return updateAdminUser(selectedId, payload);
    },
    onMutate: async () => {
      if (!selectedId) return { prevList: undefined as UsersResponse | undefined };
      await qc.cancelQueries({ queryKey: ["admin-users"] });
      const prevList = qc.getQueryData<UsersResponse>(["admin-users"]);
      if (prevList) {
        qc.setQueryData<UsersResponse>(["admin-users"], {
          ...prevList,
          users: prevList.users.map((u) =>
            u._id === selectedId
              ? {
                  ...u,
                  name: form.name?.trim() || u.name,
                  email: form.email?.trim() || u.email,
                  role:
                    (form.role as "user" | "admin" | undefined) ?? u.role,
                  is_online_booking_blocked:
                    form.is_online_booking_blocked ??
                    u.is_online_booking_blocked,
                  block_reason:
                    (form.block_reason?.toString().trim() ||
                      u.block_reason ||
                      "") || undefined,
                }
              : u,
          ),
        });
      }
      return { prevList };
    },
    onSuccess: () => {
      toast.success("User updated.");
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prevList) qc.setQueryData(["admin-users"], ctx.prevList);
      toast.error(errorMessage(err));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      if (selectedId) refetchSelected();
    },
  });

  const isWorking =
    unblock.isPending ||
    block.isPending ||
    clearWarning.isPending ||
    saveDetails.isPending;

  /* ------------------------------ handlers for table ------------------------------ */

  const handleClearWarning = (id: string, warnings: number) => {
    if (warnings === 0 || isWorking) return;
    clearWarning.mutate(id);
  };

  const handleBlock = (id: string) => {
    if (isWorking) return;
    block.mutate({ id, reason: undefined });
  };

  const handleUnblock = (id: string) => {
    if (isWorking) return;
    unblock.mutate(id);
  };

  /* ------------------------------ UI ------------------------------ */
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

      <AdminUsersTable
        rows={rows}
        isLoading={isLoading}
        isError={isError}
        isWorking={isWorking}
        onRowClick={onRowClick}
        onClearWarning={handleClearWarning}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
      />

      {/* Details/Edit Modal */}
      <Modal
        open={detailsOpen}
        title="User details"
        onClose={() => {
          if (!isWorking) {
            setDetailsOpen(false);
            setSelectedId(null);
          }
        }}
      >
        {!selectedUser ? (
          <div className="text-sm text-neutral-600">Loading…</div>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              saveDetails.mutate();
            }}
          >
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block text-sm font-medium text-neutral-700">
                Name
                <input
                  type="text"
                  value={form.name ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-neutral-700">
                Email
                <input
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-neutral-700">
                Role
                <select
                  value={form.role ?? "user"}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      role: e.target.value as "user" | "admin",
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-neutral-700">
                Phone
                <input
                  type="text"
                  value={form.phone ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              </label>
              <label className="block text-sm font-medium text-neutral-700 sm:col-span-2">
                Address
                <input
                  type="text"
                  value={form.address ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              </label>
              <label className="block text-sm font-medium text-neutral-700 sm:col-span-2">
                Avatar URL
                <input
                  type="url"
                  value={form.avatarUrl ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, avatarUrl: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              </label>

              <label className="flex items-center gap-2 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={!!form.is_online_booking_blocked}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      is_online_booking_blocked: e.target.checked,
                    }))
                  }
                />
                <span className="text-sm text-neutral-800">
                  Blocked from online booking
                </span>
              </label>
              <label className="block text-sm font-medium text-neutral-700 sm:col-span-2">
                Block reason (optional)
                <input
                  type="text"
                  value={form.block_reason ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, block_reason: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                  placeholder="e.g., repeated no-shows"
                  maxLength={300}
                />
              </label>
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="text-xs text-neutral-500">
                Created:{" "}
                {selectedUser.createdAt
                  ? new Date(selectedUser.createdAt).toLocaleString()
                  : "—"}{" "}
                · Updated:{" "}
                {selectedUser.updatedAt
                  ? new Date(selectedUser.updatedAt).toLocaleString()
                  : "—"}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDetailsOpen(false);
                    setSelectedId(null);
                  }}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100"
                  disabled={isWorking}
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={saveDetails.isPending}
                  className="rounded-md bg-neutral-900 text-white px-4 py-1.5 hover:bg-neutral-800 disabled:opacity-50"
                >
                  {saveDetails.isPending ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
