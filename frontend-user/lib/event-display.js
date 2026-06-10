/** Dev-only sample copy when stored descriptions are smoke-test placeholders. */
const SAMPLE_DESCRIPTIONS = [
  "Annual Eid al-Adha community gathering and luncheon for families.",
  "Monthly youth interactive halaqa focused on navigating spiritual identity.",
];

const EVENT_DETAIL_DESCRIPTION_FALLBACK =
  "Join us for our annual community Eid Qurbani luncheon. Gather with families, neighbors, and community members to share the joy of Eid, enjoy a prepared meal, and connect with your local community.";

const PLACEHOLDER_PATTERN =
  /^(smoke event|test event|sample event|dummy|lorem ipsum|description for validation|at least 10|fields match)/i;

function isDevPlaceholderFallbackEnabled() {
  return process.env.NODE_ENV !== "production";
}

function isPlaceholderDescription(text) {
  const value = (text ?? "").trim();
  return !value || value.length < 20 || PLACEHOLDER_PATTERN.test(value);
}

/**
 * @param {string | null | undefined} description
 * @param {number} [index=0]
 */
export function displayEventDescription(description, index = 0) {
  const trimmed = (description ?? "").trim();
  if (!isDevPlaceholderFallbackEnabled() || !isPlaceholderDescription(trimmed)) {
    return trimmed;
  }
  return SAMPLE_DESCRIPTIONS[index % SAMPLE_DESCRIPTIONS.length];
}

/** @param {string | null | undefined} description */
export function displayEventDetailDescription(description) {
  const trimmed = (description ?? "").trim();
  if (!isDevPlaceholderFallbackEnabled() || !isPlaceholderDescription(trimmed)) {
    return trimmed;
  }
  return EVENT_DETAIL_DESCRIPTION_FALLBACK;
}
