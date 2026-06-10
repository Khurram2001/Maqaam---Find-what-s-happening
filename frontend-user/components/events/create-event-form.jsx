"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploadBox } from "@/components/ui/image-upload-box";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { apiJson } from "@/lib/api-client";
import {
  countWords,
  descriptionWordCountMessage,
  EVENT_DESCRIPTION_MAX_WORDS,
  formToastClass,
  toDatetimeLocalValue,
  validateGatheringSchedule,
} from "@/lib/event-validation";
import { getApiBaseUrl } from "@/lib/config";
import { geocoderConfigured, resolvePlace, searchPlaces } from "@/lib/geocode";
import { cn } from "@/lib/utils";

const formInputClass =
  "h-10 rounded-lg border border-input bg-transparent focus-visible:border-[#0B4D53] focus-visible:ring-1 focus-visible:ring-[#0B4D53] dark:bg-input/30";

const formTextareaClass =
  "min-h-24 rounded-lg border border-input bg-transparent focus-visible:border-[#0B4D53] focus-visible:ring-1 focus-visible:ring-[#0B4D53] dark:bg-input/30";

const formSelectClass = cn(formInputClass, "px-2.5 py-2 text-sm outline-none");

function fieldInputClass(hasError) {
  return cn(
    formInputClass,
    hasError && "border-[#0B4D53]/70 focus-visible:border-[#0B4D53] focus-visible:ring-[#0B4D53]/30"
  );
}

function fieldTextareaClass(hasError) {
  return cn(
    formTextareaClass,
    hasError && "border-[#0B4D53]/70 focus-visible:border-[#0B4D53] focus-visible:ring-[#0B4D53]/30"
  );
}

function fieldErrorClass() {
  return "text-xs text-[#0B4D53]";
}

const CreateEventMap = dynamic(
  () => import("./create-event-map").then((m) => m.CreateEventMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[min(16rem,42vh)] w-full animate-pulse rounded-xl bg-muted ring-1 ring-border/60 sm:h-[min(24rem,55vh)]" />
    ),
  }
);

const payloadSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    description: z
      .string()
      .trim()
      .min(10)
      .refine((value) => countWords(value) <= EVENT_DESCRIPTION_MAX_WORDS, {
        message: `Description must be at most ${EVENT_DESCRIPTION_MAX_WORDS} words`,
      }),
    imageUrl: z.string().url({ message: "Banner image is required" }),
    categoryId: z.string().uuid({ message: "Choose a category" }),
    addressLine: z.string().trim().min(1, { message: "Address is required" }),
    formattedAddress: z.string().trim().min(1, { message: "City is required" }),
    providerPlaceId: z.string().trim().optional().or(z.literal("")).transform((v) => v || null),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    startDate: z.date(),
    endDate: z.date(),
  })
  .superRefine((v, ctx) => {
    const scheduleError = validateGatheringSchedule(v.startDate, v.endDate);
    if (scheduleError?.includes("end time")) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: scheduleError, path: ["endDate"] });
    } else if (scheduleError) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: scheduleError, path: ["startDate"] });
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

async function uploadEventImage(file) {
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch(`${getApiBaseUrl()}/uploads/event-image`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json?.error?.message || "Image upload failed");
  }
  return json.data.url;
}

