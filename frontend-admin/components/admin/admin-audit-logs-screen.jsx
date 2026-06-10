"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { useAdminToast } from "@/components/admin/admin-toast-provider";
import {
  AdminDesktopOnly,
  AdminEmptyCards,
  AdminLoadingCards,
  AdminLoadingRow,
  AdminMobileCard,
  AdminMobileOnly,
  AdminPageHeader,
  AdminPaginationBar,
  adminInputClass,
  adminTableShellClass,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { apiJson } from "@/lib/api-client";
import { formatAuditDateTime } from "@/lib/admin-format";
import { validateAuditFilters } from "@/lib/admin-validation";

function toQuery(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") q.set(k, String(v));
  });
  return q.toString();
}

export function AdminAuditLogsScreen() {
  const toast = useAdminToast();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  const [actorUserId, setActorUserId] = useState("");
  const [targetType, setTargetType] = useState("");
  const [targetId, setTargetId] = useState("");

  const loadLogs = useCallback(
    async (page = 1, filters) => {
      setLoading(true);
      const q = toQuery({
        page,
        limit: 20,
        actorUserId: filters?.actorUserId ?? actorUserId,
        targetType: filters?.targetType ?? targetType,
        targetId: filters?.targetId ?? targetId,
      });
      const res = await apiJson(`/admin/audit-logs?${q}`);
      if (!res.ok || !res.json.success) {
        toast.error(res.json?.error?.message || "Could not load audit logs.");
        setLoading(false);
        return;
      }
      setLogs(res.json.data?.logs ?? []);
      setPagination(res.json.data?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 });
      setLoading(false);
    },
    [actorUserId, targetId, targetType, toast]
  );

  useEffect(() => {
    const tid = setTimeout(() => void loadLogs(1), 0);
    return () => clearTimeout(tid);
  }, [loadLogs]);

  function applyFilters(e) {
    e.preventDefault();
    const check = validateAuditFilters({ actorUserId, targetType, targetId });
    if (!check.ok) {
      toast.error(check.error);
      return;
    }
    const { actorUserId: normalizedActorId, targetType: normalizedTargetType, targetId: normalizedTargetId } =
      check.value;

    setTargetType(normalizedTargetType);
    void loadLogs(1, {
      actorUserId: normalizedActorId,
      targetType: normalizedTargetType,
      targetId: normalizedTargetId,
    });
    toast.success("Audit filters applied.");
  }

  function resetFilters() {
    setActorUserId("");
    setTargetType("");
    setTargetId("");
    void loadLogs(1, { actorUserId: "", targetType: "", targetId: "" });
    toast.success("Filters cleared.");
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Security"
        title="Audit logs"
        description="Trace moderation decisions and account management actions across the platform."
        actions={
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => loadLogs(pagination.page)}>
            <RefreshCw aria-hidden />
            Refresh
          </Button>
        }
      />

      <form
        onSubmit={applyFilters}
        className="mb-6 flex flex-col gap-4 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="min-w-0">
            <label htmlFor="audit-actor" className="mb-1.5 block text-xs font-medium text-[#0B4D53]/70">
              Actor user ID
            </label>
            <input
              id="audit-actor"
              value={actorUserId}
              onChange={(e) => setActorUserId(e.target.value)}
              placeholder="UUID"
              className={adminInputClass}
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="audit-target-type" className="mb-1.5 block text-xs font-medium text-[#0B4D53]/70">
              Target type
            </label>
            <input
              id="audit-target-type"
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              placeholder="EVENT or USER"
              className={adminInputClass}
            />
          </div>
          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
            <label htmlFor="audit-target-id" className="mb-1.5 block text-xs font-medium text-[#0B4D53]/70">
              Target ID
            </label>
            <input
              id="audit-target-id"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="UUID"
              className={adminInputClass}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" variant="primary" className="h-10 w-full sm:w-auto">
            Apply filters
          </Button>
          <Button type="button" variant="outline" className="h-10 w-full sm:w-auto" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </form>

      {loading ? <AdminLoadingCards label="Loading audit logs…" /> : null}
      {!loading && logs.length === 0 ? <AdminEmptyCards message="No audit logs found for current filters." /> : null}

      <AdminMobileOnly>
        {!loading &&
          logs.map((log) => (
            <AdminMobileCard key={log.id}>
              <p className="text-xs font-medium text-[#0B4D53]/80">{formatAuditDateTime(log.createdAt)}</p>
              <p className="mt-2 text-sm font-semibold text-[#0B4D53]">{log.action}</p>
              <div className="mt-3 space-y-1 text-xs text-[#0B4D53]/75">
                <p>
                  <span className="font-medium text-[#0B4D53]/55">Actor: </span>
                  {log.actor?.name || "—"} ({log.actor?.email || log.actorUserId})
                </p>
                <p>
                  <span className="font-medium text-[#0B4D53]/55">Target: </span>
                  {log.targetType} · <span className="break-all font-mono text-[10px]">{log.targetId}</span>
                </p>
              </div>
              <blockquote className="mt-3 overflow-x-auto rounded-xl border border-neutral-100 bg-neutral-50 p-3 font-mono text-[11px] leading-relaxed text-neutral-600">
                <pre className="whitespace-pre-wrap">{JSON.stringify(log.meta ?? {}, null, 2)}</pre>
              </blockquote>
            </AdminMobileCard>
          ))}
      </AdminMobileOnly>

      <AdminDesktopOnly>
        <div className={adminTableShellClass}>
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="min-w-[56rem] w-full text-left text-sm">
              <thead className="border-b border-neutral-100 bg-[#FAF6F0]/60 text-xs uppercase tracking-wide text-[#0B4D53]/60">
                <tr>
                  <th className="px-6 py-4 font-medium">Time</th>
                  <th className="px-6 py-4 font-medium">Actor</th>
                  <th className="px-6 py-4 font-medium">Action</th>
                  <th className="px-6 py-4 font-medium">Target</th>
                  <th className="px-6 py-4 font-medium">Meta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <AdminLoadingRow colSpan={5} label="Loading audit logs…" />
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-[#0B4D53]/60">
                      No audit logs found for current filters.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="align-top transition-colors hover:bg-[#FAF6F0]/40">
                      <td className="px-6 py-5 text-xs text-[#0B4D53]/80">{formatAuditDateTime(log.createdAt)}</td>
                      <td className="px-6 py-5 text-xs text-[#0B4D53]/80">
                        <p className="font-medium">{log.actor?.name || "—"}</p>
                        <p className="mt-0.5 text-[#0B4D53]/55">{log.actor?.email || log.actorUserId}</p>
                      </td>
                      <td className="px-6 py-5 text-xs font-medium text-[#0B4D53]">{log.action}</td>
                      <td className="px-6 py-5 text-xs text-[#0B4D53]/80">
                        <p>{log.targetType}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-[#0B4D53]/50">{log.targetId}</p>
                      </td>
                      <td className="px-6 py-5">
                        <blockquote className="max-w-sm overflow-x-auto rounded-xl border border-neutral-100 bg-neutral-50 p-3 font-mono text-xs text-neutral-600">
                          <pre className="whitespace-pre-wrap">{JSON.stringify(log.meta ?? {}, null, 2)}</pre>
                        </blockquote>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <AdminPaginationBar
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            totalLabel="logs"
            loading={loading}
            onPrev={() => loadLogs(pagination.page - 1)}
            onNext={() => loadLogs(pagination.page + 1)}
          />
        </div>
      </AdminDesktopOnly>

      {!loading && logs.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-neutral-100 bg-white shadow-sm lg:hidden">
          <AdminPaginationBar
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            totalLabel="logs"
            loading={loading}
            onPrev={() => loadLogs(pagination.page - 1)}
            onNext={() => loadLogs(pagination.page + 1)}
          />
        </div>
      ) : null}
    </>
  );
}
