import { describe, expect, it } from "vitest";

import {
  buildAdminEventsQuery,
  getAdminDayBounds,
  getEventScheduleTiming,
} from "../lib/admin-events.js";

describe("admin-events", () => {
  it("buildAdminEventsQuery includes schedule and status filters", () => {
    const q = buildAdminEventsQuery({ page: 2, schedule: "upcoming", status: "APPROVED" });
    expect(q).toContain("page=2");
    expect(q).toContain("schedule=upcoming");
    expect(q).toContain("status=APPROVED");
  });

  it("getEventScheduleTiming classifies past, today, and upcoming", () => {
    const { startOfToday, endOfToday } = getAdminDayBounds(new Date("2026-06-09T12:00:00"));

    const past = getEventScheduleTiming({
      startDate: new Date(startOfToday.getTime() - 48 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(past).toBe("past");

    const today = getEventScheduleTiming({
      startDate: startOfToday.toISOString(),
      endDate: endOfToday.toISOString(),
    });
    expect(today).toBe("today");

    const upcoming = getEventScheduleTiming({
      startDate: new Date(endOfToday.getTime() + 60 * 60 * 1000).toISOString(),
      endDate: new Date(endOfToday.getTime() + 3 * 60 * 60 * 1000).toISOString(),
    });
    expect(upcoming).toBe("upcoming");
  });
});
