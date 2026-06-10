"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Loader2, MapPin, Search } from "lucide-react";
import "leaflet/dist/leaflet.css";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DEFAULT_CENTER = [24.7136, 46.6753];

function useMarkerIcon() {
  return useMemo(
    () =>
      L.divIcon({
        className: "maqaam-marker",
        html:
          '<div style="width:14px;height:14px;background:#0B4D53;border:2px solid #fff;border-radius:9999px;box-shadow:0 1px 4px rgba(0,0,0,.28)"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      }),
    []
  );
}

function MapClickPick({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapViewSync({ focus }) {
  const map = useMap();
  useEffect(() => {
    if (!focus) return;
    map.setView([focus.lat, focus.lng], focus.zoom ?? 14, { animate: true });
  }, [focus, map]);
  return null;
}

/**
 * @param {{
 *   latitude: number | null;
 *   longitude: number | null;
 *   mapFocus?: { lat: number; lng: number; zoom?: number; revision: number } | null;
 *   onPick: (lat: number, lng: number) => void;
 *   mapTilerKey?: string;
 *   readOnly?: boolean;
 *   embedded?: boolean;
 *   searchQuery?: string;
 *   onSearchQueryChange?: (value: string) => void;
 *   onSearchSubmit?: () => void;
 *   searchLoading?: boolean;
 *   searchStatus?: string | null;
 *   suggestions?: Array<{ id: string; label: string; lat: number; lon: number }>;
 *   onSearchSelect?: (suggestion: { id: string; label: string; lat: number; lon: number; formattedAddress?: string; addressLine?: string | null; providerPlaceId?: string | null }) => void;
 * }} props
 */
export function CreateEventMap({
  latitude,
  longitude,
  mapFocus = null,
  onPick,
  mapTilerKey,
  readOnly = false,
  embedded = false,
  searchQuery = "",
  onSearchQueryChange,
  onSearchSubmit,
  searchLoading = false,
  searchStatus = null,
  suggestions = [],
  onSearchSelect,
}) {
  const icon = useMarkerIcon();
  const [searchFocused, setSearchFocused] = useState(false);

  const hasPoint =
    latitude != null && longitude != null && Number.isFinite(latitude) && Number.isFinite(longitude);
  const hasMapFocus =
    mapFocus?.lat != null &&
    mapFocus?.lng != null &&
    Number.isFinite(mapFocus.lat) &&
    Number.isFinite(mapFocus.lng);

  const center = hasPoint
    ? [latitude, longitude]
    : hasMapFocus
      ? [mapFocus.lat, mapFocus.lng]
      : DEFAULT_CENTER;
  const initialZoom = hasPoint ? 14 : hasMapFocus ? (mapFocus.zoom ?? 12) : 11;

  const tileUrl =
    mapTilerKey && mapTilerKey.length > 4
      ? `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${encodeURIComponent(mapTilerKey)}`
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const attribution =
    mapTilerKey && mapTilerKey.length > 4
      ? '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; OpenStreetMap'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  const showSearch = !readOnly && typeof onSearchQueryChange === "function";

  function handleSearchKeyDown(e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    e.stopPropagation();
    onSearchSubmit?.();
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        embedded ? "rounded-none ring-0" : "rounded-xl ring-1 ring-border/80"
      )}
    >
      {showSearch ? (
        <div className="absolute top-2 left-14 z-[500] w-full max-w-[280px] space-y-1 sm:top-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground sm:left-3" />
            {searchLoading ? (
              <Loader2
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-[#0B4D53]"
                aria-hidden
              />
            ) : null}
            <Input
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => {
                window.setTimeout(() => setSearchFocused(false), 150);
              }}
              className={cn(
                "h-9 rounded-lg border border-border/80 bg-background/95 pl-8 text-sm shadow-md backdrop-blur-sm focus-visible:border-[#0B4D53] focus-visible:ring-1 focus-visible:ring-[#0B4D53] sm:h-10 sm:pl-9",
                searchLoading ? "pr-9" : ""
              )}
              placeholder="Search location on map…"
              autoComplete="off"
              enterKeyHint="search"
              aria-label="Search location on map"
            />
            {searchFocused && suggestions.length > 0 ? (
              <ul
                className="absolute z-[600] mt-1 max-h-52 w-full overflow-auto rounded-lg border border-border bg-popover py-1 text-sm shadow-lg ring-1 ring-foreground/10"
                role="listbox"
              >
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className="flex w-full items-start gap-2 px-3 py-2 text-left text-foreground hover:bg-muted"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onSearchSelect?.(s)}
                    >
                      <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="line-clamp-2">{s.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          {searchStatus ? (
            <p className="break-words px-0.5 text-[0.65rem] leading-snug text-muted-foreground sm:px-1">{searchStatus}</p>
          ) : null}
        </div>
      ) : null}

      <MapContainer
        center={center}
        zoom={initialZoom}
        className={cn(
          "isolate z-0 w-full [&_.leaflet-control-attribution]:text-[10px]",
          embedded
            ? "h-[min(14rem,38vh)] sm:h-[min(18rem,45vh)]"
            : "h-[min(16rem,42vh)] sm:h-[min(24rem,55vh)]"
        )}
        scrollWheelZoom={!readOnly}
      >
        <TileLayer
          attribution={attribution}
          url={tileUrl}
          {...(!mapTilerKey || mapTilerKey.length <= 4 ? { subdomains: "abc" } : {})}
        />
        {!readOnly ? <MapClickPick onPick={onPick} /> : null}
        {hasMapFocus ? <MapViewSync focus={mapFocus} /> : null}
        {hasPoint ? (
          <Marker
            position={[latitude, longitude]}
            icon={icon}
            draggable={!readOnly}
            eventHandlers={
              readOnly
                ? undefined
                : {
                    dragend: (e) => {
                      const ll = e.target.getLatLng();
                      onPick(ll.lat, ll.lng);
                    },
                  }
            }
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
