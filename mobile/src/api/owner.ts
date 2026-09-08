import { api } from "./client";

export async function fetchOwnerPlaces() {
  return api("/api/owner/places", { auth: true });
}

export async function fetchOwnerPlace(id: string | number) {
  return api(`/api/owner/places/${id}`, { auth: true });
}

export async function createOwnerPlace(body: Record<string, unknown>) {
  return api("/api/owner/places", { method: "POST", auth: true, body });
}

export async function updateOwnerPlace(id: string | number, body: Record<string, unknown>) {
  return api(`/api/owner/places/${id}`, { method: "PUT", auth: true, body });
}

export async function fetchOwnerAnalytics(days = 30, placeId?: number) {
  const q = new URLSearchParams({ days: String(days) });
  if (placeId != null) q.set("placeId", String(placeId));
  return api(`/api/owner/analytics?${q}`, { auth: true });
}

export async function fetchOwnerBoosts() {
  return api("/api/owner/boosts", { auth: true });
}

export async function createOwnerBoost(body: Record<string, unknown>) {
  return api("/api/owner/boosts", { method: "POST", auth: true, body });
}

export async function fetchOwnerClaims() {
  return api("/api/owner/claims", { auth: true });
}

export async function requestOwnerVerification(
  placeId: string | number,
  body: { phone?: string | null; evidence?: string | null } = {}
) {
  return api(`/api/owner/places/${placeId}/request-verification`, {
    method: "POST",
    auth: true,
    body: {
      phone: body.phone || null,
      evidence: body.evidence || "Verification request",
      verificationRequest: true,
    },
  });
}

export async function fetchOwnerTrust(placeId: string | number) {
  return api(`/api/owner/places/${placeId}/trust`, { auth: true });
}
