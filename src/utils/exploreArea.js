const AREA_KEY = "wandr_explore_area";

/** Approx centroids for discovery lat/lng (India-facing defaults). */
export const EXPLORE_AREAS = [
  { id: "current", label: "Current location", city: null, lat: null, lng: null },
  { id: "delhi", label: "Delhi", city: "Delhi", lat: 28.6139, lng: 77.209 },
  { id: "gurgaon", label: "Gurgaon", city: "Gurgaon", lat: 28.4595, lng: 77.0266 },
  { id: "mumbai", label: "Mumbai", city: "Mumbai", lat: 19.076, lng: 72.8777 },
  { id: "bangalore", label: "Bangalore", city: "Bangalore", lat: 12.9716, lng: 77.5946 },
];

export function loadExploreArea() {
  try {
    const raw = localStorage.getItem(AREA_KEY);
    if (!raw) return EXPLORE_AREAS[1]; // Delhi NCR default
    const parsed = JSON.parse(raw);
    return EXPLORE_AREAS.find((a) => a.id === parsed.id) || EXPLORE_AREAS[1];
  } catch {
    return EXPLORE_AREAS[1];
  }
}

export function saveExploreArea(area) {
  localStorage.setItem(AREA_KEY, JSON.stringify({ id: area.id }));
}

export function filterByArea(places, area) {
  if (!area || !area.city || area.id === "current") return places;
  const city = area.city.toLowerCase();
  return places.filter(
    (p) =>
      p.city?.toLowerCase().includes(city) ||
      p.address?.toLowerCase().includes(city)
  );
}

export function areaDisplayLabel(area) {
  if (!area || area.id === "current") return "Near you";
  if (area.id === "delhi") return "Delhi NCR";
  return area.label;
}
