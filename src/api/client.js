function resolveApiBase(raw) {
  let value = (raw || "http://localhost:8080").trim().replace(/\/$/, "");
  if (!value) return "http://localhost:8080";

  // Strip scheme for host normalization, then re-apply https (except localhost)
  const hadScheme = /^https?:\/\//i.test(value);
  let host = value.replace(/^https?:\/\//i, "");

  // Render Blueprint "host" sometimes returns "wandr-api-xxxx" without .onrender.com
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

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export function getToken() {
  return localStorage.getItem("wandr_token");
}

export function setToken(token) {
  if (token) localStorage.setItem("wandr_token", token);
  else localStorage.removeItem("wandr_token");
}

export async function api(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

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

export { API_BASE };
