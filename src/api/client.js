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

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
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
        throw new ApiError("Session expired", 401);
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

export async function api(path, { method = "GET", body, auth = false, timeoutMs = 15000, retry = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

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
    if (err?.name === "AbortError") {
      throw new ApiError("Request timed out — try again", 408);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 401 && auth && retry && !path.startsWith("/api/auth/")) {
    try {
      await refreshAccessToken();
      return api(path, { method, body, auth, timeoutMs, retry: false });
    } catch {
      /* fall through */
    }
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data.message || data.error || message;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return null;
  return res.json();
}

export { API_BASE, refreshAccessToken };
