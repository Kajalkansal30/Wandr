import { fetchFavoriteIds, fetchFavoritePlaces, toggleFavorite } from "../api/favorites";
import { getToken } from "../api/client";
import { trackEvent } from "../api/analytics";

const LOCAL_KEY = "wandr_saved_cafes";

function localKey(uid) {
  return `${LOCAL_KEY}:${uid || "guest"}`;
}

export function getLocalSavedIds(uid) {
  try {
    return JSON.parse(localStorage.getItem(localKey(uid)) || "[]");
  } catch {
    return [];
  }
}

function setLocalSavedIds(uid, ids) {
  localStorage.setItem(localKey(uid), JSON.stringify(ids));
}

function toggleLocal(uid, cafeId, currentlySaved) {
  const id = String(cafeId);
  const next = !currentlySaved;
  const ids = getLocalSavedIds(uid);
  const updated = next ? [...new Set([...ids, id])] : ids.filter((x) => x !== id);
  setLocalSavedIds(uid, updated);
  return next;
}

/** Load saved cafe ids — Spring Boot if logged in with token, else local. */
export async function loadSavedIds(user) {
  if (!user) return [];
  if (getToken()) {
    try {
      return await fetchFavoriteIds();
    } catch (err) {
      console.warn("Favorites API failed:", err.message);
      return getLocalSavedIds(user.uid);
    }
  }
  return getLocalSavedIds(user.uid);
}

/**
 * Load full saved place cards when possible; otherwise ids + optional places list join.
 * Returns { places, ids }.
 */
export async function loadSavedPlaces(user, discoverPlaces = []) {
  if (!user) return { places: [], ids: [] };

  if (getToken()) {
    try {
      const places = await fetchFavoritePlaces();
      const ids = places.map((p) => String(p.id));
      return { places, ids };
    } catch (err) {
      console.warn("Favorite places API failed:", err.message);
    }
  }

  const ids = await loadSavedIds(user);
  const byId = new Map((discoverPlaces || []).map((p) => [String(p.id), p]));
  const places = ids.map((id) => byId.get(id)).filter(Boolean);
  return { places, ids };
}

/** Toggle save. Returns the new saved boolean. */
export async function toggleSavedCafe(user, cafeId, currentlySaved) {
  if (!user) throw new Error("Not signed in");
  const id = String(cafeId);

  if (getToken()) {
    try {
      const result = await toggleFavorite(id);
      const saved = Boolean(result?.saved);
      // Keep local mirror in sync for offline fallback
      const local = getLocalSavedIds(user.uid);
      setLocalSavedIds(
        user.uid,
        saved ? [...new Set([...local, id])] : local.filter((x) => x !== id)
      );
      trackEvent("save_place", {
        placeId: id,
        source: "favorites_api",
        metadata: { saved },
      });
      return saved;
    } catch (err) {
      console.warn("Favorites toggle API failed:", err.message);
      const saved = toggleLocal(user.uid, id, currentlySaved);
      trackEvent("save_place", {
        placeId: id,
        source: "favorites_local_fallback",
        metadata: { saved },
      });
      return saved;
    }
  }

  const next = toggleLocal(user.uid, id, currentlySaved);
  trackEvent("save_place", {
    placeId: id,
    source: "favorites_local",
    metadata: { saved: next },
  });
  return next;
}
