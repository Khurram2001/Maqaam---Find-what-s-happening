import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Please enter a valid email address."),
  password: z
    .string()
    .min(1, "Password is required.")
    .max(16, "Password must be at most 16 characters."),
});

export function mapLoginFieldErrors(flat) {
  const out = {};
  const fe = flat.fieldErrors;
  if (!fe) return out;
  for (const [key, messages] of Object.entries(fe)) {
    if (messages?.[0]) out[key] = messages[0];
  }
  return out;
}
