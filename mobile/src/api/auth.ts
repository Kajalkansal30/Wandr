import { api, setTokens, clearTokens } from "./client";

export type AuthSession = {
  token: string;
  refreshToken?: string | null;
  userId: number;
  email: string;
  displayName: string;
  role: string;
  emailVerified: boolean;
  listingFeePaid?: boolean;
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
  displayName: string,
  role: "USER" | "OWNER" = "USER"
): Promise<AuthSession> {
  const accountRole = role === "OWNER" ? "OWNER" : "USER";
  const data = await api("/api/auth/signup", {
    method: "POST",
    body: { email, password, displayName, role: accountRole },
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

export async function logoutAll() {
  await api("/api/auth/logout-all", { method: "POST", auth: true });
  await clearTokens();
}

export async function forgotPassword(email: string) {
  return api("/api/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export async function resetPassword(token: string, newPassword: string) {
  return api("/api/auth/reset-password", {
    method: "POST",
    body: { token, newPassword },
  });
}

export async function changePassword(oldPassword: string, newPassword: string) {
  return api("/api/auth/change-password", {
    method: "POST",
    auth: true,
    body: { oldPassword, newPassword },
  });
}

export async function deleteAccount(password: string) {
  await api("/api/auth/account", {
    method: "DELETE",
    auth: true,
    body: { password },
  });
  await clearTokens();
}

export async function verifyEmail(token: string) {
  return api("/api/auth/verify-email", {
    method: "POST",
    body: { token },
  });
}

export async function resendVerification() {
  return api("/api/auth/resend-verification", {
    method: "POST",
    auth: true,
  });
}

export function isVerificationRequiredError(err: any): boolean {
  const msg = String(err?.message || "").toLowerCase();
  return err?.status === 403 && msg.includes("verification");
}
