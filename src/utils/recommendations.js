/**
 * Adaptive preference ranking for café listings.
 * Combines saves + explicit taste chips + geo + time-of-day (Netflix/Zomato-style hybrid).
 */

import { TASTE_BOOTSTRAP, PICKED_FOR_YOU_MIN_SAVES, topLearnedTags } from "./preferences";

const PREF_MATCH = {
  coffee: { tags: ["coffee", "espresso", "specialty coffee"], categories: ["coffee", "cafe"], bestFor: [] },
  desserts: { tags: ["dessert", "desserts", "bakery", "pastry", "sweet"], categories: ["desserts", "bakery"], bestFor: [] },
  outdoor: { tags: ["outdoor", "garden", "rooftop", "patio"], categories: [], bestFor: ["Outdoor"] },
  study: { tags: ["quiet", "study", "wifi"], categories: [], bestFor: ["Study"] },
  date: { tags: ["romantic", "date", "intimate"], categories: [], bestFor: ["Date"] },
  work: { tags: ["work", "laptop", "coworking", "wifi"], categories: [], bestFor: ["Work"] },
};

/** Hour buckets used for contextual boosts */
export function timeOfDayContext(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 15) return "lunch";
  if (h >= 15 && h < 18) return "afternoon";
  if (h >= 18 && h < 22) return "evening";
  return "late";
}

function norm(s) {
  return String(s || "")
    .trim()
    .toLowerCase();
}

function includesLoose(list, needle) {
  const n = norm(needle);
  return (list || []).some((x) => {
    const v = norm(x);
    return v === n || v.includes(n) || n.includes(v);
  });
}

export function buildTasteProfile(places, savedCafeIds, tastePrefIds = []) {
  const saved = places.filter((c) => savedCafeIds.includes(String(c.id)));
  const tagCounts = {};
  const categoryCounts = {};
  const bestForCounts = {};
  let totalPrice = 0;
  let priceN = 0;

  saved.forEach((c) => {
    (c.tags || []).forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
    if (c.category) categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    c.bestFor?.forEach((b) => {
      bestForCounts[b] = (bestForCounts[b] || 0) + 1;
    });
    if (c.priceLevel != null) {
      totalPrice += c.priceLevel;
      priceN += 1;
    }
  });

  // Explicit bootstrap chips act as soft priors (cold start + reinforce)
  (tastePrefIds || []).forEach((id) => {
    const m = PREF_MATCH[id];
    if (!m) return;
    m.tags.forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 2;
    });
    m.categories.forEach((c) => {
      categoryCounts[c] = (categoryCounts[c] || 0) + 2;
    });
    m.bestFor.forEach((b) => {
      bestForCounts[b] = (bestForCounts[b] || 0) + 2;
    });
  });

  // Behavioral learning from searches + Spotted views
  topLearnedTags(10).forEach((t) => {
    tagCounts[t] = (tagCounts[t] || 0) + 2;
  });

  const hasSignal =
    saved.length > 0 || (tastePrefIds || []).length > 0 || topLearnedTags(1).length > 0;
  if (!hasSignal) return null;

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]) => t);
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c]) => c);
  const topBestFor = Object.entries(bestForCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([b]) => b);
  const avgPrice = priceN > 0 ? Math.round(totalPrice / priceN) : null;

  return {
    topTags,
    topCategories,
    topBestFor,
    avgPrice,
    tastePrefIds: [...(tastePrefIds || [])],
    savedCount: saved.length,
    source: saved.length >= PICKED_FOR_YOU_MIN_SAVES ? "saves" : tastePrefIds?.length ? "prefs" : "mixed",
  };
}

function contextBoost(place, tod) {
  let score = 0;
  const best = place.bestFor || [];
  const tags = place.tags || [];
  const late = Boolean(place.lateNight);

  if (tod === "morning") {
    if (includesLoose(tags, "coffee") || includesLoose(best, "Study") || includesLoose(best, "Work")) score += 2;
  } else if (tod === "lunch") {
    if (includesLoose(tags, "lunch") || includesLoose(best, "Work") || place.category === "cafe") score += 1.5;
  } else if (tod === "afternoon") {
    if (includesLoose(tags, "dessert") || includesLoose(tags, "outdoor") || includesLoose(best, "Study")) score += 1.5;
  } else if (tod === "evening") {
    if (includesLoose(best, "Date") || includesLoose(tags, "romantic") || includesLoose(tags, "dinner")) score += 2;
  } else if (tod === "late") {
    if (late || includesLoose(tags, "late")) score += 3;
  }
  return score;
}

function geoBoost(place) {
  const d = place.distance;
  if (d == null || Number.isNaN(Number(d))) return 0;
  // Stronger boost under 2 km, taper to ~8 km
  return Math.max(0, 6 - Number(d) * 0.75);
}

