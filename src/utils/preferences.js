const PREF_KEY = "wandr_taste_prefs";
const LEARNED_KEY = "wandr_learned_taste";
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

/** { tag: weight } from searches + spot views */
export function loadLearnedTaste() {
  try {
    const raw = JSON.parse(localStorage.getItem(LEARNED_KEY) || "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

function saveLearnedTaste(map) {
  try {
    localStorage.setItem(LEARNED_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}

/** Bump tag/cuisine weights from behavior (search, spot view, like). */
export function recordTasteSignals(tokens, weight = 1) {
  if (!tokens?.length) return loadLearnedTaste();
  const map = loadLearnedTaste();
  for (const raw of tokens) {
    const t = String(raw || "")
      .trim()
      .toLowerCase();
    if (t.length < 2 || t.length > 40) continue;
    map[t] = Math.min(40, (map[t] || 0) + weight);
  }
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 40);
  const next = Object.fromEntries(entries);
  saveLearnedTaste(next);
  return next;
}

export function topLearnedTags(limit = 8) {
  return Object.entries(loadLearnedTaste())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([t]) => t);
}

/** Extract tokens from free-text search / captions */
export function tokenizeTasteText(text) {
  if (!text) return [];
  return String(text)
    .toLowerCase()
    .split(/[^a-z0-9+]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3)
    .filter((t) => !["the", "and", "for", "near", "with", "cafe", "café", "from", "this", "that"].includes(t));
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

/** Minimum saves before full save-based personalization (chips unlock earlier) */
export const PICKED_FOR_YOU_MIN_SAVES = 8;

/** Minimum explicit vibe chips to unlock Picked for you without many saves */
export const PICKED_FOR_YOU_MIN_PREFS = 2;
