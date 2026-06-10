/**
 * Client-side place search (MapTiler primary, then LocationIQ, Geoapify).
 * @typedef {{
 *   id: string;
 *   label: string;
 *   lat: number;
 *   lon: number;
 *   formattedAddress: string;
 *   addressLine: string | null;
 *   city: string | null;
 *   state: string | null;
 *   country: string | null;
 *   providerPlaceId: string | null;
 * }} GeocodePlace
 */

function mapTilerKey() {
  const key = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
  if (!key || key.length <= 4) return null;
  return key;
}

function locationIqKey() {
  const key = process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY;
  if (!key || key === "your_locationiq_key") return null;
  return key;
}

function geoapifyKey() {
  const key = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
  if (!key || key === "your_geoapify_key") return null;
  return key;
}

function mapLocationIqItem(item) {
  const lat = Number.parseFloat(item.lat);
  const lon = Number.parseFloat(item.lon);
  const label = item.display_name ?? "";
  const road = item.address?.road ?? item.address?.house_number;
  const addressLine = road
    ? `${item.address?.house_number ? `${item.address.house_number} ` : ""}${road}`.trim()
    : null;
  const city =
    item.address?.city ?? item.address?.town ?? item.address?.village ?? item.address?.county ?? null;
  const state = item.address?.state ?? item.address?.region ?? null;
  const country = item.address?.country ?? null;

  return {
    id: String(item.place_id ?? `${lat},${lon}`),
    label,
    lat: Number.isFinite(lat) ? lat : 0,
    lon: Number.isFinite(lon) ? lon : 0,
    formattedAddress: label,
    addressLine,
    city,
    state,
    country,
    providerPlaceId: item.osm_type && item.osm_id ? `${item.osm_type}:${item.osm_id}` : null,
  };
}

function mapGeoapifyFeature(feature) {
  const [lon, lat] = feature.geometry?.coordinates ?? [0, 0];
  const props = feature.properties ?? {};
  const label = props.formatted ?? props.address_line1 ?? props.name ?? "";

  return {
    id: String(props.place_id ?? `${lat},${lon}`),
    label,
    lat: Number.isFinite(lat) ? lat : 0,
    lon: Number.isFinite(lon) ? lon : 0,
    formattedAddress: label,
    addressLine: props.address_line1 ?? props.street ?? null,
    city: props.city ?? props.town ?? props.village ?? props.county ?? null,
    state: props.state ?? props.region ?? null,
    country: props.country ?? null,
    providerPlaceId: props.place_id ? String(props.place_id) : null,
  };
}

/** @param {Record<string, unknown>} feature */
function mapMapTilerFeature(feature) {
  const center = feature.center ?? feature.geometry?.coordinates ?? [0, 0];
  const [lon, lat] = Array.isArray(center) ? center : [0, 0];
  const label = String(feature.place_name ?? feature.text ?? "");
  let city = null;
  let state = null;
  let country = null;

  if (Array.isArray(feature.context)) {
    for (const ctx of feature.context) {
      const ctxId = String(ctx?.id ?? "");
      const text = ctx?.text ? String(ctx.text) : null;
      if (!text) continue;
      if (/^(place|municipality|locality|city)\./.test(ctxId)) city = city ?? text;
      if (/^(region|district|state)\./.test(ctxId)) state = state ?? text;
      if (/^country\./.test(ctxId)) country = text;
    }
  }

  const street = feature.text ? String(feature.text) : null;
  const addressLine = feature.address && street ? `${feature.address} ${street}`.trim() : street;

  return {
    id: String(feature.id ?? `${lat},${lon}`),
    label,
    lat: Number.isFinite(lat) ? lat : 0,
    lon: Number.isFinite(lon) ? lon : 0,
    formattedAddress: label,
    addressLine,
    city,
    state,
    country,
    providerPlaceId: feature.id ? String(feature.id) : null,
  };
}

async function mapTilerRequest(query, limit, autocomplete = true) {
  const key = mapTilerKey();
  if (!key || query.trim().length < 2) return [];

  const encodedQuery = encodeURIComponent(query.trim());
  const url = `https://api.maptiler.com/geocoding/${encodedQuery}.json?key=${encodeURIComponent(key)}&limit=${limit}&autocomplete=${autocomplete ? "true" : "false"}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data?.features)) return [];
    return data.features.map(mapMapTilerFeature);
  } catch {
    return [];
  }
}

async function locationIqRequest(path, query, limit) {
  const key = locationIqKey();
  if (!key || query.trim().length < 2) return [];

  const url = `https://api.locationiq.com/v1/${path}?key=${encodeURIComponent(key)}&q=${encodeURIComponent(query.trim())}&limit=${limit}&format=json`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map(mapLocationIqItem);
  } catch {
    return [];
  }
}

async function geoapifyRequest(endpoint, query, limit) {
  const key = geoapifyKey();
  if (!key || query.trim().length < 2) return [];

  const url = `https://api.geoapify.com/v1/geocode/${endpoint}?text=${encodeURIComponent(query.trim())}&limit=${limit}&apiKey=${encodeURIComponent(key)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const features = data?.features;
    if (!Array.isArray(features)) return [];
    return features.map(mapGeoapifyFeature);
  } catch {
    return [];
  }
}

/** @returns {Promise<GeocodePlace[]>} */
export async function searchPlaces(query, limit = 6) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const fromMapTiler = await mapTilerRequest(trimmed, limit, true);
  if (fromMapTiler.length > 0) return fromMapTiler;

  const fromLocationIq = await locationIqRequest("autocomplete", trimmed, limit);
  if (fromLocationIq.length > 0) return fromLocationIq;

  return geoapifyRequest("autocomplete", trimmed, limit);
}

/** Best match for explicit search (Enter key). */
export async function resolvePlace(query) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return null;

  const fromMapTiler = await mapTilerRequest(trimmed, 1, false);
  if (fromMapTiler[0]) return fromMapTiler[0];

  const fromMapTilerAutocomplete = await mapTilerRequest(trimmed, 1, true);
  if (fromMapTilerAutocomplete[0]) return fromMapTilerAutocomplete[0];

  const fromLocationIqSearch = await locationIqRequest("search", trimmed, 1);
  if (fromLocationIqSearch[0]) return fromLocationIqSearch[0];

  const fromLocationIqAutocomplete = await locationIqRequest("autocomplete", trimmed, 1);
  if (fromLocationIqAutocomplete[0]) return fromLocationIqAutocomplete[0];

  const fromGeoapify = await geoapifyRequest("search", trimmed, 1);
  if (fromGeoapify[0]) return fromGeoapify[0];

  const fromGeoapifyAutocomplete = await geoapifyRequest("autocomplete", trimmed, 1);
  return fromGeoapifyAutocomplete[0] ?? null;
}

export function geocoderConfigured() {
  return Boolean(mapTilerKey() || locationIqKey() || geoapifyKey());
}
