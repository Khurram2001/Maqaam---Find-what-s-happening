"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { ArrowLeft, Loader2, MapPin, Search, Trash2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { apiJson } from "@/lib/api-client";
import { getApiBaseUrl } from "@/lib/config";
import { searchPlaces } from "@/lib/geocode";
import { cn } from "@/lib/utils";

const CreateEventMap = dynamic(
  () => import("./create-event-map").then((m) => m.CreateEventMap),
  {
    ssr: false,
    loading: () => <div className="h-[min(16rem,42vh)] w-full animate-pulse rounded-xl bg-muted ring-1 ring-border/60 sm:h-[min(22rem,50vh)]" />,
  }
);

const payloadSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().min(10),
    imageUrl: z.string().url().optional().or(z.literal("")).transform((v) => v || null),
    categoryId: z.string().uuid().optional().or(z.literal("")).transform((v) => v || null),
    addressLine: z.string().trim().optional().or(z.literal("")).transform((v) => v || null),
    formattedAddress: z.string().trim().optional().or(z.literal("")).transform((v) => v || null),
    providerPlaceId: z.string().trim().optional().or(z.literal("")).transform((v) => v || null),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    startDate: z.date(),
    endDate: z.date(),
  })
  .superRefine((v, ctx) => {
    if (v.endDate <= v.startDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "End must be after start", path: ["endDate"] });
    }
  });

function mapFieldErrors(flat) {
  const out = {};
  const fe = flat.fieldErrors;
  if (!fe) return out;
  for (const [k, arr] of Object.entries(fe)) {
    if (arr?.[0]) out[k] = arr[0];
  }
  return out;
}

