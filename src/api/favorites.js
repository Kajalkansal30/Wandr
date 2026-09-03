import { api } from "./client";
import { mapPlace } from "./places";

export async function fetchFavoriteIds() {
  const data = await api("/api/favorites/ids", { auth: true });
  return (data || []).map(String);
}

export async function fetchFavoritePlaces() {
  const data = await api("/api/favorites", { auth: true });
  return (data || []).map(mapPlace);
}

export async function toggleFavorite(placeId) {
  return api(`/api/favorites/${placeId}/toggle`, {
    method: "POST",
    auth: true,
  });
}
