const PREF_KEY = "wandr_taste_prefs";
const SESSION_KEY = "wandr_analytics_session";

export const TASTE_BOOTSTRAP = [
  { id: "coffee", label: "Coffee", category: "coffee" },
  { id: "desserts", label: "Desserts", category: "desserts" },
  { id: "outdoor", label: "Outdoor", category: "outdoor" },
  { id: "study", label: "Study", category: "study" },
  { id: "date", label: "Date", category: "date" },
  { id: "work", label: "Work", category: "work" },
];

export function loadTastePrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREF_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveTastePrefs(ids) {
  localStorage.setItem(PREF_KEY, JSON.stringify(ids));
}

export function toggleTastePref(id) {
  const current = loadTastePrefs();
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  saveTastePrefs(next);
  return next;
}

export function getOrCreateSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `s_${Date.now()}`;
  }
}

/** Minimum saves before showing Picked for you */
export const PICKED_FOR_YOU_MIN_SAVES = 8;
