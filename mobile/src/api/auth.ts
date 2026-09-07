import { api, setTokens, clearTokens } from "./client";

export type AuthSession = {
  token: string;
  refreshToken?: string | null;
  userId: number;
  email: string;
  displayName: string;
  role: string;
  emailVerified: boolean;
};

export async function login(email: string, password: string): Promise<AuthSession> {
  const data = await api("/api/auth/login", {
    method: "POST",
    body: { email, password },
    timeoutMs: 15000,
  });
  await setTokens(data.token, data.refreshToken);
  return data;
}

export async function signup(
  email: string,
  password: string,
  displayName: string
): Promise<AuthSession> {
  const data = await api("/api/auth/signup", {
    method: "POST",
    body: { email, password, displayName, role: "USER" },
    timeoutMs: 20000,
  });
  await setTokens(data.token, data.refreshToken);
  return data;
}

export async function logout() {
  try {
    const { getRefreshToken } = await import("./client");
    const refresh = await getRefreshToken();
    await api("/api/auth/logout", {
      method: "POST",
      body: refresh ? { refreshToken: refresh } : {},
      timeoutMs: 10000,
    });
  } catch {
    /* ignore */
  }
  await clearTokens();
}

export async function forgotPassword(email: string) {
  return api("/api/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export async function verifyEmail(token: string) {
  return api("/api/auth/verify-email", {
    method: "POST",
    body: { token },
  });
}
