"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, X } from "lucide-react";

import { EventStatusBadge } from "@/components/admin/admin-ui";
import { RejectEventDialog } from "@/components/admin/reject-event-dialog";
import { useAdminToast } from "@/components/admin/admin-toast-provider";
import { Button } from "@/components/ui/button";
import { apiJson } from "@/lib/api-client";
import { formatAdminDateTime } from "@/lib/admin-format";

/** @param {{ eventId: string }} props */
export function AdminEventReviewScreen({ eventId }) {
  const toast = useAdminToast();
  const [event, setEvent] = useState(null);
  const [host, setHost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const detailRes = await apiJson(`/events/${eventId}`);

    if (!detailRes.ok || !detailRes.json.success || !detailRes.json.data?.event) {
      toast.error(detailRes.json?.error?.message || "Could not load event.");
      setEvent(null);
      setHost(null);
      setLoading(false);
      return;
    }

    const ev = detailRes.json.data.event;
    setEvent(ev);
    setHost(ev.user ?? null);
    setLoading(false);
  }, [eventId, toast]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  async function approve() {
    setBusy(true);
    const res = await apiJson(`/admin/events/${eventId}/approve`, { method: "PATCH" });
    setBusy(false);

    if (!res.ok || !res.json.success) {
      toast.error(res.json?.error?.message || "Approve failed.");
      return;
    }

    toast.success(`“${event?.title || "Gathering"}” approved and published.`);
    await load();
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[#0B4D53]/65">
        <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
        Loading review…
      </div>
    );
  }

  if (!event) {
    return (
      <div className="rounded-2xl border border-red-200/60 bg-white p-5 text-red-800 shadow-sm sm:p-6">
        Event not found or unavailable.
      </div>
    );
  }

  const showModerationActions = event.status === "PENDING";

  return (
    <>
      <div className="mb-5 sm:mb-6">
        <Link
          href="/"
          className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-[#0B4D53]/70 transition-colors hover:text-[#0B4D53]"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          Back to gatherings
        </Link>
      </div>

      {event.status === "REJECTED" ? (
        <div className="mb-4 rounded-2xl border border-amber-200/70 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:mb-6">
          This gathering was rejected. The host must edit and resubmit before you can approve or reject it again.
        </div>
      ) : null}

      {event.status === "APPROVED" ? (
        <div className="mb-4 rounded-2xl border border-emerald-200/70 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 sm:mb-6">
          This gathering is already approved and live on the public site.
        </div>
      ) : null}

      {event.status === "PENDING" ? (
        <div className="mb-4 rounded-2xl border border-[#2DD4BF]/30 bg-[#FAF6F0] px-4 py-3 text-sm text-[#0B4D53] sm:mb-6">
          Pending review — approve to publish or reject with feedback for the host.
        </div>
      ) : null}

      <div className="grid gap-4 pb-36 sm:gap-6 sm:pb-32 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,1fr)] lg:pb-28">
        <div className="space-y-4">
          <section className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2DD4BF]">Moderation review</p>
                <h1 className="mt-2 text-xl font-semibold tracking-tight text-[#0B4D53] sm:text-2xl">{event.title}</h1>
              </div>
              <EventStatusBadge status={event.status} />
            </div>
          </section>

          {event.imageUrl ? (
            <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm lg:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={event.imageUrl} alt="" className="aspect-video w-full object-cover" />
            </section>
          ) : null}

          <section className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-sm font-semibold text-[#0B4D53]">Category</h2>
            <p className="mt-2 text-sm text-[#0B4D53]/75">{event.category?.name || "—"}</p>
          </section>

          <section className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-sm font-semibold text-[#0B4D53]">Address</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#0B4D53]/75">
              {event.formattedAddress || event.addressLine || "—"}
            </p>
          </section>

          <section className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-sm font-semibold text-[#0B4D53]">Description</h2>
            <div className="prose prose-sm mt-3 max-w-none whitespace-pre-wrap text-sm leading-relaxed text-[#0B4D53]/80">
              {event.description}
            </div>
          </section>

          {event.rejectionReason && event.status !== "PENDING" ? (
            <section className="rounded-2xl border border-red-200/60 bg-red-50 p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-red-900">Rejection reason</h2>
              <p className="mt-2 text-sm text-red-800/90">{event.rejectionReason}</p>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-sm font-semibold text-[#0B4D53]">Host</h2>
            <p className="mt-2 font-medium text-[#0B4D53]">{host?.name || "—"}</p>
            <p className="mt-1 break-all text-sm text-[#0B4D53]/60">{host?.email || event.userId || "—"}</p>
          </section>

          <section className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-sm font-semibold text-[#0B4D53]">Schedule</h2>
            <p className="mt-2 text-sm text-[#0B4D53]/75">{formatAdminDateTime(event.startDate)}</p>
            <p className="mt-1 text-sm text-[#0B4D53]/55">to {formatAdminDateTime(event.endDate)}</p>
          </section>

          {event.imageUrl ? (
            <section className="hidden overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm lg:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={event.imageUrl} alt="" className="aspect-video w-full object-cover" />
            </section>
          ) : null}
        </aside>
      </div>

      {showModerationActions ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#0B4D53]/10 bg-white/95 pb-safe backdrop-blur-md lg:left-64">
          <div className="flex flex-col-reverse gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-6 sm:py-4 lg:px-8">
            <Button
              type="button"
              variant="destructive"
              size="lg"
              className="h-11 w-full sm:w-auto"
              disabled={busy}
              onClick={() => setRejectOpen(true)}
            >
              <X aria-hidden />
              Reject
            </Button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="h-11 w-full sm:w-auto"
              disabled={busy}
              onClick={approve}
            >
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
              Approve
            </Button>
          </div>
        </div>
      ) : null}

      <RejectEventDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        eventId={eventId}
        eventTitle={event.title}
        onError={(msg) => toast.error(msg)}
        onSuccess={async () => {
          toast.success(`“${event.title}” rejected.`);
          setRejectOpen(false);
          await load();
        }}
      />
    </>
  );
}
