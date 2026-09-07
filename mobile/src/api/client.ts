import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const ACCESS_KEY = "wandr_access";
const REFRESH_KEY = "wandr_refresh";

function resolveApiBase(): string {
  const raw = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080").trim().replace(/\/$/, "");
  // Android emulator reaches host machine via 10.0.2.2
  if (Platform.OS === "android" && (raw.includes("localhost") || raw.includes("127.0.0.1"))) {
    return raw.replace("localhost", "10.0.2.2").replace("127.0.0.1", "10.0.2.2");
  }
  return raw || "http://localhost:8080";
}

export const API_BASE = resolveApiBase();

export class ApiError extends Error {
  status: number;
  code: string | null;
  requestId: string | null;

  constructor(message: string, status: number, code?: string | null, requestId?: string | null) {
    super(message);
    this.status = status;
    this.code = code || null;
    this.requestId = requestId || null;
  }
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function setTokens(access: string | null, refresh?: string | null) {
  if (access) await SecureStore.setItemAsync(ACCESS_KEY, access);
  else await SecureStore.deleteItemAsync(ACCESS_KEY);
  if (refresh !== undefined) {
    if (refresh) await SecureStore.setItemAsync(REFRESH_KEY, refresh);
    else await SecureStore.deleteItemAsync(REFRESH_KEY);
  }
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

const RETRYABLE = new Set([408, 429, 502, 503, 504]);
const IDEMPOTENT = new Set(["GET", "HEAD", "OPTIONS"]);

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function parseError(res: Response): Promise<ApiError> {
  let message = `Request failed (${res.status})`;
  let code: string | null = null;
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

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refresh = await getRefreshToken();
      if (!refresh) throw new ApiError("Session expired", 401, "AUTH_ERROR");
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Refresh-Token": refresh,
        },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (!res.ok) {
        await clearTokens();
        throw new ApiError("Session expired", 401, "AUTH_ERROR");
      }
      const data = await res.json();
      await setTokens(data.token, data.refreshToken || refresh);
      return data.token as string;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

type ApiOpts = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  timeoutMs?: number;
  retry?: boolean;
  retries?: number;
};

export async function api(path: string, opts: ApiOpts = {}): Promise<any> {
  const {
    method = "GET",
    body,
    auth = false,
    timeoutMs = 15000,
    retry = true,
    retries = 2,
  } = opts;

  const upper = method.toUpperCase();
  const maxAttempts = IDEMPOTENT.has(upper) ? Math.max(1, retries + 1) : 1;
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt += 1;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (auth) {
      const token = await getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (err: any) {
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
        return api(path, { ...opts, retry: false, retries: 0 });
      } catch {
        /* fall through */
      }
    }

    if (!res.ok) {
      if (IDEMPOTENT.has(upper) && RETRYABLE.has(res.status) && attempt < maxAttempts) {
        await sleep(attempt === 1 ? 500 : 1500);
        continue;
      }
      throw await parseError(res);
    }

    if (res.status === 204) return null;
    return res.json();
  }
}
