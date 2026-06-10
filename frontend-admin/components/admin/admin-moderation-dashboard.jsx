"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Eye, Loader2, RefreshCw, X } from "lucide-react";

import {
  AdminDesktopOnly,
  AdminEmptyCards,
  AdminFilterGroup,
  AdminFilterPills,
  AdminLoadingCards,
  AdminLoadingRow,
  AdminMetricCard,
  AdminMobileCard,
  AdminMobileOnly,
  AdminPageHeader,
  AdminPaginationBar,
  EventStatusBadge,
  ScheduleTimingBadge,
  adminTableShellClass,
} from "@/components/admin/admin-ui";
import { RejectEventDialog } from "@/components/admin/reject-event-dialog";
import { useAdminToast } from "@/components/admin/admin-toast-provider";
import { Button } from "@/components/ui/button";
import {
  ADMIN_EVENTS_PAGE_SIZE,
  SCHEDULE_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
  buildAdminEventsQuery,
  getEventScheduleTiming,
} from "@/lib/admin-events";
import { apiJson } from "@/lib/api-client";
import { formatAdminDateTime } from "@/lib/admin-format";
import { fetchAdminDashboardStats } from "@/lib/admin-stats";

function EventRowActions({ ev, busy, onApprove, onReject }) {
  const isPending = ev.status === "PENDING";
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/events/${ev.id}`}
        className="inline-flex h-9 min-w-[5.5rem] items-center justify-center gap-2 rounded-xl border border-[#0B4D53]/20 bg-white px-3 text-xs font-medium text-[#0B4D53] transition-all hover:bg-[#0B4D53]/5 sm:h-8"
      >
        <Eye className="size-3.5" aria-hidden />
        Review
      </Link>
      {isPending ? (
        <>
          <Button type="button" variant="primary" size="sm" className="h-9 sm:h-8" disabled={busy} onClick={() => onApprove(ev.id, ev.title)}>
            {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
            Approve
          </Button>
          <Button type="button" variant="destructive" size="sm" className="h-9 sm:h-8" disabled={busy} onClick={() => onReject(ev)}>
            <X aria-hidden />
            Reject
          </Button>
        </>
      ) : null}
    </div>
  );
}

export function AdminModerationDashboard() {
  const toast = useAdminToast();
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: ADMIN_EVENTS_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [scheduleFilter, setScheduleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [actionBusyId, setActionBusyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalEvents: 0, pendingEvents: 0, totalUsers: 0 });
  const [rejectTarget, setRejectTarget] = useState(/** @type {{ id: string; title: string } | null} */ (null));

  const loadEvents = useCallback(
    async (page, filters) => {
      setLoading(true);
      const schedule = filters?.schedule ?? scheduleFilter;
      const status = filters?.status ?? statusFilter;
      const query = buildAdminEventsQuery({ page, limit: ADMIN_EVENTS_PAGE_SIZE, schedule, status });
      const res = await apiJson(`/events?${query}`);

      if (!res.ok || !res.json.success) {
        toast.error(res.json?.error?.message || "Could not load gatherings.");
        setLoading(false);
        return;
      }

      setEvents(res.json.data?.events ?? []);
      setPagination(
        res.json.data?.pagination ?? {
          page: 1,
          limit: ADMIN_EVENTS_PAGE_SIZE,
          total: 0,
          totalPages: 0,
        }
      );
      setLoading(false);
    },
    [scheduleFilter, statusFilter, toast]
  );

  const loadStats = useCallback(async () => {
    const next = await fetchAdminDashboardStats();
    setStats(next);
  }, []);

  const refreshAll = useCallback(
    async (page = pagination.page) => {
      await Promise.all([loadEvents(page), loadStats()]);
    },
    [loadEvents, loadStats, pagination.page]
  );

  useEffect(() => {
    const tid = setTimeout(() => {
      void loadEvents(1);
      void loadStats();
    }, 0);
    return () => clearTimeout(tid);
  }, [loadEvents, loadStats]);

  function handleScheduleChange(next) {
    setScheduleFilter(next);
    void loadEvents(1, { schedule: next, status: statusFilter });
  }

  function handleStatusChange(next) {
    setStatusFilter(next);
    void loadEvents(1, { schedule: scheduleFilter, status: next });
  }

  async function approve(eventId, title) {
    setActionBusyId(eventId);
    const res = await apiJson(`/admin/events/${eventId}/approve`, { method: "PATCH" });
    setActionBusyId(null);

    if (!res.ok || !res.json.success) {
      toast.error(res.json?.error?.message || "Approve failed.");
      return;
    }

    toast.success(title ? `“${title}” approved and is now live.` : "Event approved successfully.");
    await refreshAll(pagination.page);
  }

  const emptyMessage =
    scheduleFilter !== "all" || statusFilter !== "all"
      ? "No gatherings match the selected filters."
      : "No gatherings found.";

  return (
    <>
      <AdminPageHeader
        eyebrow="Moderation"
        title="All gatherings"
        description="Browse past, today’s, and upcoming gatherings across every moderation status. The queue defaults to pending submissions, including resubmissions after rejection."
        actions={
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => refreshAll(1)}>
            <RefreshCw aria-hidden />
            Refresh
          </Button>
        }
      />

      <section className="mb-6 grid gap-3 sm:mb-8 sm:grid-cols-3 sm:gap-4">
        <AdminMetricCard label="Total events" value={stats.totalEvents} />
        <AdminMetricCard label="Pending events" value={stats.pendingEvents} accent="text-amber-700" />
        <AdminMetricCard label="Total users" value={stats.totalUsers} accent="text-[#2DD4BF]" />
      </section>

      <div className="mb-5 flex flex-col gap-4">
        <AdminFilterGroup label="Schedule">
          <AdminFilterPills
            ariaLabel="Filter by schedule"
            options={SCHEDULE_FILTER_OPTIONS}
            value={scheduleFilter}
            onChange={handleScheduleChange}
          />
        </AdminFilterGroup>
        <AdminFilterGroup label="Status">
          <AdminFilterPills
            ariaLabel="Filter by moderation status"
            options={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={handleStatusChange}
          />
        </AdminFilterGroup>
      </div>

      {loading ? <AdminLoadingCards label="Loading gatherings…" /> : null}
      {!loading && events.length === 0 ? <AdminEmptyCards message={emptyMessage} /> : null}

      <AdminMobileOnly>
        {!loading &&
          events.map((ev) => {
            const busy = actionBusyId === ev.id;
            const timing = getEventScheduleTiming(ev);
            return (
              <AdminMobileCard key={ev.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="min-w-0 flex-1 font-medium text-[#0B4D53]">{ev.title}</h3>
                  <EventStatusBadge status={ev.status} />
                </div>
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[#0B4D53]/65">{ev.description}</p>
                {ev.formattedAddress ? <p className="mt-2 text-xs text-[#0B4D53]/50">{ev.formattedAddress}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <ScheduleTimingBadge timing={timing} />
                </div>
                <p className="mt-2 text-xs text-[#0B4D53]/75">
                  {formatAdminDateTime(ev.startDate)} – {formatAdminDateTime(ev.endDate)}
                </p>
                <div className="mt-3 border-t border-neutral-100 pt-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-[#0B4D53]/50">Host</p>
                  <p className="mt-1 text-sm font-medium text-[#0B4D53]">{ev.user?.name || "—"}</p>
                  <p className="text-xs text-[#0B4D53]/55">{ev.user?.email || "—"}</p>
                </div>
                <div className="mt-4">
                  <EventRowActions
                    ev={ev}
                    busy={busy}
                    onApprove={approve}
                    onReject={(item) => setRejectTarget({ id: item.id, title: item.title })}
                  />
                </div>
              </AdminMobileCard>
            );
          })}
      </AdminMobileOnly>

      <AdminDesktopOnly>
        <div className={adminTableShellClass}>
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="min-w-[56rem] w-full text-left text-sm">
              <thead className="border-b border-neutral-100 bg-[#FAF6F0]/60 text-xs uppercase tracking-wide text-[#0B4D53]/60">
                <tr>
                  <th className="px-6 py-4 font-medium">Gathering</th>
                  <th className="px-6 py-4 font-medium">Host</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Schedule</th>
                  <th className="px-6 py-4 font-medium">Submitted</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <AdminLoadingRow colSpan={6} label="Loading gatherings…" />
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-[#0B4D53]/60">
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  events.map((ev) => {
                    const busy = actionBusyId === ev.id;
                    const timing = getEventScheduleTiming(ev);
                    return (
                      <tr key={ev.id} className="align-top transition-colors hover:bg-[#FAF6F0]/40">
                        <td className="px-6 py-5">
                          <p className="font-medium text-[#0B4D53]">{ev.title}</p>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#0B4D53]/65">{ev.description}</p>
                          {ev.formattedAddress ? (
                            <p className="mt-2 text-xs text-[#0B4D53]/50">{ev.formattedAddress}</p>
                          ) : null}
                        </td>
                        <td className="px-6 py-5 text-xs text-[#0B4D53]/80">
                          <p className="font-medium">{ev.user?.name || "—"}</p>
                          <p className="mt-0.5 text-[#0B4D53]/55">{ev.user?.email || "—"}</p>
                        </td>
                        <td className="px-6 py-5">
                          <EventStatusBadge status={ev.status} />
                        </td>
                        <td className="px-6 py-5">
                          <div className="space-y-1.5">
                            <ScheduleTimingBadge timing={timing} />
                            <p className="text-xs text-[#0B4D53]/75">{formatAdminDateTime(ev.startDate)}</p>
                            <p className="text-xs text-[#0B4D53]/50">to {formatAdminDateTime(ev.endDate)}</p>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-xs text-[#0B4D53]/75">{formatAdminDateTime(ev.createdAt)}</td>
                        <td className="px-6 py-5">
                          <EventRowActions
                            ev={ev}
                            busy={busy}
                            onApprove={approve}
                            onReject={(item) => setRejectTarget({ id: item.id, title: item.title })}
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
            totalLabel="gatherings"
            loading={loading}
            onPrev={() => loadEvents(pagination.page - 1)}
            onNext={() => loadEvents(pagination.page + 1)}
          />
        </div>
      </AdminDesktopOnly>

      {!loading && events.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-neutral-100 bg-white shadow-sm lg:hidden">
          <AdminPaginationBar
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            totalLabel="gatherings"
            loading={loading}
            onPrev={() => loadEvents(pagination.page - 1)}
            onNext={() => loadEvents(pagination.page + 1)}
          />
        </div>
      ) : null}

      <RejectEventDialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
        eventId={rejectTarget?.id ?? null}
        eventTitle={rejectTarget?.title}
        onError={(msg) => toast.error(msg)}
        onSuccess={async () => {
          toast.success(
            rejectTarget?.title
              ? `“${rejectTarget.title}” rejected. The host can update and resubmit.`
              : "Event rejected successfully."
          );
          setRejectTarget(null);
          await refreshAll(pagination.page);
        }}
      />
    </>
  );
}
