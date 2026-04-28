# Mapping and geocoding (cost-conscious)

Google Maps is not used (non-profit budget). Location and map UI live in the Next.js frontends; the API stores coordinates and address text only.

## Stack

| Concern | Choice |
|--------|--------|
| Map UI | [Leaflet](https://leafletjs.com/) with [`react-leaflet`](https://react-leaflet.js.org/) |
| Raster tiles | [MapTiler](https://www.maptiler.com/) free tier, or OpenStreetMap-derived tiles where policy allows |
| Address autocomplete / geocode | [LocationIQ](https://locationiq.com/) or [Geoapify](https://www.geoapify.com/) (client-side search → lat/lng + optional `providerPlaceId` for the API) |

## Phase 2.2 (features)

- **Event grid:** Prefer static map thumbnails (e.g. small Leaflet snapshot or pre-rendered image from stored lat/lng) or a simple location pin icon to limit tile requests.
- **Search bar:** Use LocationIQ (or Geoapify) for address → coordinates; send `latitude`, `longitude`, `formattedAddress`, and optional `providerPlaceId` to the backend per [api-contract.md](api-contract.md).

## Environment variables (frontends)

Set in `frontend-user/.env.local` and `frontend-admin/.env.local` as needed (see each app’s `.env.example`). Keys must remain `NEXT_PUBLIC_*` only for values that are safe to expose in the browser (tile URLs with key in query string, or public geocoder keys with domain restrictions where the provider supports it).

## Database note

If an older database still has a `googlePlaceId` column, create a Prisma migration to rename it to `providerPlaceId` (or reset the dev database) so it matches [backend/prisma/schema.prisma](../backend/prisma/schema.prisma).
