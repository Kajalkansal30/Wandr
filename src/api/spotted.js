import { api, getToken, ApiError } from "./client";
import {
  getDemoSpots,
  getDemoSpotsForPlace,
  addDemoSpot,
  toggleDemoLike,
} from "../data/demoSpots";

function mapPlaceCard(p) {
  if (!p) return null;
  return {
    id: String(p.id),
    name: p.name,
    address: p.address,
    city: p.city,
    lat: p.lat,
    lng: p.lng,
    rating: p.rating,
    priceLevel: p.priceLevel,
    avgCostForTwo: p.avgCostForTwo,
    operatingStatus: p.operatingStatus,
    openedDaysAgo: p.openedDaysAgo,
    image: p.image,
    distance: p.distance,
  };
}

export function mapSpot(s) {
  if (!s) return null;
  return {
    id: String(s.id),
    placeId: String(s.placeId),
    userId: s.userId != null ? String(s.userId) : null,
    url: s.url,
    thumbnailUrl: s.thumbnailUrl,
    mediaType: s.mediaType,
    spotKind: s.spotKind,
    caption: s.caption,
    durationSec: s.durationSec,
    likeCount: s.likeCount ?? 0,
    likedByMe: Boolean(s.likedByMe),
    source: s.source,
    status: s.status,
    createdAt: s.createdAt,
    place: mapPlaceCard(s.place),
  };
}

export async function fetchSpottedFeed({ lat, lng, filter = "all", limit } = {}) {
  try {
    const params = new URLSearchParams();
    if (lat != null) params.set("lat", String(lat));
    if (lng != null) params.set("lng", String(lng));
    if (filter) params.set("filter", filter);
    if (limit != null) params.set("limit", String(limit));
    const q = params.toString();
    const data = await api(`/api/spotted/feed${q ? `?${q}` : ""}`, { auth: Boolean(getToken()) });
    return (data || []).map(mapSpot);
  } catch (err) {
    console.warn("Spotted feed API failed, using demo spots:", err.message);
    return getDemoSpots({ filter, lat, lng });
  }
}

export async function fetchPlaceSpots(placeId) {
  try {
    const data = await api(`/api/places/${placeId}/spots`, { auth: Boolean(getToken()) });
    return (data || []).map(mapSpot);
  } catch {
    return getDemoSpotsForPlace(placeId);
  }
}

export async function createSpot(body) {
  try {
    const data = await api("/api/spotted", { method: "POST", auth: true, body });
    return mapSpot(data);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) throw err;
    console.warn("Create spot API failed, saving locally:", err.message);
    return addDemoSpot({
      placeId: body.placeId,
      url: body.url,
      caption: body.caption,
      spotKind: body.spotKind,
    });
  }
}

export async function toggleSpotLike(id) {
  try {
    return await api(`/api/spotted/${id}/like`, { method: "POST", auth: true });
  } catch {
    return toggleDemoLike(id);
  }
}

export async function reportSpot(id, reason, note) {
  try {
    return await api(`/api/spotted/${id}/report`, {
      method: "POST",
      auth: true,
      body: { reason, note },
    });
  } catch {
    return null;
  }
}
