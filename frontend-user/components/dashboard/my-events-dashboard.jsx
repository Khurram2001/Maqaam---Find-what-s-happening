"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Loader2, MapPin, Plus } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiJson } from "@/lib/api-client";
import { displayEventDescription } from "@/lib/event-display";
import { formatEventRange } from "@/lib/format-event";
import { cn } from "@/lib/utils";

const pageShellClass = "mx-auto w-full min-w-0 max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8";

const createEventButtonClass =
  "inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0B4D53] px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0a444a] sm:w-auto";

const cardActionBase =
  "inline-flex h-9 min-h-9 min-w-0 flex-1 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors sm:min-w-[7.25rem] sm:flex-none";

const viewDetailsButtonClass = cn(
  cardActionBase,
  "border border-border/80 bg-white/70 text-foreground hover:border-[#0B4D53]/25 hover:text-[#0B4D53]"
);

const editButtonClass = cn(
  cardActionBase,
  "border border-[#0B4D53]/15 bg-[#FAF6F0]/80 text-[#0B4D53] hover:border-[#0B4D53]/35 hover:bg-[#0B4D53]/5"
);

function statusBadge(status) {
  switch (status) {
    case "PENDING":
      return (
        <span className="rounded-full border border-amber-200/60 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
          Pending
        </span>
      );
    case "APPROVED":
      return (
        <span className="rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
          Approved
        </span>
      );
    case "REJECTED":
      return (
        <span className="rounded-full border border-red-200/60 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-800">
          Rejected
        </span>
      );
    default:
      return (
        <Badge variant="secondary" className="font-normal">
          {status}
        </Badge>
      );
  }
}

export function MyEventsDashboard() {
  const router = useRouter();
  const [phase, setPhase] = useState("loading");
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    const me = await apiJson("/auth/me");
    if (!me.ok || !me.json.success || !me.json.data?.user) {
      setPhase("guest");
      setEvents([]);
      return;
    }

    setPhase("user");
    const list = await apiJson("/events/my/list");
    if (!list.ok || !list.json.success) {
      setError(list.json?.error?.message || "Could not load your events.");
      setEvents([]);
      return;
    }
    setEvents(list.json.data.events ?? []);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(id);
  }, [load]);

  if (phase === "loading") {
    return (
      <div className={cn(pageShellClass, "flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground")}>
        <Loader2 className="size-8 animate-spin text-[#0B4D53]" aria-hidden />
        <p className="text-sm">Loading your dashboard…</p>
      </div>
    );
  }

  if (phase === "guest") {
    return (
      <div className={pageShellClass}>
        <div className="mx-auto max-w-lg py-6 sm:py-8">
          <Card className="border-border/70 bg-white/80 shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-xl">My events</CardTitle>
              <CardDescription>Sign in to see events you have submitted.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTitle className="text-sm">You are signed out</AlertTitle>
                <AlertDescription className="text-muted-foreground">
                  Use <span className="font-medium text-foreground">Sign in</span> in the header on the home page, then
                  open <span className="font-medium text-foreground">My events</span> again.
                </AlertDescription>
              </Alert>
              <Link href="/" className={cn(buttonVariants({ size: "lg" }), "inline-flex w-full justify-center")}>
                Back to home
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={pageShellClass}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0 max-w-2xl">
          <p className="text-xs font-semibold tracking-widest text-[#0B4D53]/70">DASHBOARD</p>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            My events
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Track moderation status for everything you host. Edits send an event back to pending review.
          </p>
        </div>
        <button type="button" className={createEventButtonClass} onClick={() => router.push("/events/new")}>
          <Plus className="size-4" aria-hidden />
          Create event
        </button>
      </div>

      {error ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not refresh</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {events.length === 0 ? (
        <Card className="mt-10 border-dashed border-border/70 bg-white/60">
          <CardHeader>
            <CardTitle className="text-base font-medium">No events yet</CardTitle>
            <CardDescription>
              When you create an event, it will appear here with a pending badge until it is reviewed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <button type="button" className={createEventButtonClass} onClick={() => router.push("/events/new")}>
              <Plus className="size-4" />
              Create your first event
            </button>
          </CardContent>
        </Card>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:gap-5 lg:grid-cols-2">
          {events.map((ev, index) => (
            <li key={ev.id}>
              <Card className="h-full overflow-hidden border-border/70 bg-white/80 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex h-full flex-col gap-4 p-4 sm:flex-row sm:gap-5 sm:p-5">
                  <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:aspect-[4/3] sm:w-36 md:w-40">
                    {ev.imageUrl ? (
                      <Image src={ev.imageUrl} alt={ev.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 160px" />
                    ) : (
                      <div className="flex h-full min-h-[7rem] items-center justify-center text-muted-foreground">
                        <Calendar className="size-8 opacity-35" aria-hidden />
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {statusBadge(ev.status)}
                      {ev.category?.name ? (
                        <Badge variant="secondary" className="border-0 bg-muted/60 font-normal text-muted-foreground">
                          {ev.category.name}
                        </Badge>
                      ) : null}
                    </div>
                    <Link href={`/events/${ev.id}`} className="group">
                      <h2 className="font-heading text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-[#0B4D53] sm:text-lg">
                        {ev.title}
                      </h2>
                    </Link>
                    <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {displayEventDescription(ev.description, index)}
                    </p>
                    <div className="mt-auto flex flex-col gap-1.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="size-3.5 shrink-0 opacity-70" aria-hidden />
                        {formatEventRange(ev.startDate, ev.endDate)}
                      </span>
                      {ev.formattedAddress || ev.addressLine ? (
                        <span className="inline-flex items-start gap-1.5">
                          <MapPin className="mt-0.5 size-3.5 shrink-0 opacity-70" aria-hidden />
                          <span className="line-clamp-2">{ev.formattedAddress || ev.addressLine}</span>
                        </span>
                      ) : null}
                    </div>
                    {ev.status === "REJECTED" && ev.rejectionReason ? (
                      <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                        <span className="font-medium">Reason:</span> {ev.rejectionReason}
                      </p>
                    ) : null}
                    <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap">
                      <Link href={`/events/${ev.id}`} className={viewDetailsButtonClass}>
                        View details
                      </Link>
                      <Link href={`/events/${ev.id}/edit`} className={editButtonClass}>
                        {ev.status === "REJECTED" ? "Edit & resubmit" : "Edit"}
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
