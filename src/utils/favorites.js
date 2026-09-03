import { fetchFavoriteIds, toggleFavorite } from "../api/favorites";
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

/** Toggle save. Returns the new saved boolean. */
export async function toggleSavedCafe(user, cafeId, currentlySaved) {
  if (!user) throw new Error("Not signed in");
  const id = String(cafeId);

  if (getToken()) {
    const result = await toggleFavorite(id);
    const saved = Boolean(result?.saved);
    trackEvent("save_place", {
      placeId: id,
      source: "favorites_api",
      metadata: { saved },
    });
    return saved;
  }

  const next = !currentlySaved;
  const ids = getLocalSavedIds(user.uid);
  const updated = next ? [...new Set([...ids, id])] : ids.filter((x) => x !== id);
  setLocalSavedIds(user.uid, updated);
  trackEvent("save_place", {
    placeId: id,
    source: "favorites_local",
    metadata: { saved: next },
  });
  return next;
}
