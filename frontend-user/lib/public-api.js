import { unstable_cache } from "next/cache";

import { getApiBaseUrl } from "./config";

/** Shared ISR / fetch cache window for public event listings (5 minutes). */
export const PUBLIC_EVENTS_REVALIDATE = 300;

/**
 * @param {number} page
 * @param {number} limit
 * @param {{ q?: string; category?: string; startDateFrom?: string; startDateTo?: string; sort?: string }} [filters]
 */
async function fetchPublicEvents(page = 1, limit = 12, filters = {}) {
  const base = getApiBaseUrl();
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.startDateFrom) params.set("startDateFrom", filters.startDateFrom);
  if (filters.startDateTo) params.set("startDateTo", filters.startDateTo);
  if (filters.sort) params.set("sort", filters.sort);

  const empty = {
    events: [],
    pagination: { page: 1, limit, total: 0, totalPages: 0 },
  };

  try {
    const res = await fetch(`${base}/events?${params}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: PUBLIC_EVENTS_REVALIDATE },
    });

    if (!res.ok) return empty;

    const json = await res.json();
    if (!json.success || !json.data) return empty;

    return {
      events: json.data.events ?? [],
      pagination: json.data.pagination ?? {
        page: 1,
        limit,
        total: 0,
        totalPages: 0,
      },
    };
  } catch {
    // Build-time / offline: API not reachable
    return empty;
  }
}

const getCachedPublicEventsInternal = unstable_cache(
  async (page, limit, filtersJson) => fetchPublicEvents(page, limit, JSON.parse(filtersJson)),
  ["public-events-list"],
  { revalidate: PUBLIC_EVENTS_REVALIDATE }
);

/**
 * Server-side cached public events fetch (deduped across RSC renders).
 * @param {number} page
 * @param {number} limit
 * @param {{ q?: string; category?: string; startDateFrom?: string; startDateTo?: string; sort?: string }} [filters]
 */
export async function getCachedPublicEvents(page = 1, limit = 12, filters = {}) {
  return getCachedPublicEventsInternal(page, limit, JSON.stringify(filters));
}

/**
 * @param {number} page
 * @param {number} limit
 * @param {{ q?: string; category?: string; startDateFrom?: string; startDateTo?: string; sort?: string }} [filters]
 */
export async function getPublicEvents(page = 1, limit = 12, filters = {}) {
  return fetchPublicEvents(page, limit, filters);
}

export async function getTopUpcomingEvents(limit = 3) {
  const now = new Date();
  const startDateFrom = now.toISOString();
  const { events } = await getCachedPublicEvents(1, 24, { startDateFrom });

  return events
    .filter((event) => {
      const eventStart = new Date(event.startDate);
      return !Number.isNaN(eventStart.getTime()) && eventStart >= now;
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, limit);
}
