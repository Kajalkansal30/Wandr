import { api, setToken, refreshAccessToken } from "./client";

function normalizeRole(role) {
  return String(role || "USER").toLowerCase();
}

function toSession(data) {
  setToken(data.token);
  return {
    token: data.token,
    user: {
      uid: String(data.userId),
      email: data.email,
      displayName: data.displayName,
      emailVerified: Boolean(data.emailVerified),
      listingFeePaid: Boolean(data.listingFeePaid),
    },
    role: normalizeRole(data.role),
    emailVerified: Boolean(data.emailVerified),
    listingFeePaid: Boolean(data.listingFeePaid),
  };
}

export async function loginRequest(email, password) {
  const data = await api("/api/auth/login", {
    method: "POST",
    body: { email, password },
    timeoutMs: 15000,
  });
  return toSession(data);
}

export async function signupRequest(email, password, displayName, role = "USER") {
  const accountRole = String(role || "USER").toUpperCase() === "OWNER" ? "OWNER" : "USER";
  const data = await api("/api/auth/signup", {
    method: "POST",
    body: {
      email,
      password,
      displayName,
      role: accountRole,
    },
    timeoutMs: 20000,
  });
  return toSession(data);
}

export async function logoutRequest() {
  try {
    await api("/api/auth/logout", { method: "POST" });
  } catch {
    /* ignore */
  }
  setToken(null);
}

export async function verifyEmailRequest(token) {
  return api("/api/auth/verify-email", {
    method: "POST",
    body: { token },
  });
}

export async function resendVerificationRequest() {
  return api("/api/auth/resend-verification", {
    method: "POST",
    auth: true,
  });
}

export function isVerificationRequiredError(err) {
  const msg = String(err?.message || err?.code || "").toLowerCase();
  return (
    err?.status === 403 &&
    (msg.includes("verification") || msg.includes("verify") || msg.includes("email not verified"))
  );
}

export async function forgotPasswordRequest(email) {
  return api("/api/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export async function resetPasswordRequest(token, newPassword) {
  return api("/api/auth/reset-password", {
    method: "POST",
    body: { token, newPassword },
  });
}

export async function changePasswordRequest(oldPassword, newPassword) {
  return api("/api/auth/change-password", {
    method: "POST",
    auth: true,
    body: { oldPassword, newPassword },
  });
}

export async function deleteAccountRequest(password) {
  return api("/api/auth/account", {
    method: "DELETE",
    auth: true,
    body: { password },
  });
}

export async function tryRefreshSession() {
  const data = await refreshAccessToken();
  return data;
}
