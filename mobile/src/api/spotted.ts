import { api } from "./client";
import { Platform } from "react-native";

export async function fetchSpottedFeed(params: {
  lat?: number | null;
  lng?: number | null;
  filter?: string;
  limit?: number;
} = {}) {
  const q = new URLSearchParams();
  if (params.lat != null) q.set("lat", String(params.lat));
  if (params.lng != null) q.set("lng", String(params.lng));
  if (params.filter) q.set("filter", params.filter);
  if (params.limit != null) q.set("limit", String(params.limit));
  const qs = q.toString();
  return api(`/api/spotted/feed${qs ? `?${qs}` : ""}`, { auth: true });
}

export async function createSpot(body: Record<string, unknown>) {
  return api("/api/spotted", { method: "POST", auth: true, body, timeoutMs: 30000 });
}

export async function toggleSpotLike(id: string | number) {
  return api(`/api/spotted/${id}/like`, { method: "POST", auth: true });
}

export async function trackEvent(
  eventType: string,
  opts: { placeId?: number | null; source?: string; metadata?: Record<string, unknown> } = {}
) {
  try {
    await api("/api/analytics/events", {
      method: "POST",
      auth: true,
      timeoutMs: 5000,
      body: {
        eventType,
        placeId: opts.placeId ?? null,
        source: opts.source ?? null,
        sessionId: null,
        device: Platform.OS,
        metadata: JSON.stringify(opts.metadata || {}),
      },
    });
  } catch {
    /* fire-and-forget */
  }
}
