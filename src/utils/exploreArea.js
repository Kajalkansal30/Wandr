const AREA_KEY = "wandr_explore_area";

export const EXPLORE_AREAS = [
  { id: "current", label: "Current location", city: null },
  { id: "delhi", label: "Delhi", city: "Delhi" },
  { id: "gurgaon", label: "Gurgaon", city: "Gurgaon" },
  { id: "mumbai", label: "Mumbai", city: "Mumbai" },
  { id: "bangalore", label: "Bangalore", city: "Bangalore" },
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