function popularityBoost(place) {
  let score = (place.rating || 0) * 0.5;
  score += Math.min(4, (place.savesThisWeek || 0) * 0.35);
  score += Math.min(2, (place.savedCount || 0) * 0.02);
  if (place.badge === "rising" || place.badge === "new") score += 1;
  return score;
}

function tasteScore(place, profile) {
  if (!profile) return 0;
  let score = 0;
  (place.tags || []).forEach((t) => {
    if (profile.topTags.some((pt) => norm(pt) === norm(t) || norm(t).includes(norm(pt)))) score += 3;
  });
  if (profile.topCategories.some((c) => norm(c) === norm(place.category))) score += 2;
  place.bestFor?.forEach((b) => {
    if (profile.topBestFor.some((pb) => norm(pb) === norm(b))) score += 2.5;
  });
  if (profile.avgPrice != null && place.priceLevel != null) {
    if (place.priceLevel === profile.avgPrice) score += 1;
    else if (Math.abs(place.priceLevel - profile.avgPrice) <= 1) score += 0.5;
  }
  // Direct chip match (e.g. outdoor seating)
  (profile.tastePrefIds || []).forEach((id) => {
    const m = PREF_MATCH[id];
    if (!m) return;
    if (m.categories.some((c) => norm(c) === norm(place.category))) score += 1.5;
    if (m.bestFor.some((b) => includesLoose(place.bestFor, b))) score += 2;
    if (m.tags.some((t) => includesLoose(place.tags, t) || includesLoose(place.seating, t))) score += 1.5;
  });
  return score;
}

/**
 * Rank places for "Picked for you" / adaptive listing.
 * @param {object} opts.tastePrefIds - explicit vibe chips
 * @param {boolean} opts.includeSaved - if true, may re-rank saved places (default false)
 */
export function getRecommendations(places, savedCafeIds, limit = 4, opts = {}) {
  const tastePrefIds = opts.tastePrefIds || [];
  const tod = opts.timeOfDay || timeOfDayContext();
  const profile = buildTasteProfile(places, savedCafeIds, tastePrefIds);

  const pool = (places || []).filter((c) => {
    if (opts.includeSaved) return true;
    return !savedCafeIds.includes(String(c.id));
  });

  // Cold start: no saves and no chips → popular nearby
  if (!profile) {
    return [...pool]
      .map((c) => ({
        ...c,
        score: popularityBoost(c) + geoBoost(c) + contextBoost(c, tod),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  const scored = pool.map((c) => {
    let score = tasteScore(c, profile);
    score += geoBoost(c);
    score += contextBoost(c, tod);
    score += popularityBoost(c) * 0.35; // light social proof so ranking isn't pure echo chamber
    // Mild exploration: tiny noise so order isn't frozen
    score += Math.random() * 0.35;
    return { ...c, score };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function recommendationReason(places, savedCafeIds, tastePrefIds = []) {
  const profile = buildTasteProfile(places, savedCafeIds, tastePrefIds);
  const tod = timeOfDayContext();
  const todLabel =
    tod === "morning"
      ? "for your morning"
      : tod === "lunch"
        ? "for lunch"
        : tod === "afternoon"
          ? "for this afternoon"
          : tod === "evening"
            ? "for tonight"
            : "for late night";

  if (!profile) return `Popular nearby ${todLabel}`;

  if (profile.topBestFor[0]) {
    const label = profile.topBestFor[0].toLowerCase();
    if (label === "study" || label === "work") return `Because you like quiet ${label} spots · ${todLabel}`;
    if (label === "date") return `Because you save date-friendly places · ${todLabel}`;
    if (label === "outdoor") return `Because you like outdoor spots · ${todLabel}`;
  }
  if (profile.tastePrefIds?.length) {
    const labels = profile.tastePrefIds
      .map((id) => TASTE_BOOTSTRAP.find((t) => t.id === id)?.label || id)
      .slice(0, 2);
    if (labels.length) return `Based on your ${labels.join(" & ").toLowerCase()} vibe · ${todLabel}`;
  }
  if (profile.topTags[0]) return `Because you like ${profile.topTags[0].toLowerCase()} places · ${todLabel}`;
  if (profile.topCategories[0]) return `Because you save ${profile.topCategories[0].toLowerCase()} · ${todLabel}`;
  if (profile.savedCount > 0) return `Because you saved ${profile.savedCount} places · ${todLabel}`;
  return `Personalized ${todLabel}`;
}

/** Unlock personalization with enough saves OR explicit taste chips OR learned behavior */
export function canShowPersonalized(savedCount, tastePrefIds = []) {
  return (
    savedCount >= PICKED_FOR_YOU_MIN_SAVES ||
    (tastePrefIds || []).length >= 2 ||
    topLearnedTags(1).length > 0
  );
}
