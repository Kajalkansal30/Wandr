import { api } from "./client";

export async function fetchOwnerAnalytics({ days = 30, placeId = null } = {}) {
  const params = new URLSearchParams({ days: String(days) });
  if (placeId != null) params.set("placeId", String(placeId));
  return api(`/api/owner/analytics?${params}`, { auth: true });
}

export async function fetchMyBoosts() {
  return api("/api/owner/boosts", { auth: true });
}

export async function createBoost(body) {
  return api("/api/owner/boosts", {
    method: "POST",
    auth: true,
    body,
  });
}
