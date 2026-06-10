"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Shield, Trash2, UserMinus } from "lucide-react";

import { useAdminSession } from "@/components/admin/admin-session-context";
import { useAdminToast } from "@/components/admin/admin-toast-provider";
import {
  ActiveStatusBadge,
  AdminDesktopOnly,
  AdminEmptyCards,
  AdminLoadingCards,
  AdminLoadingRow,
  AdminMobileCard,
  AdminMobileOnly,
  AdminPageHeader,
  AdminPaginationBar,
  adminTableShellClass,
} from "@/components/admin/admin-ui";
import { DeactivateUserDialog } from "@/components/admin/deactivate-user-dialog";
import { DeleteUserDialog } from "@/components/admin/delete-user-dialog";
import { Button } from "@/components/ui/button";
import { apiJson } from "@/lib/api-client";
import { formatAdminDateTime } from "@/lib/admin-format";

function UserActions({ u, busy, isSelf, onPromote, onDeactivate, onDelete }) {
  const displayName = u.name || u.email || "User";
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <Button
        type="button"
        variant="mint"
        size="sm"
        className="h-10 w-full sm:h-8 sm:w-auto"
        disabled={busy || u.role === "ADMIN"}
        onClick={() => onPromote(u.id, displayName)}
      >
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Shield aria-hidden />}
        Promote
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-10 w-full sm:h-8 sm:w-auto"
        disabled={busy || !u.isActive || isSelf}
        onClick={() => onDeactivate(u)}
      >
        <UserMinus aria-hidden />
        Deactivate
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="h-10 w-full sm:h-8 sm:w-auto"
        disabled={busy || isSelf}
        onClick={() => onDelete(u)}
      >
        <Trash2 aria-hidden />
        Delete
      </Button>
    </div>
  );
}

export function AdminUsersScreen() {
  const toast = useAdminToast();
  const session = useAdminSession();
  const currentAdminId = session?.userId ?? "";

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [busyUserId, setBusyUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadUsers = useCallback(
    async (page = 1) => {
      setLoading(true);
      const res = await apiJson(`/admin/users?page=${page}&limit=20`);
      if (!res.ok || !res.json.success) {
        toast.error(res.json?.error?.message || "Could not load users.");
        setLoading(false);
        return;
      }
      setUsers(res.json.data?.users ?? []);
      setPagination(res.json.data?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 });
      setLoading(false);
    },
    [toast]
  );

  useEffect(() => {
    const tid = setTimeout(() => void loadUsers(1), 0);
    return () => clearTimeout(tid);
  }, [loadUsers]);

  async function promote(userId, label) {
    setBusyUserId(userId);
    const res = await apiJson(`/admin/users/${userId}/promote`, { method: "PATCH" });
    setBusyUserId(null);

    if (!res.ok || !res.json.success) {
      toast.error(res.json?.error?.message || "Promote failed.");
      return;
    }

    toast.success(label ? `${label} promoted to admin.` : "User promoted to admin.");
    await loadUsers(pagination.page);
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Accounts"
        title="User management"
        description="Promote trusted hosts, deactivate accounts, or permanently remove users from Maqaam."
        actions={
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => loadUsers(pagination.page)}>
            <RefreshCw aria-hidden />
            Refresh
          </Button>
        }
      />

      {loading ? <AdminLoadingCards label="Loading users…" /> : null}
      {!loading && users.length === 0 ? <AdminEmptyCards message="No users found." /> : null}

      <AdminMobileOnly>
        {!loading &&
          users.map((u) => {
            const busy = busyUserId === u.id;
            const isSelf = currentAdminId && u.id === currentAdminId;
            return (
              <AdminMobileCard key={u.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-[#0B4D53]">{u.name || "—"}</p>
                    <p className="mt-0.5 break-all text-xs text-[#0B4D53]/55">{u.email || "—"}</p>
                  </div>
                  <ActiveStatusBadge isActive={u.isActive} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-[#0B4D53]/5 px-2.5 py-0.5 text-xs font-medium text-[#0B4D53]">
                    {u.role}
                  </span>
                  <span className="text-xs text-[#0B4D53]/55">Joined {formatAdminDateTime(u.createdAt)}</span>
                </div>
                <div className="mt-4 border-t border-neutral-100 pt-4">
                  <UserActions
                    u={u}
                    busy={busy}
                    isSelf={isSelf}
                    onPromote={promote}
                    onDeactivate={setDeactivateTarget}
                    onDelete={setDeleteTarget}
                  />
                </div>
              </AdminMobileCard>
            );
          })}
      </AdminMobileOnly>

      <AdminDesktopOnly>
        <div className={adminTableShellClass}>
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="min-w-[48rem] w-full text-left text-sm">
              <thead className="border-b border-neutral-100 bg-[#FAF6F0]/60 text-xs uppercase tracking-wide text-[#0B4D53]/60">
                <tr>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Created</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <AdminLoadingRow colSpan={5} label="Loading users…" />
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-[#0B4D53]/60">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const busy = busyUserId === u.id;
                    const isSelf = currentAdminId && u.id === currentAdminId;
                    return (
                      <tr key={u.id} className="align-top transition-colors hover:bg-[#FAF6F0]/40">
                        <td className="px-6 py-5">
                          <p className="font-medium text-[#0B4D53]">{u.name || "—"}</p>
                          <p className="mt-0.5 text-xs text-[#0B4D53]/55">{u.email || "—"}</p>
                        </td>
                        <td className="px-6 py-5">
                          <span className="inline-flex rounded-full bg-[#0B4D53]/5 px-2.5 py-0.5 text-xs font-medium text-[#0B4D53]">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <ActiveStatusBadge isActive={u.isActive} />
                        </td>
                        <td className="px-6 py-5 text-xs text-[#0B4D53]/75">{formatAdminDateTime(u.createdAt)}</td>
                        <td className="px-6 py-5">
                          <UserActions
                            u={u}
                            busy={busy}
                            isSelf={isSelf}
                            onPromote={promote}
                            onDeactivate={setDeactivateTarget}
                            onDelete={setDeleteTarget}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <AdminPaginationBar
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            totalLabel="users"
            loading={loading}
            onPrev={() => loadUsers(pagination.page - 1)}
            onNext={() => loadUsers(pagination.page + 1)}
          />
        </div>
      </AdminDesktopOnly>

      {!loading && users.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-neutral-100 bg-white shadow-sm lg:hidden">
          <AdminPaginationBar
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            totalLabel="users"
            loading={loading}
            onPrev={() => loadUsers(pagination.page - 1)}
            onNext={() => loadUsers(pagination.page + 1)}
          />
        </div>
      ) : null}

      <DeactivateUserDialog
        open={Boolean(deactivateTarget)}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null);
        }}
        user={deactivateTarget}
        onError={(msg) => toast.error(msg)}
        onSuccess={async () => {
          const label = deactivateTarget?.name || deactivateTarget?.email || "User";
          toast.success(`${label} deactivated.`);
          setDeactivateTarget(null);
          await loadUsers(pagination.page);
        }}
      />

      <DeleteUserDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        user={deleteTarget}
        currentAdminId={currentAdminId}
        onError={(msg) => toast.error(msg)}
        onSuccess={async () => {
          const label = deleteTarget?.name || deleteTarget?.email || "User";
          toast.success(`${label} deleted permanently.`);
          setDeleteTarget(null);
          await loadUsers(pagination.page);
        }}
      />
    </>
  );
}
