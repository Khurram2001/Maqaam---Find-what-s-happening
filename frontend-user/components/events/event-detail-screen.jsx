"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Loader2, MapPin } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { apiJson } from "@/lib/api-client";
import { displayEventDetailDescription } from "@/lib/event-display";
import { formatEventRange } from "@/lib/format-event";
import { cn } from "@/lib/utils";

const pageShellClass = "mx-auto w-full min-w-0 max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8";

const editButtonClass =
  "inline-flex h-8 items-center justify-center rounded-xl bg-[#0B4D53] px-3.5 text-sm font-medium text-white transition-colors hover:bg-[#0a444a]";

const EventMap = dynamic(
  () => import("./create-event-map").then((m) => m.CreateEventMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[min(14rem,38vh)] w-full animate-pulse rounded-2xl border border-neutral-100 bg-[#FAF6F0] sm:h-[min(18rem,45vh)] md:h-[400px]" />
    ),
  }
);

function statusBadge(status) {
  switch (status) {
    case "PENDING":
      return (
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
          Pending review
        </span>
      );
    case "APPROVED":
      return (
        <span className="rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
          Live listing
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

/** @param {{ eventId: string }} props */
export function EventDetailScreen({ eventId }) {
  const router = useRouter();
  const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
  const [phase, setPhase] = useState("loading");
  const [event, setEvent] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [canEdit, setCanEdit] = useState(false);
  const [savedTip, setSavedTip] = useState(false);
  const [resubmittedTip, setResubmittedTip] = useState(false);

  const load = useCallback(async () => {
    setErrorMessage(null);
    setPhase("loading");
    const res = await apiJson(`/events/${eventId}`);
    if (res.status === 404) {
      setEvent(null);
      setPhase("notfound");
      return;
    }
    if (res.status === 403) {
      setEvent(null);
      setPhase("forbidden");
      return;
    }
    if (!res.ok || !res.json.success) {
      setEvent(null);
      setCanEdit(false);
      setErrorMessage(res.json?.error?.message || "Could not load this event.");
      setPhase("error");
      return;
    }
    const nextEvent = res.json.data.event ?? null;
    setEvent(nextEvent);
    const me = await apiJson("/auth/me");
    const meUser = me.ok && me.json.success ? me.json.data?.user : null;
    setCanEdit(Boolean(nextEvent && meUser && (meUser.role === "ADMIN" || meUser.id === nextEvent.userId)));
    setPhase("ready");
  }, [eventId]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    const tid = setTimeout(() => {
      if (typeof window === "undefined") return;
      if (phase !== "ready") {
        setSavedTip(false);
        setResubmittedTip(false);
        return;
      }
      const q = new URLSearchParams(window.location.search);
      setSavedTip(q.get("updated") === "1");
      setResubmittedTip(q.get("resubmitted") === "1");
    }, 0);
    return () => clearTimeout(tid);
  }, [phase, eventId]);

  function dismissSavedTip() {
    setSavedTip(false);
    setResubmittedTip(false);
    router.replace(`/events/${eventId}`, { scroll: false });
  }

  if (phase === "loading") {
    return (
      <div className={cn(pageShellClass, "flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground")}>
        <Loader2 className="size-8 animate-spin text-[#0B4D53]" aria-hidden />
        <p className="text-sm">Loading event…</p>
      </div>
    );
  }

  if (phase === "notfound") {
    return (
      <div className={pageShellClass}>
        <div className="mx-auto max-w-lg py-8">
          <Card className="border-border/70 bg-white/80 shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-xl">Event not found</CardTitle>
              <CardDescription>That link may be wrong or the listing was removed.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/events" className={cn(buttonVariants({ size: "lg" }), "inline-flex w-full justify-center")}>
                Browse events
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (phase === "forbidden") {
    return (
      <div className={pageShellClass}>
        <div className="mx-auto max-w-lg py-8">
          <Card className="border-border/70 bg-white/80 shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-xl">Not available</CardTitle>
              <CardDescription>
                This gathering is not public yet, or you do not have access. If you created it, sign in and open it from
                My events.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 sm:flex-row">
              <Link href="/" className={cn(buttonVariants({ size: "lg" }), "justify-center")}>
                Home
              </Link>
              <Link href="/my-events" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "justify-center")}>
                My events
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className={pageShellClass}>
        <div className="mx-auto max-w-lg py-8">
          <Alert variant="destructive">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button type="button" className={cn(buttonVariants({ size: "lg" }), "justify-center")} onClick={() => void load()}>
              Try again
            </button>
            <Link href="/events" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "justify-center")}>
              Browse events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const lat = Number(event.latitude);
  const lng = Number(event.longitude);
  const coordsOk = Number.isFinite(lat) && Number.isFinite(lng);

  return (
    <article className={pageShellClass}>
      <div className="mx-auto max-w-3xl">
        {savedTip ? (
          <Alert className="mb-6 border-emerald-200/90 bg-emerald-50/90 text-emerald-950">
            <AlertTitle>{resubmittedTip ? "Resubmitted for review" : "Changes saved"}</AlertTitle>
            <AlertDescription className="text-emerald-900/90">
              {resubmittedTip
                ? "Your gathering is pending again. An admin will approve or reject the updated submission."
                : "Your event was updated successfully."}
            </AlertDescription>
            <div className="mt-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-emerald-800/30 bg-white/80"
                onClick={dismissSavedTip}
              >
                Dismiss
              </Button>
            </div>
          </Alert>
        ) : null}

        <div className="mb-4 flex flex-wrap items-center gap-2 sm:mb-6 sm:gap-3">
          <Link
            href="/events"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-1 gap-1.5 text-muted-foreground hover:text-[#0B4D53] sm:-ml-2")}
          >
            <ArrowLeft className="size-4" aria-hidden />
            Listings
          </Link>
          <Link
            href="/my-events"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground hover:text-[#0B4D53]")}
          >
            My events
          </Link>
          {canEdit ? (
            <Link href={`/events/${eventId}/edit`} className={cn(editButtonClass, "ml-auto w-full justify-center sm:ml-0 sm:w-auto")}>
              Edit
            </Link>
          ) : null}
        </div>

        <div className="relative mb-6 aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-sm sm:mb-8 sm:aspect-[16/9]">
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 48rem"
              priority
            />
          ) : (
            <div className="flex h-full min-h-[12rem] w-full items-center justify-center text-muted-foreground">
              <Calendar className="size-14 opacity-35" aria-hidden />
            </div>
          )}
        </div>

        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {statusBadge(event.status)}
            {event.category?.name ? (
              <Badge variant="secondary" className="border-0 bg-muted/60 font-normal text-muted-foreground">
                {event.category.name}
              </Badge>
            ) : null}
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">{event.title}</h1>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <Calendar className="size-4 shrink-0 text-[#0B4D53]/80" aria-hidden />
            <span>{formatEventRange(event.startDate, event.endDate)}</span>
          </p>
          {(event.formattedAddress || event.addressLine) && (
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0 text-[#0B4D53]/80" aria-hidden />
              <span>
                {event.formattedAddress ? <span className="text-foreground">{event.formattedAddress}</span> : null}
                {event.formattedAddress && event.addressLine ? <span className="text-muted-foreground"> · </span> : null}
                {event.addressLine ? <span>{event.addressLine}</span> : null}
              </span>
            </p>
          )}
        </header>

        {event.status === "REJECTED" && event.rejectionReason ? (
          <Alert variant="destructive" className="mt-8">
            <AlertTitle>Moderation note</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>{event.rejectionReason}</p>
              {canEdit ? (
                <Link
                  href={`/events/${eventId}/edit`}
                  className={cn(buttonVariants({ size: "sm" }), "inline-flex bg-white text-destructive hover:bg-white/90")}
                >
                  Edit & resubmit
                </Link>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}

        {event.status === "PENDING" ? (
          <div className="mt-6 rounded-xl border border-amber-200/60 bg-amber-50/40 p-3.5 text-sm tracking-wide text-amber-900 sm:mt-8 sm:p-4">
            <p className="font-medium">Under review</p>
            <p className="mt-1 leading-relaxed text-amber-900/90">
              This listing is not visible to the public until an admin approves it.
            </p>
          </div>
        ) : null}

        <Separator className="my-6 bg-border/60 sm:my-8" />

        <section>
          <h2 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">About</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {displayEventDetailDescription(event.description)}
          </p>
        </section>

        {coordsOk ? (
          <>
            <Separator className="my-6 bg-border/60 sm:my-8" />
            <section>
              <h2 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">Location</h2>
              <div className="mt-3 overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm ring-1 ring-black/[0.03] sm:mt-4">
                <EventMap
                  latitude={lat}
                  longitude={lng}
                  onPick={() => {}}
                  mapTilerKey={mapTilerKey}
                  readOnly
                  embedded
                />
              </div>
            </section>
          </>
        ) : null}
      </div>
    </article>
  );
}