function toLocalDateTimeInput(value) {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const y = dt.getFullYear();
  const m = pad(dt.getMonth() + 1);
  const d = pad(dt.getDate());
  const hh = pad(dt.getHours());
  const mm = pad(dt.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

async function uploadEventImage(file) {
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch(`${getApiBaseUrl()}/uploads/event-image`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json?.error?.message || "Image upload failed");
  return json.data.url;
}

/** @param {{ eventId: string }} props */
export function EventEditScreen({ eventId }) {
  const router = useRouter();
  const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
  const allowNavWithoutConfirmRef = useRef(false);

  const [phase, setPhase] = useState("loading");
  const [categories, setCategories] = useState([]);
  const [initialEvent, setInitialEvent] = useState(null);
  const [snapshot, setSnapshot] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState("");

  const [addressQuery, setAddressQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [addressLine, setAddressLine] = useState("");
  const [formattedAddress, setFormattedAddress] = useState("");
  const [providerPlaceId, setProviderPlaceId] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locationPicked, setLocationPicked] = useState(false);

  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");

  const [banner, setBanner] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [me, eventRes, cats] = await Promise.all([
        apiJson("/auth/me"),
        apiJson(`/events/${eventId}`),
        apiJson("/categories"),
      ]);
      if (!alive) return;

      if (!me.ok || !me.json.success || !me.json.data?.user) {
        setPhase("forbidden");
        return;
      }
      const userId = me.json.data.user.id;
      if (!eventRes.ok || !eventRes.json.success || !eventRes.json.data?.event) {
        setPhase(eventRes.status === 404 ? "notfound" : "error");
        setBanner(eventRes.json?.error?.message || "Could not load this event.");
        return;
      }
      const ev = eventRes.json.data.event;
      if (ev.userId !== userId && me.json.data.user.role !== "ADMIN") {
        setPhase("forbidden");
        return;
      }

      if (cats.ok && cats.json.success && cats.json.data?.categories) {
        setCategories(cats.json.data.categories);
      }

      setInitialEvent(ev);
      setTitle(ev.title || "");
      setDescription(ev.description || "");
      setCategoryId(ev.categoryId || "");
      setExistingImageUrl(ev.imageUrl || "");
      setAddressLine(ev.addressLine || "");
      setFormattedAddress(ev.formattedAddress || "");
      setProviderPlaceId(ev.providerPlaceId || "");
      setLatitude(Number(ev.latitude));
      setLongitude(Number(ev.longitude));
      setLocationPicked(true);
      setStartLocal(toLocalDateTimeInput(ev.startDate));
      setEndLocal(toLocalDateTimeInput(ev.endDate));
      setSnapshot({
        title: ev.title || "",
        description: ev.description || "",
        categoryId: ev.categoryId || "",
        existingImageUrl: ev.imageUrl || "",
        addressLine: ev.addressLine || "",
        formattedAddress: ev.formattedAddress || "",
        providerPlaceId: ev.providerPlaceId || "",
        latitude: Number(ev.latitude),
        longitude: Number(ev.longitude),
        startLocal: toLocalDateTimeInput(ev.startDate),
        endLocal: toLocalDateTimeInput(ev.endDate),
      });
      setPhase("ready");
    })();
    return () => {
      alive = false;
    };
  }, [eventId]);

  const isDirty = useMemo(() => {
    if (!snapshot || phase !== "ready") return false;
    if (imageFile) return true;
    if (title !== snapshot.title) return true;
    if (description !== snapshot.description) return true;
    if ((categoryId || "") !== (snapshot.categoryId || "")) return true;
    if ((addressLine || "") !== (snapshot.addressLine || "")) return true;
    if ((formattedAddress || "") !== (snapshot.formattedAddress || "")) return true;
    if ((providerPlaceId || "") !== (snapshot.providerPlaceId || "")) return true;
    if (Number(latitude) !== Number(snapshot.latitude)) return true;
    if (Number(longitude) !== Number(snapshot.longitude)) return true;
    if (startLocal !== snapshot.startLocal) return true;
    if (endLocal !== snapshot.endLocal) return true;
    return false;
  }, [
    snapshot,
    phase,
    imageFile,
    title,
    description,
    categoryId,
    addressLine,
    formattedAddress,
    providerPlaceId,
    latitude,
    longitude,
    startLocal,
    endLocal,
  ]);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  function confirmLeaveIfDirty() {
    if (allowNavWithoutConfirmRef.current) return true;
    if (!isDirty) return true;
    return window.confirm("Discard unsaved changes?");
  }

  useEffect(() => {
    const q = addressQuery.trim();
    if (q.length < 2) {
      const clearId = setTimeout(() => setSuggestions([]), 0);
      return () => clearTimeout(clearId);
    }
    const id = setTimeout(async () => {
      const list = await searchPlaces(q);
      setSuggestions(list);
    }, 400);
    return () => clearTimeout(id);
  }, [addressQuery]);

  const previewObjectUrl = useMemo(() => {
    if (!imageFile) return null;
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  useEffect(() => {
    return () => {
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    };
  }, [previewObjectUrl]);

  const handleMapPick = useCallback(
    (lat, lng) => {
      setLatitude(lat);
      setLongitude(lng);
      setLocationPicked(true);
      if (!formattedAddress) setFormattedAddress("Selected map location");
    },
    [formattedAddress]
  );

  function pickSuggestion(s) {
    setLatitude(s.lat);
    setLongitude(s.lon);
    setFormattedAddress(s.formattedAddress);
    setAddressLine(s.addressLine || "");
    setProviderPlaceId(s.providerPlaceId || s.id || "");
    setLocationPicked(true);
    setSuggestions([]);
    setAddressQuery(s.label.split(",")[0]?.trim() || s.label);
  }

  async function handleSave(e) {
    e.preventDefault();
    setBanner(null);
    setFieldErrors({});

    if (!locationPicked || latitude == null || longitude == null) {
      setBanner("Pick a location on the map or choose a search result.");
      return;
    }
    if (!startLocal?.trim() || !endLocal?.trim()) {
      setFieldErrors({
        ...(!startLocal?.trim() ? { startDate: "Choose a start date and time" } : {}),
        ...(!endLocal?.trim() ? { endDate: "Choose an end date and time" } : {}),
      });
      return;
    }
    const startDate = new Date(startLocal);
    const endDate = new Date(endLocal);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setBanner("Invalid date values.");
      return;
    }

    let imageUrl = existingImageUrl || null;
    if (imageFile) {
      if (imageFile.size > 2 * 1024 * 1024) {
        setBanner("Image must be 2MB or smaller.");
        return;
      }
      try {
        imageUrl = await uploadEventImage(imageFile);
      } catch (err) {
        setBanner(err instanceof Error ? err.message : "Upload failed");
        return;
      }
    }

    const parsed = payloadSchema.safeParse({
      title,
      description,
      imageUrl: imageUrl ?? "",
      categoryId: categoryId || "",
      addressLine: addressLine || "",
      formattedAddress: formattedAddress || "",
      providerPlaceId: providerPlaceId || "",
      latitude,
      longitude,
      startDate,
      endDate,
    });
    if (!parsed.success) {
      setFieldErrors(mapFieldErrors(parsed.error.flatten()));
      return;
    }

    const body = {
      title: parsed.data.title,
      description: parsed.data.description,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      startDate: parsed.data.startDate.toISOString(),
      endDate: parsed.data.endDate.toISOString(),
    };
    if (parsed.data.imageUrl) body.imageUrl = parsed.data.imageUrl;
    if (parsed.data.categoryId) body.categoryId = parsed.data.categoryId;
    if (parsed.data.addressLine) body.addressLine = parsed.data.addressLine;
    if (parsed.data.formattedAddress) body.formattedAddress = parsed.data.formattedAddress;
    if (parsed.data.providerPlaceId) body.providerPlaceId = parsed.data.providerPlaceId;

    setSaving(true);
    const wasRejected = initialEvent?.status === "REJECTED";
    const res = await apiJson(`/events/${eventId}`, { method: "PATCH", body });
    setSaving(false);
    if (res.ok && res.json.success && res.json.data?.event?.id) {
      allowNavWithoutConfirmRef.current = true;
      const query = wasRejected ? "?updated=1&resubmitted=1" : "?updated=1";
      router.push(`/events/${res.json.data.event.id}${query}`);
      router.refresh();
      return;
    }

    const details = res.json?.error?.details?.fieldErrors;
    if (details && typeof details === "object") {
      const next = {};
      for (const [k, v] of Object.entries(details)) {
        if (Array.isArray(v) && v[0]) next[k] = v[0];
      }
      if (Object.keys(next).length) setFieldErrors(next);
    }
    setBanner(res.json?.error?.message || "Could not save changes.");
  }

  async function handleDelete() {
    if (!window.confirm("Delete this event? This action cannot be undone.")) return;

    if (initialEvent?.status === "APPROVED") {
      if (
        !window.confirm(
          "This event is live on Maqaam. Deleting removes it from public listings immediately. Are you sure you want to continue?"
        )
      ) {
        return;
      }
      const typed = window.prompt('This is your last step. Type DELETE in capital letters to confirm.');
      if (typed !== "DELETE") {
        if (typed != null) setBanner('Deletion cancelled — type the word DELETE exactly to remove a live listing.');
        return;
      }
    }

    setDeleting(true);
    const res = await apiJson(`/events/${eventId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok && res.json.success) {
      allowNavWithoutConfirmRef.current = true;
      router.push("/my-events");
      router.refresh();
      return;
    }
    setBanner(res.json?.error?.message || "Could not delete event.");
  }

  if (phase === "loading") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-3 px-4 py-16 text-muted-foreground sm:py-24">
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm">Loading editor…</p>
      </div>
    );
  }

  if (phase === "forbidden" || phase === "notfound" || phase === "error") {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-12 sm:px-6 sm:py-20">
        <Alert variant="destructive">
          <AlertTitle>{phase === "notfound" ? "Event not found" : "Unable to edit"}</AlertTitle>
          <AlertDescription>{banner || "You are not allowed to edit this event."}</AlertDescription>
        </Alert>
        <div className="mt-6">
          <Link href="/my-events" className={cn(buttonVariants({ size: "lg" }), "inline-flex w-full justify-center")}>
            Back to My events
          </Link>
        </div>
      </div>
    );
  }

  const selectClass = cn(
    "h-10 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none",
    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
  );

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      <Link
        href={`/events/${eventId}`}
        onClick={(e) => {
          if (!confirmLeaveIfDirty()) e.preventDefault();
        }}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-4 -ml-1 gap-1.5 text-muted-foreground sm:mb-6 sm:-ml-2")}
      >
        <ArrowLeft className="size-4" aria-hidden />
        Event detail
      </Link>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl md:text-3xl">
          {initialEvent?.status === "REJECTED" ? "Edit & resubmit" : "Edit event"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {initialEvent?.status === "REJECTED"
            ? "Update the details below, then save to send this gathering back for admin review."
            : "Updating an event as host moves it back to pending review."}
        </p>
        {initialEvent?.status === "REJECTED" && initialEvent.rejectionReason ? (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Why it was rejected</AlertTitle>
            <AlertDescription>{initialEvent.rejectionReason}</AlertDescription>
          </Alert>
        ) : null}
        {isDirty ? (
          <p className="mt-2 text-xs font-medium text-amber-900 dark:text-amber-100/90">You have unsaved changes.</p>
        ) : null}
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {banner ? (
          <Alert variant="destructive">
            <AlertTitle>Could not save</AlertTitle>
            <AlertDescription>{banner}</AlertDescription>
          </Alert>
        ) : null}

        <Card className="min-w-0 border-border/80 shadow-sm">
          <CardHeader className="px-4 pb-3 sm:px-6 sm:pb-4"><CardTitle className="text-base">Basics</CardTitle><CardDescription>Update text and category.</CardDescription></CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <div className="space-y-1.5"><Label htmlFor="edit-title">Title</Label><Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} className={fieldErrors.title ? "border-destructive" : ""} /></div>
            <div className="space-y-1.5"><Label htmlFor="edit-desc">Description</Label><Textarea id="edit-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className={fieldErrors.description ? "border-destructive" : ""} /></div>
            <div className="space-y-1.5"><Label htmlFor="edit-cat">Category</Label><select id="edit-cat" className={selectClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}><option value="">No category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-img">Replace banner image (optional)</Label>
              <Input id="edit-img" type="file" accept="image/*" className="cursor-pointer" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
              {previewObjectUrl ? (
                <Image
                  src={previewObjectUrl}
                  alt="New banner preview"
                  width={320}
                  height={160}
                  unoptimized
                  className="mt-2 max-h-40 w-full max-w-full rounded-lg border border-border object-cover sm:max-h-40 sm:w-auto"
                />
              ) : null}
              {!previewObjectUrl && existingImageUrl ? (
                <Image
                  src={existingImageUrl}
                  alt="Current banner"
                  width={320}
                  height={160}
                  className="mt-2 max-h-40 w-full max-w-full rounded-lg border border-border object-cover sm:max-h-40 sm:w-auto"
                />
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 border-border/80 shadow-sm">
          <CardHeader className="px-4 pb-3 sm:px-6 sm:pb-4"><CardTitle className="text-base">When</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 sm:px-6">
            <div className="space-y-1.5"><Label htmlFor="edit-start">Starts</Label><Input id="edit-start" type="datetime-local" value={startLocal} onChange={(e) => setStartLocal(e.target.value)} className="min-w-0 w-full text-sm sm:text-base" /></div>
            <div className="space-y-1.5"><Label htmlFor="edit-end">Ends</Label><Input id="edit-end" type="datetime-local" value={endLocal} onChange={(e) => setEndLocal(e.target.value)} className="min-w-0 w-full text-sm sm:text-base" /></div>
          </CardContent>
        </Card>

        <Card className="min-w-0 border-border/80 shadow-sm">
          <CardHeader className="px-4 pb-3 sm:px-6 sm:pb-4"><CardTitle className="text-base">Where</CardTitle></CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <div className="relative space-y-1.5">
              <Label htmlFor="edit-search">Search address</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="edit-search" value={addressQuery} onChange={(e) => setAddressQuery(e.target.value)} className="pl-9" placeholder="Type at least 2 characters…" autoComplete="off" />
              </div>
              {suggestions.length > 0 ? (
                <ul
                  className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-border bg-popover py-1 text-sm shadow-md ring-1 ring-foreground/10"
                  role="listbox"
                >
                  {suggestions.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        className="flex w-full items-start gap-2 px-3 py-2 text-left text-foreground hover:bg-muted"
                        onClick={() => pickSuggestion(s)}
                      >
                        <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="line-clamp-2">{s.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="space-y-1.5"><Label htmlFor="edit-fmt">Formatted address</Label><Input id="edit-fmt" value={formattedAddress} onChange={(e) => setFormattedAddress(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="edit-line">Address line</Label><Input id="edit-line" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} /></div>
            <CreateEventMap latitude={latitude} longitude={longitude} onPick={handleMapPick} mapTilerKey={mapTilerKey} />
          </CardContent>
        </Card>

        <Separator className="bg-border/80" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="destructive" className="w-full gap-2 sm:w-auto" onClick={handleDelete} disabled={deleting || saving}>
            {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Delete event
          </Button>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/events/${eventId}`}
              onClick={(e) => {
                if (!confirmLeaveIfDirty()) e.preventDefault();
              }}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full justify-center sm:w-auto")}
            >
              Cancel
            </Link>
            <Button type="submit" size="lg" className="w-full gap-2 sm:min-w-[10rem] sm:w-auto" disabled={saving || deleting}>
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Saving…</span>
                </>
              ) : initialEvent?.status === "REJECTED" ? (
                "Save & resubmit"
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
