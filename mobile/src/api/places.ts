import { api } from "./client";

export type Place = {
  id: number;
  name: string;
  category?: string;
  description?: string;
  address?: string;
  city?: string;
  image?: string;
  lat?: number;
  lng?: number;
  rating?: number;
  reviewCount?: number;
  savedCount?: number;
  priceLevel?: number;
  distance?: number;
  status?: string;
  ownershipStatus?: string;
  ownerId?: number | null;
  operatingStatus?: string;
  needsReverification?: boolean;
  phone?: string;
  website?: string;
  instagram?: string;
  whatsapp?: string;
  hours?: string;
  tags?: string[];
  bestFor?: string[];
  sponsored?: boolean;
  sponsoredHeadline?: string;
  verified?: boolean;
};

export type PlacePage = {
  items: Place[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasMore: boolean;
};

export async function fetchPlaces(params: {
  lat?: number | null;
  lng?: number | null;
  radius?: number;
  category?: string;
  search?: string;
  page?: number;
  size?: number;
} = {}): Promise<PlacePage> {
  const q = new URLSearchParams();
  if (params.lat != null) q.set("lat", String(params.lat));
  if (params.lng != null) q.set("lng", String(params.lng));
  if (params.radius != null) q.set("radius", String(params.radius));
  if (params.category) q.set("category", params.category);
  if (params.search) q.set("search", params.search);
  q.set("page", String(params.page ?? 0));
  q.set("size", String(params.size ?? 30));
  return api(`/api/places?${q}`, { timeoutMs: 45000 });
}

export async function fetchPlace(id: string | number, lat?: number | null, lng?: number | null) {
  const q = new URLSearchParams();
  if (lat != null) q.set("lat", String(lat));
  if (lng != null) q.set("lng", String(lng));
  const qs = q.toString();
  return api(`/api/places/${id}${qs ? `?${qs}` : ""}`, { timeoutMs: 20000 }) as Promise<Place>;
}

export async function fetchPlaceMedia(id: string | number) {
  return api(`/api/places/${id}/media`);
}

export async function fetchPlaceSpots(id: string | number) {
  return api(`/api/places/${id}/spots`, { auth: true });
}

export async function submitCommunityPlace(body: Record<string, unknown>) {
  return api("/api/places/community", { method: "POST", auth: true, body });
}

export async function claimPlace(id: string | number, body: Record<string, unknown> = {}) {
  return api(`/api/places/${id}/claim`, { method: "POST", auth: true, body });
}

export async function fetchMyClaim(id: string | number) {
  try {
    return await api(`/api/places/${id}/my-claim`, { auth: true });
  } catch (e: any) {
    if (e?.status === 204 || e?.status === 404) return null;
    throw e;
  }
}

export async function fetchClaimMethods(id: string | number) {
  return api(`/api/places/${id}/claim-methods`);
}

export async function startClaimPhoneOtp(claimId: number) {
  return api(`/api/places/claims/${claimId}/phone/start`, { method: "POST", auth: true, body: {} });
}

export async function verifyClaimPhoneOtp(claimId: number, code: string) {
  return api(`/api/places/claims/${claimId}/phone/verify`, { method: "POST", auth: true, body: { code } });
}

export async function startClaimBusinessEmail(claimId: number, email: string) {
  return api(`/api/places/claims/${claimId}/email/start`, { method: "POST", auth: true, body: { email } });
}

export async function verifyClaimBusinessEmail(claimId: number, token: string) {
  return api(`/api/places/claims/${claimId}/email/verify`, { method: "POST", auth: true, body: { token } });
}

export async function startClaimDomain(claimId: number) {
  return api(`/api/places/claims/${claimId}/domain/start`, { method: "POST", auth: true, body: {} });
}

export async function checkClaimDomain(claimId: number) {
  return api(`/api/places/claims/${claimId}/domain/check`, { method: "POST", auth: true, body: {} });
}

export async function submitClaimVideo(claimId: number, url: string, note?: string) {
  return api(`/api/places/claims/${claimId}/video`, { method: "POST", auth: true, body: { url, note } });
}

export async function submitClaimDocument(claimId: number, url: string, note?: string) {
  return api(`/api/places/claims/${claimId}/document`, { method: "POST", auth: true, body: { url, note } });
}

export async function confirmPlaceInfo(id: string | number, checks: Record<string, unknown>) {
  return api(`/api/places/${id}/confirm`, {
    method: "POST",
    auth: true,
    body: { checks },
  });
}

export async function reportPlace(id: string | number, reason: string, note?: string | null) {
  return api(`/api/places/${id}/report`, {
    method: "POST",
    auth: true,
    body: { reason, note: note || null },
  });
}
