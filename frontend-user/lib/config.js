/**
 * @returns {string} API base including `/api` prefix, no trailing slash
 */
export function getApiBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_API_BASE_URL is required in production builds.");
    }
    return "http://localhost:5000/api";
  }

  return raw.replace(/\/$/, "");
}
