import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchPlaces } from "../api/places";
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

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchPlaces();
      setPlaces(list);
      setUsingMock(false);
    } catch (err) {
      console.warn("API places failed, using mock data:", err.message);
      setPlaces(mockCafes);
      setUsingMock(true);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const getById = useCallback(
    (id) => places.find((p) => String(p.id) === String(id)) || null,
    [places]
  );

  return (
    <PlacesContext.Provider value={{ places, loading, error, usingMock, reload, getById }}>
      {children}
    </PlacesContext.Provider>
  );
}
