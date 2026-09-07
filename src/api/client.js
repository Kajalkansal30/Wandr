function resolveApiBase(raw) {
  let value = (raw || "http://localhost:8080").trim().replace(/\/$/, "");
  if (!value) return "http://localhost:8080";

  const hadScheme = /^https?:\/\//i.test(value);
  let host = value.replace(/^https?:\/\//i, "");

  if (host && !host.includes(".") && !/^localhost(:\d+)?$/i.test(host) && !/^127\.0\.0\.1(:\d+)?$/.test(host)) {
    host = `${host}.onrender.com`;
  }

  if (/^localhost(:\d+)?$/i.test(host) || /^127\.0\.0\.1(:\d+)?$/.test(host)) {
    return `http://${host}`;
  }
  if (hadScheme && /^http:\/\//i.test(value) && !host.endsWith(".onrender.com")) {
    return `http://${host}`;
  }
  return `https://${host}`;
}

const API_BASE = resolveApiBase(import.meta.env.VITE_API_URL);
const ACCESS_KEY = "wandr_access";

const RETRYABLE_STATUS = new Set([408, 429, 502, 503, 504]);
const IDEMPOTENT = new Set(["GET", "HEAD", "OPTIONS"]);

export class ApiError extends Error {
  constructor(message, status, code, requestId) {
    super(message);
    this.status = status;
    this.code = code || null;
    this.requestId = requestId || null;
  }
}

export function getToken() {
  return sessionStorage.getItem(ACCESS_KEY) || localStorage.getItem("wandr_token");
}

export function setToken(token) {
  if (token) {
    sessionStorage.setItem(ACCESS_KEY, token);
    localStorage.removeItem("wandr_token");
  } else {
    sessionStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem("wandr_token");
  }
}

let refreshPromise = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        setToken(null);
        throw new ApiError("Session expired", 401, "AUTH_ERROR");
      }
      const data = await res.json();
      setToken(data.token);
      return data;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseError(res) {
  let message = `Request failed (${res.status})`;
  let code = null;
  let requestId = res.headers.get("X-Request-Id");
  try {
    const data = await res.json();
    message = data.message || data.error || message;
    code = data.code || null;
    requestId = data.requestId || requestId;
  } catch {
    /* ignore */
  }
  return new ApiError(message, res.status, code, requestId);
}

/**
 * @param {string} path
 * @param {{ method?: string, body?: unknown, auth?: boolean, timeoutMs?: number, retry?: boolean, retries?: number }} opts
 */
export async function api(
  path,
  { method = "GET", body, auth = false, timeoutMs = 15000, retry = true, retries = 2 } = {}
) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const upper = method.toUpperCase();
  let attempt = 0;
  const maxAttempts = IDEMPOTENT.has(upper) ? Math.max(1, retries + 1) : 1;

  while (attempt < maxAttempts) {
    attempt += 1;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res;
    try {
      res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        credentials: "include",
      });
    } catch (err) {
      clearTimeout(timer);
      const isAbort = err?.name === "AbortError";
      const apiErr = isAbort
        ? new ApiError("Request timed out — try again", 408, "TIMEOUT")
        : new ApiError(err?.message || "Network error", 0, "NETWORK_ERROR");
      if (IDEMPOTENT.has(upper) && attempt < maxAttempts) {
        await sleep(attempt === 1 ? 500 : 1500);
        continue;
      }
      throw apiErr;
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 401 && auth && retry && !path.startsWith("/api/auth/")) {
      try {
        await refreshAccessToken();
        return api(path, { method, body, auth, timeoutMs, retry: false, retries: 0 });
      } catch {
        /* fall through */
      }
    }

    if (!res.ok) {
      if (IDEMPOTENT.has(upper) && RETRYABLE_STATUS.has(res.status) && attempt < maxAttempts) {
        await sleep(attempt === 1 ? 500 : 1500);
        continue;
      }
      throw await parseError(res);
    }

    if (res.status === 204) return null;
    return res.json();
  }
}

export { API_BASE, refreshAccessToken };
