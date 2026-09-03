import { api, setToken } from "./client";

function normalizeRole(role) {
  return String(role || "USER").toLowerCase();
}

export async function loginRequest(email, password) {
  const data = await api("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
  setToken(data.token);
  return {
    token: data.token,
    user: {
      uid: String(data.userId),
      email: data.email,
      displayName: data.displayName,
    },
    role: normalizeRole(data.role),
  };
}

export async function signupRequest(email, password, displayName, role = "user") {
  const data = await api("/api/auth/signup", {
    method: "POST",
    body: {
      email,
      password,
      displayName,
      role: String(role).toUpperCase(),
    },
  });
  setToken(data.token);
  return {
    token: data.token,
    user: {
      uid: String(data.userId),
      email: data.email,
      displayName: data.displayName,
    },
    role: normalizeRole(data.role),
  };
}
