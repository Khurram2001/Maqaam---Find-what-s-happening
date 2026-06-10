const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * @param {string} value
 */
export function isUuid(value) {
  return UUID_RE.test((value || "").trim());
}

/**
 * @param {string} value
 */
export function normalizeRejectReason(value) {
  return String(value || "").trim();
}

/**
 * @param {string} value
 */
export function validateRejectReason(value) {
  const normalized = normalizeRejectReason(value);
  if (normalized.length < 3 || normalized.length > 500) {
    return "Rejection reason must be between 3 and 500 characters.";
  }
  return "";
}

/**
 * @param {string} value
 */
export function normalizeTargetType(value) {
  return String(value || "").trim().toUpperCase();
}

/**
 * @param {string} value
 */
export function validateTargetType(value) {
  const normalized = normalizeTargetType(value);
  if (!normalized) return "";
  if (!/^[A-Z_]{2,32}$/.test(normalized)) {
    return "Target type must use uppercase letters/underscore only (example: EVENT).";
  }
  return "";
}

/**
 * @param {{ actorUserId?: string; targetType?: string; targetId?: string }} params
 */
export function validateAuditFilters(params) {
  const actorUserId = String(params?.actorUserId || "").trim();
  const targetId = String(params?.targetId || "").trim();
  const targetType = normalizeTargetType(params?.targetType || "");

  if (actorUserId && !isUuid(actorUserId)) {
    return { ok: false, error: "Actor user ID must be a valid UUID." };
  }
  if (targetId && !isUuid(targetId)) {
    return { ok: false, error: "Target ID must be a valid UUID." };
  }
  const targetTypeError = validateTargetType(targetType);
  if (targetTypeError) {
    return { ok: false, error: targetTypeError };
  }

  return {
    ok: true,
    value: { actorUserId, targetType, targetId },
  };
}

/**
 * @param {string} value
 */
export function isDeleteConfirmationTokenValid(value) {
  return String(value || "").trim() === "DELETE";
}

/**
 * @param {string} name
 */
export function slugifyCategorySlug(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/**
 * @param {{ name?: string; slug?: string }} payload
 */
export function validateCategoryPayload(payload) {
  const name = String(payload?.name || "").trim();
  const slug = String(payload?.slug || "").trim();

  if (name.length < 2 || name.length > 100) {
    return "Name must be between 2 and 100 characters.";
  }
  if (slug.length < 2 || slug.length > 120) {
    return "Slug must be between 2 and 120 characters.";
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return "Slug must use lowercase letters, numbers, and hyphens only.";
  }
  return "";
}