export function CreateEventForm() {
  const router = useRouter();
  const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;

  const [categories, setCategories] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [country, setCountry] = useState("");
  const [providerPlaceId, setProviderPlaceId] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locationPicked, setLocationPicked] = useState(false);
  const [mapFocus, setMapFocus] = useState(null);

  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapSuggestions, setMapSuggestions] = useState([]);
  const [mapSearchLoading, setMapSearchLoading] = useState(false);
  const [mapSearchStatus, setMapSearchStatus] = useState(() =>
    geocoderConfigured()
      ? null
      : "Map search needs NEXT_PUBLIC_MAPTILER_API_KEY in .env.local. Copy .env.example and restart npm run dev."
  );

  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");

  const [banner, setBanner] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formToast, setFormToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const descriptionWords = countWords(description);
  const minStartLocal = toDatetimeLocalValue();

  useEffect(() => {
    if (!formToast) return undefined;
    const id = window.setTimeout(() => setFormToast(null), 5000);
    return () => window.clearTimeout(id);
  }, [formToast]);

  function showFormToast(variant, text) {
    setFormToast({ variant, text });
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      const { ok, json } = await apiJson("/categories");
      if (!alive) return;
      if (ok && json.success && json.data?.categories) setCategories(json.data.categories);
    })();
    return () => {
      alive = false;
    };
  }, []);

  function flyMapTo(lat, lng, zoom = 14) {
    setMapFocus({ lat, lng, zoom, revision: Date.now() });
  }

  const applyGeocodeFields = useCallback((place) => {
    if (place.providerPlaceId) setProviderPlaceId(place.providerPlaceId);
    if (place.addressLine && !addressLine.trim()) setAddressLine(place.addressLine);
    if (place.city && !city.trim()) setCity(place.city);
    if (place.state && !stateRegion.trim()) setStateRegion(place.state);
    if (place.country && !country.trim()) setCountry(place.country);
  }, [addressLine, city, stateRegion, country]);

  useEffect(() => {
    const query = [city.trim(), stateRegion.trim(), country.trim()].filter(Boolean).join(", ");
    if (query.length < 2 || !geocoderConfigured()) {
      return undefined;
    }

    const id = window.setTimeout(async () => {
      const list = await searchPlaces(query, 1);
      const match = list[0];
      if (match) flyMapTo(match.lat, match.lon, 12);
    }, 450);

    return () => window.clearTimeout(id);
  }, [city, stateRegion, country]);

  useEffect(() => {
    const q = mapSearchQuery.trim();
    if (q.length < 2 || !geocoderConfigured()) {
      const clearId = window.setTimeout(() => setMapSuggestions([]), 0);
      return () => window.clearTimeout(clearId);
    }

    const id = window.setTimeout(async () => {
      const list = await searchPlaces(q);
      setMapSuggestions(list);
    }, 400);

    return () => window.clearTimeout(id);
  }, [mapSearchQuery]);

  const runMapSearch = useCallback(async () => {
    const q = mapSearchQuery.trim();
    if (q.length < 2) {
      setMapSearchStatus("Type at least 2 characters, then press Enter.");
      return;
    }
    if (!geocoderConfigured()) {
      setMapSearchStatus("Map search needs NEXT_PUBLIC_MAPTILER_API_KEY in .env.local. Restart the dev server after adding it.");
      return;
    }

    setMapSearchLoading(true);
    setMapSearchStatus("Searching…");
    setMapSuggestions([]);

    const place = await resolvePlace(q);
    setMapSearchLoading(false);

    if (!place) {
      setMapSearchStatus("No results found. Try a different place name.");
      return;
    }

    flyMapTo(place.lat, place.lon, 15);
    applyGeocodeFields(place);
    setMapSearchStatus("Map updated. Click the map to mark the exact event location.");
  }, [mapSearchQuery, applyGeocodeFields]);

  const handleMapPick = useCallback((lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
    setLocationPicked(true);
    setMapSearchStatus(null);
  }, []);

  function selectMapSuggestion(s) {
    flyMapTo(s.lat, s.lon, 15);
    applyGeocodeFields(s);
    setMapSearchQuery(s.label.split(",")[0]?.trim() || s.label);
    setMapSuggestions([]);
    setMapSearchStatus("Map updated. Click the map to mark the exact event location.");
  }

  function buildFormattedAddress() {
    return [addressLine.trim(), city.trim(), stateRegion.trim(), country.trim()].filter(Boolean).join(", ");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBanner(null);
    setFieldErrors({});

    const nextErrors = {};
    let toastMessage = null;

    const noteError = (key, message) => {
      if (!nextErrors[key]) nextErrors[key] = message;
      if (!toastMessage) toastMessage = message.startsWith("Error:") ? message : `Error: ${message}`;
    };

    if (!title.trim() || title.trim().length < 3) {
      noteError("title", "Title must be at least 3 characters.");
    }
    if (!description.trim() || description.trim().length < 10) {
      noteError("description", "Description must be at least 10 characters.");
    } else if (descriptionWords > EVENT_DESCRIPTION_MAX_WORDS) {
      noteError("description", `Description must be at most ${EVENT_DESCRIPTION_MAX_WORDS} words.`);
    }
    if (!categoryId) noteError("categoryId", "Choose a gathering category.");
    if (!imageFile) noteError("imageUrl", "Banner image is required.");
    if (!addressLine.trim()) noteError("addressLine", "Venue or street address is required.");
    if (!city.trim()) noteError("city", "City is required.");
    if (!stateRegion.trim()) noteError("stateRegion", "State / province / region is required.");
    if (!country.trim()) noteError("country", "Country is required.");
    if (!startLocal.trim()) noteError("startDate", "Choose a start date and time.");
    if (!endLocal.trim()) noteError("endDate", "Choose an end date and time.");
    if (!locationPicked || latitude == null || longitude == null) {
      noteError(
        "location",
        "Search for your area on the map, then click to mark the exact gathering location."
      );
    }

    const startDate = new Date(startLocal);
    const endDate = new Date(endLocal);
    const scheduleError = validateGatheringSchedule(startDate, endDate);
    if (scheduleError) {
      if (scheduleError.includes("end time")) {
        noteError("endDate", scheduleError);
      } else {
        noteError("startDate", scheduleError);
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      showFormToast("warning", toastMessage || "Error: Please complete all required fields.");
      return;
    }

    let imageUrl = "";
    try {
      imageUrl = await uploadEventImage(imageFile);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Banner image upload failed.";
      setFieldErrors({ imageUrl: message });
      showFormToast("warning", `Error: ${message}`);
      return;
    }

    const formattedAddress = buildFormattedAddress();
    const bodyRaw = {
      title,
      description,
      imageUrl,
      categoryId,
      addressLine,
      formattedAddress,
      providerPlaceId: providerPlaceId || "",
      latitude,
      longitude,
      startDate,
      endDate,
    };

    const parsed = payloadSchema.safeParse(bodyRaw);
    if (!parsed.success) {
      const next = mapFieldErrors(parsed.error.flatten());
      const firstIssue = parsed.error.issues[0]?.message;
      setFieldErrors(next);
      showFormToast("warning", firstIssue?.startsWith("Error:") ? firstIssue : `Error: ${firstIssue || "Please review the form."}`);
      return;
    }

    const body = {
      title: parsed.data.title,
      description: parsed.data.description,
      imageUrl: parsed.data.imageUrl,
      categoryId: parsed.data.categoryId,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      startDate: parsed.data.startDate.toISOString(),
      endDate: parsed.data.endDate.toISOString(),
      addressLine: parsed.data.addressLine,
      formattedAddress: parsed.data.formattedAddress,
    };
    if (parsed.data.providerPlaceId) body.providerPlaceId = parsed.data.providerPlaceId;

    setSubmitting(true);
    const { ok, status, json } = await apiJson("/events", { method: "POST", body });
    setSubmitting(false);

    if (ok && json.success && json.data?.event?.id) {
      showFormToast(
        "success",
        "Gathering submitted successfully! Our moderation team is reviewing your listing."
      );
      window.setTimeout(() => {
        router.push(`/events/${json.data.event.id}`);
        router.refresh();
      }, 1400);
      return;
    }

    const details = json?.error?.details?.fieldErrors;
    if (details && typeof details === "object") {
      const next = {};
      for (const [k, v] of Object.entries(details)) {
        if (Array.isArray(v) && v[0]) next[k] = v[0];
      }
      if (Object.keys(next).length) setFieldErrors(next);
    }
    const apiMessage = json?.error?.message || `Could not submit gathering (${status}).`;
    setBanner(apiMessage);
    showFormToast("warning", apiMessage.startsWith("Error:") ? apiMessage : `Error: ${apiMessage}`);
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      <Link
        href="/my-events"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-4 -ml-1 gap-1.5 text-muted-foreground sm:mb-6 sm:-ml-2")}
      >
        <ArrowLeft className="size-4" aria-hidden />
        My events
      </Link>

      <div className="mb-6 sm:mb-8">
        <h1 className="font-heading text-xl font-semibold tracking-tight text-[#0B4D53] sm:text-2xl md:text-3xl">
          Host a New Gathering
        </h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-[#0B4D53]/70">
          Submit your community gathering, circle, or lecture details. All new listings are reviewed by our moderation
          team before appearing live on the public map.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {banner ? (
          <Alert variant="destructive">
            <AlertTitle>Could not save</AlertTitle>
            <AlertDescription>{banner}</AlertDescription>
          </Alert>
        ) : null}

        <Card className="w-full min-w-0 border-border/70 bg-card shadow-sm">
          <CardHeader className="px-4 pb-3 sm:px-6 sm:pb-4">
            <CardTitle className="text-base text-[#0B4D53]">Basics</CardTitle>
            <CardDescription>Title, description, category, and an evocative banner image.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <div className="space-y-1.5">
              <Label htmlFor="evt-title">
                Title <span className="text-[#0B4D53]">*</span>
              </Label>
              <Input
                id="evt-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={160}
                minLength={3}
                required
                className={fieldInputClass(fieldErrors.title)}
                aria-invalid={!!fieldErrors.title}
              />
              {fieldErrors.title ? <p className={fieldErrorClass()}>{fieldErrors.title}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="evt-desc">
                Description <span className="text-[#0B4D53]">*</span>
              </Label>
              <Textarea
                id="evt-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                minLength={10}
                required
                className={fieldTextareaClass(fieldErrors.description)}
                aria-invalid={!!fieldErrors.description}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-[0.65rem]">
                {fieldErrors.description ? (
                  <p className={fieldErrorClass()}>{fieldErrors.description}</p>
                ) : (
                  <p className="text-[#0B4D53]/60">At least 10 characters.</p>
                )}
                <p
                  className={cn(
                    "tabular-nums",
                    descriptionWords > EVENT_DESCRIPTION_MAX_WORDS ? "text-[#0B4D53]" : "text-[#0B4D53]/60"
                  )}
                >
                  {descriptionWordCountMessage(descriptionWords)}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="evt-cat">
                Category <span className="text-[#0B4D53]">*</span>
              </Label>
              <select
                id="evt-cat"
                className={cn(
                  formSelectClass,
                  fieldErrors.categoryId &&
                    "border-[#0B4D53]/70 focus-visible:border-[#0B4D53] focus-visible:ring-[#0B4D53]/30"
                )}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                aria-invalid={!!fieldErrors.categoryId}
                required
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {fieldErrors.categoryId ? <p className={fieldErrorClass()}>{fieldErrors.categoryId}</p> : null}
              {!categories.length ? (
                <p className="text-sm text-[#0B4D53]/70">
                  No categories are available yet. An admin must add categories before you can host a gathering.
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label>
                Banner Image <span className="text-[#0B4D53]">*</span>
              </Label>
              <ImageUploadBox
                value={imageFile}
                onChange={setImageFile}
                error={fieldErrors.imageUrl}
                hint="Required · PNG or JPEG, up to 2MB"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="w-full min-w-0 border-border/70 bg-card shadow-sm">
          <CardHeader className="px-4 pb-3 sm:px-6 sm:pb-4">
            <CardTitle className="text-base text-[#0B4D53]">When</CardTitle>
            <CardDescription>Start and end in your local timezone.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 sm:px-6">
            <div className="space-y-1.5">
              <Label htmlFor="evt-start">
                Starts <span className="text-[#0B4D53]">*</span>
              </Label>
              <Input
                id="evt-start"
                type="datetime-local"
                value={startLocal}
                min={minStartLocal}
                onChange={(e) => setStartLocal(e.target.value)}
                required
                className={cn(fieldInputClass(fieldErrors.startDate), "min-w-0 w-full text-sm sm:text-base")}
                aria-invalid={!!fieldErrors.startDate}
              />
              {fieldErrors.startDate ? <p className={fieldErrorClass()}>{fieldErrors.startDate}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="evt-end">
                Ends <span className="text-[#0B4D53]">*</span>
              </Label>
              <Input
                id="evt-end"
                type="datetime-local"
                value={endLocal}
                min={startLocal || minStartLocal}
                onChange={(e) => setEndLocal(e.target.value)}
                required
                className={cn(fieldInputClass(fieldErrors.endDate), "min-w-0 w-full text-sm sm:text-base")}
                aria-invalid={!!fieldErrors.endDate}
              />
              {fieldErrors.endDate ? <p className={fieldErrorClass()}>{fieldErrors.endDate}</p> : null}
            </div>
          </CardContent>
        </Card>

        <Card className="w-full min-w-0 border-border/70 bg-card shadow-sm">
          <CardHeader className="px-4 pb-3 sm:px-6 sm:pb-4">
            <CardTitle className="text-base text-[#0B4D53]">Where</CardTitle>
            <CardDescription>
              Add the venue details, then pin the exact gathering location on the map below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="evt-address">
                  Venue or Street Address <span className="text-[#0B4D53]">*</span>
                </Label>
                <Input
                  id="evt-address"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="e.g., 123 Community Lane, Space Suite B"
                  required
                  className={fieldInputClass(fieldErrors.addressLine)}
                  aria-invalid={!!fieldErrors.addressLine}
                />
                {fieldErrors.addressLine ? (
                  <p className={fieldErrorClass()}>{fieldErrors.addressLine}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="evt-city">
                  City <span className="text-[#0B4D53]">*</span>
                </Label>
                <Input
                  id="evt-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g., London, Chicago"
                  required
                  className={fieldInputClass(fieldErrors.city)}
                  aria-invalid={!!fieldErrors.city}
                />
                {fieldErrors.city ? <p className={fieldErrorClass()}>{fieldErrors.city}</p> : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="evt-state">
                  State / Province / Region <span className="text-[#0B4D53]">*</span>
                </Label>
                <Input
                  id="evt-state"
                  value={stateRegion}
                  onChange={(e) => setStateRegion(e.target.value)}
                  placeholder="e.g., England, Illinois"
                  required
                  className={fieldInputClass(fieldErrors.stateRegion)}
                  aria-invalid={!!fieldErrors.stateRegion}
                />
                {fieldErrors.stateRegion ? (
                  <p className={fieldErrorClass()}>{fieldErrors.stateRegion}</p>
                ) : null}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="evt-country">
                  Country <span className="text-[#0B4D53]">*</span>
                </Label>
                <Input
                  id="evt-country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g., United Kingdom, United States"
                  required
                  className={fieldInputClass(fieldErrors.country)}
                  aria-invalid={!!fieldErrors.country}
                />
                {fieldErrors.country ? (
                  <p className={fieldErrorClass()}>{fieldErrors.country}</p>
                ) : (
                  <p className="text-[0.65rem] text-[#0B4D53]/60">
                    The map recenters as you complete the city and country.
                  </p>
                )}
              </div>
            </div>

            {!locationPicked ? (
              <p className="text-xs text-[#0B4D53]/70">
                Search above the map and press Enter, then click to drop a pin at the exact gathering spot.
              </p>
            ) : (
              <p className="text-xs text-[#0B4D53]/80">Location marked. Drag the pin to fine-tune if needed.</p>
            )}
            {fieldErrors.location ? <p className={fieldErrorClass()}>{fieldErrors.location}</p> : null}

            <CreateEventMap
              latitude={latitude}
              longitude={longitude}
              mapFocus={mapFocus}
              onPick={handleMapPick}
              mapTilerKey={mapTilerKey}
              searchQuery={mapSearchQuery}
              onSearchQueryChange={(value) => {
                setMapSearchQuery(value);
                if (mapSearchStatus && !mapSearchLoading) setMapSearchStatus(null);
              }}
              onSearchSubmit={() => void runMapSearch()}
              searchLoading={mapSearchLoading}
              searchStatus={mapSearchStatus}
              suggestions={mapSuggestions}
              onSearchSelect={selectMapSuggestion}
            />
          </CardContent>
        </Card>

        <Separator className="bg-border/80" />

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
          <Link
            href="/my-events"
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "w-full justify-center text-muted-foreground hover:bg-transparent hover:text-foreground sm:w-auto"
            )}
          >
            Cancel
          </Link>
          <Button
            type="submit"
            size="lg"
            className="w-full gap-2 rounded-xl bg-[#0B4D53] font-medium tracking-wide text-white shadow-sm transition-colors duration-200 hover:bg-[#0B4D53]/90 sm:min-w-[10rem] sm:w-auto"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Submitting…</span>
              </>
            ) : (
              "Submit for review"
            )}
          </Button>
        </div>

        {formToast ? (
          <div
            role="status"
            aria-live="polite"
            className={cn(
              "fixed inset-x-4 bottom-6 z-[1000] mx-auto max-w-md rounded-xl px-4 py-3 text-center text-sm leading-relaxed shadow-md ring-1 sm:inset-x-auto sm:right-6 sm:left-auto",
              formToastClass[formToast.variant]
            )}
          >
            {formToast.text}
          </div>
        ) : null}
      </form>
    </div>
  );
}
