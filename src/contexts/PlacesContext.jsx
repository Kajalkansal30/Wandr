import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchPlaces, fetchPlace } from "../api/places";
import { loadExploreArea } from "../utils/exploreArea";
import mockCafes from "../data/cafes";

const PlacesContext = createContext(null);

export function usePlaces() {
  const ctx = useContext(PlacesContext);
  if (!ctx) throw new Error("usePlaces must be used within PlacesProvider");
  return ctx;
}

export function PlacesProvider({ children }) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMock, setUsingMock] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const area = loadExploreArea?.() || null;
      const lat = area?.lat ?? null;
      const lng = area?.lng ?? null;
      const result = await fetchPlaces({ lat, lng, page: 0, size: 30 });
      setPlaces(result.items);
      setHasMore(result.hasMore);
      setPage(0);
      setUsingMock(false);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("API places failed, using mock data (dev only):", err.message);
        setPlaces(mockCafes);
        setUsingMock(true);
      } else {
        setPlaces([]);
        setUsingMock(false);
      }
      setHasMore(false);
      const ref = err.requestId ? ` (ref: ${err.requestId})` : "";
      setError((err.message || "Unable to load places") + ref);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    try {
      const area = loadExploreArea?.() || null;
      const next = page + 1;
      const result = await fetchPlaces({
        lat: area?.lat ?? null,
        lng: area?.lng ?? null,
        page: next,
        size: 30,
      });
      setPlaces((prev) => {
        const seen = new Set(prev.map((p) => String(p.id)));
        return [...prev, ...result.items.filter((p) => !seen.has(String(p.id)))];
      });
      setHasMore(result.hasMore);
      setPage(next);
    } catch (err) {
      setError(err.message || "Unable to load more places");
    }
  }, [hasMore, loading, page]);

  useEffect(() => {
    reload();
  }, [reload]);

  const getById = useCallback(
    (id) => places.find((p) => String(p.id) === String(id)) || null,
    [places]
  );

  const ensurePlace = useCallback(
    async (id) => {
      const cached = getById(id);
      if (cached) return cached;
      try {
        return await fetchPlace(id);
      } catch {
        return null;
      }
    },
    [getById]
  );

  return (
    <PlacesContext.Provider
      value={{
        places,
        loading,
        error,
        usingMock,
        hasMore,
        reload,
        loadMore,
        getById,
        ensurePlace,
      }}
    >
      {children}
    </PlacesContext.Provider>
  );
}
