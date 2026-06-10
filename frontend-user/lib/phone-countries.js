import {
  PHONE_COUNTRY_CODES_ALL,
  PHONE_COUNTRY_CODES_COMMON,
} from "./phone-country-codes-data.js";

export { PHONE_COUNTRY_CODES_ALL, PHONE_COUNTRY_CODES_COMMON };

export const DEFAULT_PHONE_COUNTRY_CODE = "+966";

/** E.164: 8–15 digits total (excluding +). */
export const E164_MIN_DIGITS = 8;
export const E164_MAX_DIGITS = 15;

/** @param {string} value Raw user input */
export function sanitizeCountryCode(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return trimmed.startsWith("+") ? "+" : "";

  // ITU calling codes are 1–3 digits; first digit cannot be 0.
  const normalized = digits.replace(/^0+/, "").slice(0, 3);
  if (!normalized) return "+";

  return `+${normalized}`;
}

/** @param {string} countryCode e.g. "+966" */
export function validateCountryCode(countryCode) {
  if (!countryCode?.trim()) {
    return "Country code is required.";
  }

  if (!/^\+[1-9]\d{0,2}$/.test(countryCode)) {
    return "Enter a valid country code starting with + (e.g. +966, +1, +44).";
  }

  return null;
}

/** @param {string} countryCode e.g. "+966" */
export function countryCodeDigitLength(countryCode) {
  return countryCode.replace(/\D/g, "").length;
}

/** @param {string} countryCode e.g. "+966" */
export function minLocalPhoneDigits(countryCode) {
  return Math.max(1, E164_MIN_DIGITS - countryCodeDigitLength(countryCode));
}

/** @param {string} countryCode e.g. "+966" */
export function maxLocalPhoneDigits(countryCode) {
  return Math.max(1, E164_MAX_DIGITS - countryCodeDigitLength(countryCode));
}

/** @param {string} countryCode @param {string} localNumber */
export function sanitizePhoneLocal(value, countryCode) {
  const digits = value.replace(/\D/g, "");
  return digits.slice(0, maxLocalPhoneDigits(countryCode));
}

/** @param {string} countryCode @param {string} localNumber */
export function buildE164Phone(countryCode, localNumber) {
  const code = sanitizeCountryCode(countryCode);
  const local = sanitizePhoneLocal(localNumber, code);
  return `${code}${local}`;
}

/** @param {string} countryCode @param {string} localNumber */
export function validatePhoneLocalFields(countryCode, localNumber) {
  const code = sanitizeCountryCode(countryCode);
  const local = sanitizePhoneLocal(localNumber ?? "", code);
  const minLocal = minLocalPhoneDigits(code);
  const maxLocal = maxLocalPhoneDigits(code);

  if (!local) {
    return "Phone number is required.";
  }

  if (local.length < minLocal) {
    return `Phone number must be at least ${minLocal} digit${minLocal === 1 ? "" : "s"}.`;
  }

  if (local.length > maxLocal) {
    return `Phone number must be at most ${maxLocal} digit${maxLocal === 1 ? "" : "s"}.`;
  }

  const e164 = buildE164Phone(code, local);
  if (!/^\+[1-9]\d{7,14}$/.test(e164)) {
    return "Enter a valid international phone number (E.164).";
  }

  return null;
}

/** @param {string} countryCode @param {string} localNumber */
export function validatePhoneFields(countryCode, localNumber) {
  const codeError = validateCountryCode(countryCode);
  if (codeError) {
    return codeError;
  }

  return validatePhoneLocalFields(countryCode, localNumber);
}

/** @deprecated Use validatePhoneFields */
export function validatePhoneE164(countryCode, localNumber) {
  return validatePhoneFields(countryCode, localNumber);
}

/**
 * Country codes for the register dropdown (common first, then all others).
 * @returns {Array<{ code: string; iso: string; name: string; label: string; group: "common" | "all" }>}
 */
export function getPhoneCountryOptions() {
  const commonKeys = new Set(
    PHONE_COUNTRY_CODES_COMMON.map((item) => `${item.iso}|${item.code}`)
  );

  const toOption = (item, group) => ({
    ...item,
    label: `${item.code}`,
    group,
  });

  const common = PHONE_COUNTRY_CODES_COMMON.map((item) => toOption(item, "common"));
  const rest = PHONE_COUNTRY_CODES_ALL.filter(
    (item) => !commonKeys.has(`${item.iso}|${item.code}`)
  ).map((item) => toOption(item, "all"));

  return [...common, ...rest];
}
