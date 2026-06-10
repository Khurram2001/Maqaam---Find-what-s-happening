/** Approved events shown per page on `/events` (3-column grid × 3 rows). */
export const BROWSE_EVENTS_PAGE_SIZE = 9;

/** ISO timestamp for start of the local calendar day (today 00:00). */
export function getBrowseEventsStartDateFrom() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

/**
 * Browse listings include gatherings starting today or later; past dates are hidden.
 * @param {{ startDate?: string }} event
 */
export function isCurrentOrUpcomingEvent(event) {
  const start = new Date(event.startDate ?? "");
  if (Number.isNaN(start.getTime())) return false;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return start >= startOfToday;
}

/**
 * @param {Array<{ startDate?: string }>} events
 */
export function filterCurrentOrUpcomingEvents(events) {
  return events.filter(isCurrentOrUpcomingEvent);
}
