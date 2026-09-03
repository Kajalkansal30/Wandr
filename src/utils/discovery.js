/** Discovery signals: New / Rising / Hidden — single source of truth. */

export function saveGrowthPct(place) {
  const thisWeek = place?.savesThisWeek ?? 0;
  const lastWeek = place?.savesLastWeek ?? 0;
  if (lastWeek > 0) return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  return thisWeek > 0 ? 100 : 0;
}

export function isNew(place) {
  if (!place) return false;
  if (place.badge === "new") return true;
  return place.openedDaysAgo != null && place.openedDaysAgo <= 14;
}

/**
 * Hidden gem: explicit badge, or highly rated with low review volume when badge missing.
 */
export function isHidden(place) {
  if (!place) return false;
  if (place.badge === "hidden-gem") return true;
  if (place.badge) return false;
  return (place.rating ?? 0) >= 4.5 && (place.reviewCount ?? 0) <= 40 && (place.reviewCount ?? 0) > 0;
}

export function momentumScore(place) {
  if (!place) return 0;
  const growth = saveGrowthPct(place);
  const thisWeek = place.savesThisWeek ?? 0;
  let score = thisWeek * 2 + Math.max(0, growth);
  if (place.openedDaysAgo != null && place.openedDaysAgo <= 21) {
    score += Math.max(0, 21 - place.openedDaysAgo);
  }
  return score;
}

export function isRising(place) {
  if (!place || isNew(place)) return false;
  const growth = saveGrowthPct(place);
  const thisWeek = place.savesThisWeek ?? 0;
  return (growth >= 30 && thisWeek >= 3) || momentumScore(place) >= 40;
}

export function photoSpot(place) {
  return Boolean(place?.photoSpot ?? place?.instagramWorthy);
}

export function experienceTags(place, limit = 3) {
  const tags = [];
  if (place?.noiseLevel === "quiet") tags.push("Quiet");
  if (place?.bestFor?.includes("Work")) tags.push("Work friendly");
  if (place?.bestFor?.includes("Study")) tags.push("Study");
  if (place?.bestFor?.includes("Date")) tags.push("Date");
  if (photoSpot(place)) tags.push("Photo spot");
  if (place?.seating?.some((s) => ["Outdoor", "Garden", "Rooftop"].includes(s))) tags.push("Outdoor");
  if (place?.lateNight) tags.push("Late night");
  for (const t of place?.tags || []) {
    if (!tags.includes(t)) tags.push(t);
  }
  return tags.slice(0, limit);
}

/**
 * Primary discovery label for badges / "Why this?"
 * Priority: new > rising > hidden > early (saved but low visibility)
 */
export function discoveryLabel(place) {
  if (!place) return null;

  if (isNew(place)) {
    const days = place.openedDaysAgo;
    return {
      kind: "new",
      title: days != null ? `Opened ${days} day${days === 1 ? "" : "s"} ago` : "Fresh",
      short: days != null ? `New · ${days}d ago` : "New",
      reasons: [
        days != null ? `Opened ${days} days ago` : "Recently listed as new",
        place.rating ? `★ ${place.rating} from ${place.reviewCount || 0} reviews` : null,
        place.savesThisWeek ? `${place.savesThisWeek} saves this week` : null,
      ].filter(Boolean),
    };
  }

  if (isRising(place)) {
    const growth = saveGrowthPct(place);
    return {
      kind: "rising",
      title: growth > 0 ? `+${growth}% saves this week` : "Gaining attention",
      short: growth > 0 ? `Rising · +${growth}%` : "Rising",
      reasons: [
        growth > 0 ? `+${growth}% saves this week` : "Strong recent momentum",
        place.savesThisWeek != null ? `${place.savesThisWeek} saves this week` : null,
        place.openedDaysAgo != null ? `Opened ${place.openedDaysAgo} days ago` : null,
        place.rating ? `★ ${place.rating} from ${place.reviewCount || 0} reviews` : null,
      ].filter(Boolean),
    };
  }

  if (isHidden(place)) {
    return {
      kind: "hidden",
      title: place.rating
        ? `${place.rating} ★ · only ${place.reviewCount || 0} reviews`
        : "Underrated gem",
      short: "Hidden gem",
      reasons: [
        place.rating ? `★ ${place.rating} from only ${place.reviewCount || 0} reviews` : "High quality, low visibility",
        place.savedCount != null ? `${place.savedCount} total saves` : null,
        "Still under the radar",
      ].filter(Boolean),
    };
  }

  if ((place.savedCount ?? 0) > 0 && (place.savedCount ?? 0) < 40) {
    return {
      kind: "early",
      title: `Discovered by ${place.savedCount} people`,
      short: "Early find",
      reasons: [
        `Saved by ${place.savedCount} explorers`,
        place.rating ? `★ ${place.rating}` : null,
      ].filter(Boolean),
    };
  }

  return null;
}

export function filterByDiscovery(list, catId) {
  switch (catId) {
    case "new":
      return list.filter(isNew);
    case "rising":
      return [...list].filter(isRising).sort((a, b) => momentumScore(b) - momentumScore(a));
    case "hidden-gem":
      return list.filter(isHidden);
    case "date":
      return list.filter((c) => c.bestFor?.includes("Date"));
    case "study":
      return list.filter((c) => c.bestFor?.includes("Study"));
    case "work":
      return list.filter((c) => c.bestFor?.includes("Work"));
    case "outdoor":
      return list.filter(
        (c) =>
          c.seating?.some((s) => ["Outdoor", "Garden", "Rooftop"].includes(s)) ||
          (c.tags || []).some((t) => /garden|outdoor|rooftop/i.test(t))
      );
    case "coffee":
      return list.filter((c) => c.category?.toLowerCase().includes("coffee") || c.type === "cafe");
    case "desserts":
      return list.filter(
        (c) =>
          c.category?.toLowerCase().includes("bakery") ||
          c.category?.toLowerCase().includes("dessert")
      );
    case "pet":
      return list.filter((c) => c.petFriendly);
    case "late-night":
      return list.filter((c) => c.lateNight);
    case "photo":
    case "instagram":
      return list.filter(photoSpot);
    case "budget":
      return list.filter((c) => (c.avgCostForTwo || 0) <= 500);
    case "street-food":
      return list.filter((c) => c.type === "street-food");
    case "food-truck":
      return list.filter((c) => c.type === "food-truck");
    case "trending":
      return [...list].filter(isRising).sort((a, b) => momentumScore(b) - momentumScore(a));
    default:
      return list;
  }
}

export function risingPlaces(list, limit = 6) {
  return [...list]
    .filter((p) => isRising(p) || (!isNew(p) && momentumScore(p) > 0))
    .sort((a, b) => momentumScore(b) - momentumScore(a))
    .slice(0, limit);
}

export function newPlaces(list) {
  return list.filter(isNew).sort((a, b) => (a.openedDaysAgo ?? 99) - (b.openedDaysAgo ?? 99));
}

export function hiddenPlaces(list) {
  return list.filter(isHidden);
}
