import { getApiBaseUrl } from "./config";

let refreshInFlight = null;

async function tryRefreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${getApiBaseUrl()}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).finally(() => {
      refreshInFlight = null;
    });
  }

  try {
    const res = await refreshInFlight;
    return res.ok;
  } catch {
    return false;
  }
}

const NO_REFRESH_PATHS = new Set(["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"]);

/**
 * @param {string} path - e.g. `/auth/login` (leading slash, no base)
 * @param {{ method?: string; body?: unknown; headers?: Record<string, string> }} [options]
 * @param {{ retry?: boolean }} [meta]
 */
export async function apiJson(path, options = {}, meta = {}) {
  const { method = "GET", body, headers = {} } = options;
  const { retry = false } = meta;
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const res = await fetch(url, {
      method,
      credentials: "include",
      headers: {
        ...(body !== undefined && body !== null ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
    });

    const json = await res.json().catch(() => ({}));

    if (res.status === 401 && !retry && !NO_REFRESH_PATHS.has(path)) {
      const refreshed = await tryRefreshSession();
      if (refreshed) {
        return apiJson(path, options, { retry: true });
      }
    }

    return { ok: res.ok, status: res.status, json };
  } catch {
    return {
      ok: false,
      status: 0,
      json: {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: "Could not reach the server. Is the API running and NEXT_PUBLIC_API_BASE_URL correct?",
        },
      },
    };
  }
}
