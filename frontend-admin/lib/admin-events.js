/** @typedef {"all" | "past" | "today" | "upcoming"} AdminScheduleFilter */
/** @typedef {"all" | "PENDING" | "APPROVED" | "REJECTED"} AdminStatusFilter */

export const ADMIN_EVENTS_PAGE_SIZE = 10;

/** @returns {{ startOfToday: Date; endOfToday: Date }} */
export function getAdminDayBounds(reference = new Date()) {
  const startOfToday = new Date(reference);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(reference);
  endOfToday.setHours(23, 59, 59, 999);
  return { startOfToday, endOfToday };
}

/**
 * Classify a gathering by schedule relative to today.
 * @param {{ startDate?: string; endDate?: string }} event
 * @returns {"past" | "today" | "upcoming"}
 */
export function getEventScheduleTiming(event) {
  const start = new Date(event.startDate ?? "");
  const end = new Date(event.endDate ?? "");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "upcoming";

  const { startOfToday, endOfToday } = getAdminDayBounds();
  if (end < startOfToday) return "past";
  if (start > endOfToday) return "upcoming";
  return "today";
}

/**
 * @param {{
 *   page?: number;
 *   limit?: number;
 *   schedule?: AdminScheduleFilter;
 *   status?: AdminStatusFilter;
 * }} filters
 */
export function buildAdminEventsQuery(filters = {}) {
  const params = new URLSearchParams();
  const page = filters.page ?? 1;
  const limit = filters.limit ?? ADMIN_EVENTS_PAGE_SIZE;

  params.set("page", String(page));
  params.set("limit", String(limit));

  if (filters.schedule && filters.schedule !== "all") {
    params.set("schedule", filters.schedule);
  }
  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status);
  }

  return params.toString();
}

export const SCHEDULE_FILTER_OPTIONS = [
  { value: "all", label: "All dates" },
  { value: "past", label: "Past" },
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
];

export const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];
