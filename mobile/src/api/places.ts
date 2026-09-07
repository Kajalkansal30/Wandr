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
  operatingStatus?: string;
  phone?: string;
  hours?: string;
  tags?: string[];
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
  return api(`/api/places?${q}`, { timeoutMs: 15000 });
}

export async function fetchPlace(id: string | number, lat?: number | null, lng?: number | null) {
  const q = new URLSearchParams();
  if (lat != null) q.set("lat", String(lat));
  if (lng != null) q.set("lng", String(lng));
  const qs = q.toString();
  return api(`/api/places/${id}${qs ? `?${qs}` : ""}`, { timeoutMs: 12000 }) as Promise<Place>;
}

export async function submitCommunityPlace(body: Record<string, unknown>) {
  return api("/api/places/community", { method: "POST", auth: true, body });
}
