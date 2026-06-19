import { describe, expect, it } from "vitest";

import { adminLoginSchema, mapLoginFieldErrors } from "../lib/admin-auth-validation.js";

describe("adminLoginSchema", () => {
  it("accepts valid credentials", () => {
    const result = adminLoginSchema.safeParse({
      email: "admin@example.com",
      password: "secret123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty email", () => {
    const result = adminLoginSchema.safeParse({ email: "", password: "secret123" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(mapLoginFieldErrors(result.error.flatten()).email).toBeTruthy();
    }
  });

  it("rejects invalid email", () => {
    const result = adminLoginSchema.safeParse({ email: "not-an-email", password: "secret123" });
    expect(result.success).toBe(false);
  });

  it("rejects password longer than 16 characters", () => {
    const result = adminLoginSchema.safeParse({
      email: "admin@example.com",
      password: "a".repeat(17),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(mapLoginFieldErrors(result.error.flatten()).password).toMatch(/16 characters/i);
    }
  });
});
