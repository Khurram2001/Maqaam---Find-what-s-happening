import { describe, expect, it } from "vitest";

import {
  isDeleteConfirmationTokenValid,
  isUuid,
  normalizeRejectReason,
  normalizeTargetType,
  slugifyCategorySlug,
  validateAuditFilters,
  validateCategoryPayload,
  validateRejectReason,
  validateTargetType,
} from "../lib/admin-validation.js";

describe("admin-validation", () => {
  it("isUuid accepts valid UUID v4", () => {
    expect(isUuid("f47ac10b-58cc-4372-a567-0e02b2c3d479")).toBe(true);
  });

  it("isUuid rejects invalid value", () => {
    expect(isUuid("123")).toBe(false);
  });

  it("validateRejectReason enforces limits", () => {
    expect(validateRejectReason("ok")).toBe("Rejection reason must be between 3 and 500 characters.");
    expect(validateRejectReason("Valid reason")).toBe("");
  });

  it("normalizeRejectReason trims surrounding spaces", () => {
    expect(normalizeRejectReason("  spam  ")).toBe("spam");
  });

  it("normalizeTargetType uppercases and trims", () => {
    expect(normalizeTargetType(" event ")).toBe("EVENT");
  });

  it("validateTargetType rejects invalid format", () => {
    expect(validateTargetType("event-1")).toBe("Target type must use uppercase letters/underscore only (example: EVENT).");
  });

  it("validateAuditFilters returns normalized values", () => {
    const res = validateAuditFilters({
      actorUserId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      targetType: " event ",
      targetId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    });
    expect(res.ok).toBe(true);
    expect(res.value).toEqual({
      actorUserId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      targetType: "EVENT",
      targetId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    });
  });

  it("validateAuditFilters rejects invalid actor UUID", () => {
    const res = validateAuditFilters({ actorUserId: "abc" });
    expect(res.ok).toBe(false);
    expect(res.error).toBe("Actor user ID must be a valid UUID.");
  });

  it("validateAuditFilters rejects invalid target UUID", () => {
    const res = validateAuditFilters({ targetId: "abc" });
    expect(res.ok).toBe(false);
    expect(res.error).toBe("Target ID must be a valid UUID.");
  });

  it("isDeleteConfirmationTokenValid requires exact token", () => {
    expect(isDeleteConfirmationTokenValid("DELETE")).toBe(true);
    expect(isDeleteConfirmationTokenValid(" delete ")).toBe(false);
  });

  it("slugifyCategorySlug normalizes names", () => {
    expect(slugifyCategorySlug("Youth Circles")).toBe("youth-circles");
    expect(slugifyCategorySlug("  Eid & Social!  ")).toBe("eid-social");
  });

  it("validateCategoryPayload enforces name and slug rules", () => {
    expect(validateCategoryPayload({ name: "A", slug: "ok-slug" })).toContain("Name");
    expect(validateCategoryPayload({ name: "Valid Name", slug: "Bad Slug" })).toContain("Slug");
    expect(validateCategoryPayload({ name: "Youth Circles", slug: "youth-circles" })).toBe("");
  });
});
