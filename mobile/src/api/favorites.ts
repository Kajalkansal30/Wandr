import { api } from "./client";

export async function fetchFavoriteIds(): Promise<number[]> {
  return api("/api/favorites/ids", { auth: true });
}

export async function fetchFavoritePlaces() {
  return api("/api/favorites", { auth: true });
}

export async function toggleFavorite(placeId: string | number) {
  return api(`/api/favorites/${placeId}/toggle`, { method: "POST", auth: true });
}
