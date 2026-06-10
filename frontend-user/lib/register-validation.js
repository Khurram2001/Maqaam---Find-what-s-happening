import { z } from "zod";

import {
  buildE164Phone,
  sanitizeCountryCode,
  validateCountryCode,
  validatePhoneLocalFields,
} from "./phone-countries.js";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Please enter a valid email address.");

const passwordSchema = z
  .string()
  .min(1, "Password is required.")
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be at most 128 characters.")
  .regex(/[a-z]/, "Password must include at least one lowercase letter.")
  .regex(/[A-Z]/, "Password must include at least one uppercase letter.")
  .regex(/\d/, "Password must include at least one number.");

export const registerFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required.")
      .min(2, "Name must be at least 2 characters.")
      .max(120, "Name must be at most 120 characters."),
    email: emailSchema,
    countryCode: z.string().min(1, "Country code is required."),
    phoneLocal: z.string().trim(),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .superRefine((data, ctx) => {
    const codeError = validateCountryCode(data.countryCode);
    if (codeError) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: codeError,
        path: ["countryCode"],
      });
    } else {
      const phoneError = validatePhoneLocalFields(data.countryCode, data.phoneLocal);
      if (phoneError) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: phoneError,
          path: ["phoneNumber"],
        });
      }
    }

    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match.",
        path: ["confirmPassword"],
      });
    }
  });

/** @param {z.ZodFlattenedError["fieldErrors"]} fieldErrors */
export function mapRegisterFieldErrors(fieldErrors) {
  const out = {};
  if (!fieldErrors) return out;
  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (messages?.[0]) out[key] = messages[0];
  }
  return out;
}

/**
 * @param {{
 *   name: string;
 *   email: string;
 *   countryCode: string;
 *   phoneLocal: string;
 *   password: string;
 *   confirmPassword: string;
 * }} input
 */
export function validateRegisterForm(input) {
  const parsed = registerFormSchema.safeParse(input);
  if (parsed.success) {
    return {
      success: true,
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        phoneNumber: buildE164Phone(
          sanitizeCountryCode(parsed.data.countryCode),
          parsed.data.phoneLocal
        ),
        password: parsed.data.password,
      },
      errors: {},
      firstError: null,
    };
  }

  const flat = parsed.error.flatten();
  const errors = mapRegisterFieldErrors(flat.fieldErrors);
  const firstError =
    parsed.error.issues[0]?.message ?? "Please complete all required fields correctly.";

  return {
    success: false,
    data: null,
    errors,
    firstError,
  };
}
