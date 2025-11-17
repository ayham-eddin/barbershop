import UserRoleBadge from "../../UserRoleBadge";

export type AdminUserRow = {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  warning_count?: number;
  last_warning_at?: string;
  is_online_booking_blocked?: boolean;
  block_reason?: string;
};

interface AdminUsersTableProps {
  rows: AdminUserRow[];
  isLoading: boolean;
  isError: boolean;
  isWorking: boolean;
  onRowClick: (user: AdminUserRow) => void;
  onClearWarning: (id: string, warningCount: number) => void;
  onBlock: (id: string) => void;
  onUnblock: (id: string) => void;
}

export default function AdminUsersTable({
  rows,
  isLoading,
  isError,
  isWorking,
  onRowClick,
  onClearWarning,
  onBlock,
  onUnblock,
}: AdminUsersTableProps) {
  if (isLoading) {
    return (
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="text-center text-neutral-500 py-12">Loading…</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="text-center text-rose-600 bg-rose-50 border border-rose-200 rounded-lg py-4 m-4">
          Failed to load users. Try again later.
        </div>
      </div>
    );
  }

  return (
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
                className="border-t border-neutral-100 hover:bg-neutral-50 transition cursor-pointer"
                onClick={() => onRowClick(u)}
              >
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3 text-neutral-700">{u.email}</td>
                <td className="px-4 py-3">
                  <UserRoleBadge role={u.role} />
                </td>
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
                {/* important: stop propagation so row click doesn't fire when pressing buttons */}
                <td
                  className="px-4 py-3"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <div className="flex justify-end gap-2">
                    <button
                      disabled={warnings === 0 || isWorking}
                      onClick={() => onClearWarning(u._id, warnings)}
                      className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100 disabled:opacity-50"
                      title={
                        warnings === 0
                          ? "No warnings to remove"
                          : "Remove one warning"
                      }
                    >
                      Remove warning
                    </button>
                    {!blocked ? (
                      <button
                        disabled={isWorking}
                        onClick={() => onBlock(u._id)}
                        className="rounded-md border border-amber-300 px-3 py-1.5 hover:bg-amber-50"
                        title="Block user"
                      >
                        Block
                      </button>
                    ) : (
                      <button
                        disabled={!blocked || isWorking}
                        onClick={() => onUnblock(u._id)}
                        className="rounded-md bg-neutral-900 text-white px-3 py-1.5 hover:bg-neutral-800 disabled:opacity-50"
                        title="Unblock user"
                      >
                        {isWorking ? "Working…" : "Unblock"}
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
  );
}
