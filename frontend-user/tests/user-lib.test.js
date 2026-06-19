import { afterEach, describe, expect, it, vi } from "vitest";

import { apiJson } from "../lib/api-client.js";
import { getApiBaseUrl } from "../lib/config.js";
import { formatEventRange } from "../lib/format-event.js";
import {
  buildE164Phone,
  sanitizeCountryCode,
  validateCountryCode,
  validatePhoneFields,
} from "../lib/phone-countries.js";
import { getPublicEvents } from "../lib/public-api.js";
import { validateRegisterForm } from "../lib/register-validation.js";

const ORIGINAL_ENV = process.env.NEXT_PUBLIC_API_BASE_URL;

afterEach(() => {
  process.env.NEXT_PUBLIC_API_BASE_URL = ORIGINAL_ENV;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("user lib helpers", () => {
  it("getApiBaseUrl uses fallback and removes trailing slash", () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://example.com/api/";
    expect(getApiBaseUrl()).toBe("https://example.com/api");
  });

  it("formatEventRange returns same-day delimiter", () => {
    const out = formatEventRange("2026-01-01T10:00:00.000Z", "2026-01-01T12:00:00.000Z");
    expect(out).toContain(" – ");
  });

  it("formatEventRange returns multi-day delimiter", () => {
    const out = formatEventRange("2026-01-01T10:00:00.000Z", "2026-01-02T12:00:00.000Z");
    expect(out).toContain(" → ");
  });

  it("apiJson sends JSON body and credentials", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://example.com/api";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { ok: true } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await apiJson("/auth/login", {
      method: "POST",
      body: { email: "a@b.com", password: "pw" },
    });

    expect(res.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/api/auth/login",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ email: "a@b.com", password: "pw" }),
      })
    );
  });

  it("apiJson returns network-safe error payload", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const res = await apiJson("/auth/me");
    expect(res.ok).toBe(false);
    expect(res.status).toBe(0);
    expect(res.json?.error?.code).toBe("NETWORK_ERROR");
  });

  it("getPublicEvents returns mapped response on success", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://example.com/api";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          events: [{ id: "1", title: "A" }],
          pagination: { page: 2, limit: 5, total: 10, totalPages: 2 },
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const out = await getPublicEvents(2, 5, { q: "music", category: "live" });
    expect(out.events).toHaveLength(1);
    expect(out.pagination.page).toBe(2);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/events?"),
      expect.objectContaining({ next: { revalidate: 300 } })
    );
  });

  it("getPublicEvents returns empty payload when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    const out = await getPublicEvents(1, 12);
    expect(out.events).toEqual([]);
    expect(out.pagination.total).toBe(0);
  });

  it("sanitizeCountryCode normalizes manual country code input", () => {
    expect(sanitizeCountryCode("966")).toBe("+966");
    expect(sanitizeCountryCode("+44")).toBe("+44");
    expect(validateCountryCode("+0")).toMatch(/valid country code/i);
    expect(validateCountryCode("+966")).toBeNull();
  });

  it("validatePhoneFields enforces E.164 min/max lengths", () => {
    expect(validatePhoneFields("", "")).toMatch(/country code/i);
    expect(validatePhoneFields("+966", "")).toMatch(/required/i);
    expect(validatePhoneFields("+966", "12")).toMatch(/at least/i);
    expect(validatePhoneFields("+966", "501234567")).toBeNull();
    expect(buildE164Phone("966", "501234567")).toBe("+966501234567");
  });

  it("validateRegisterForm rejects passwords longer than 16 characters", () => {
    const result = validateRegisterForm({
      name: "Ahmad Ali",
      email: "user@example.com",
      countryCode: "+966",
      phoneLocal: "501234567",
      password: "SecurePass1234567",
      confirmPassword: "SecurePass1234567",
    });
    expect(result.success).toBe(false);
    expect(result.errors.password).toMatch(/16 characters/i);
  });

  it("validateRegisterForm requires all fields and matching passwords", () => {
    const fail = validateRegisterForm({
      name: "",
      email: "not-an-email",
      countryCode: "+966",
      phoneLocal: "",
      password: "short",
      confirmPassword: "different",
    });
    expect(fail.success).toBe(false);
    expect(fail.firstError).toBeTruthy();
    expect(fail.errors.email).toBeTruthy();
    expect(fail.errors.countryCode || fail.errors.phoneNumber).toBeTruthy();

    const ok = validateRegisterForm({
      name: "Ahmad Ali",
      email: "user@example.com",
      countryCode: "+966",
      phoneLocal: "501234567",
      password: "SecurePass1",
      confirmPassword: "SecurePass1",
    });
    expect(ok.success).toBe(true);
    expect(ok.data.phoneNumber).toBe("+966501234567");
  });
});
