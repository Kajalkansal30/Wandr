import { api } from "./client";
import { Platform } from "react-native";

export async function fetchSpottedFeed(params: {
  lat?: number | null;
  lng?: number | null;
  filter?: string;
  limit?: number;
  prefs?: string | string[] | null;
} = {}) {
  const q = new URLSearchParams();
  if (params.lat != null) q.set("lat", String(params.lat));
  if (params.lng != null) q.set("lng", String(params.lng));
  if (params.filter) q.set("filter", params.filter);
  if (params.limit != null) q.set("limit", String(params.limit));
  if (params.prefs != null && params.prefs !== "") {
    const prefStr = Array.isArray(params.prefs) ? params.prefs.join(",") : String(params.prefs);
    if (prefStr.trim()) q.set("prefs", prefStr.trim());
  }
  const qs = q.toString();
  const data = await api(`/api/spotted/feed${qs ? `?${qs}` : ""}`, { auth: true, timeoutMs: 60000 });
  const list = Array.isArray(data) ? data : [];
  if (list.length > 0) return list;

  // Empty feed — café Mixkit demo reels so Spotted isn't blank
  return [
    {
      id: -101,
      placeId: 1,
      url: "https://assets.mixkit.co/videos/5590/5590-720.mp4",
      thumbnailUrl: "https://assets.mixkit.co/videos/5590/5590-thumb-720-0.jpg",
      mediaType: "VIDEO",
      spotKind: "AMBIENCE",
      caption: "Quiet pour-overs and soft light — demo reel.",
      likeCount: 42,
      likedByMe: false,
      place: { id: 1, name: "Demo Café" },
    },
    {
      id: -102,
      placeId: 2,
      url: "https://assets.mixkit.co/videos/5569/5569-720.mp4",
      thumbnailUrl: "https://assets.mixkit.co/videos/5569/5569-thumb-720-0.jpg",
      mediaType: "VIDEO",
      spotKind: "HIDDEN_GEM",
      caption: "Laptop + latte — demo reel.",
      likeCount: 28,
      likedByMe: false,
      place: { id: 2, name: "Demo Corner" },
    },
    {
      id: -103,
      placeId: 3,
      url: "https://assets.mixkit.co/videos/3577/3577-720.mp4",
      thumbnailUrl: "https://assets.mixkit.co/videos/3577/3577-thumb-720-0.jpg",
      mediaType: "VIDEO",
      spotKind: "FOOD",
      caption: "Espresso machine steam — demo reel.",
      likeCount: 35,
      likedByMe: false,
      place: { id: 3, name: "Demo Brew" },
    },
  ];
}

export async function createSpot(body: Record<string, unknown>) {
  return api("/api/spotted", { method: "POST", auth: true, body, timeoutMs: 30000 });
}

export async function toggleSpotLike(id: string | number) {
  return api(`/api/spotted/${id}/like`, { method: "POST", auth: true });
}

export async function reportSpot(id: string | number, reason: string, note?: string | null) {
  return api(`/api/spotted/${id}/report`, {
    method: "POST",
    auth: true,
    body: { reason, note: note || null },
  });
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
