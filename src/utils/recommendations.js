export function buildTasteProfile(places, savedCafeIds) {
  const saved = places.filter((c) => savedCafeIds.includes(String(c.id)));
  if (saved.length === 0) return null;

  const tagCounts = {};
  const categoryCounts = {};
  const bestForCounts = {};
  let totalPrice = 0;

  saved.forEach((c) => {
    (c.tags || []).forEach((t) => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    c.bestFor?.forEach((b) => { bestForCounts[b] = (bestForCounts[b] || 0) + 1; });
    totalPrice += c.priceLevel || 0;
  });

  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);
  const topCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([c]) => c);
  const topBestFor = Object.entries(bestForCounts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([b]) => b);
  const avgPrice = Math.round(totalPrice / saved.length);

  return { topTags, topCategories, topBestFor, avgPrice };
}

export function getRecommendations(places, savedCafeIds, limit = 4) {
  const profile = buildTasteProfile(places, savedCafeIds);
  if (!profile) return [];

  const unsaved = places.filter((c) => !savedCafeIds.includes(String(c.id)));

  const scored = unsaved.map((c) => {
    let score = 0;
    (c.tags || []).forEach((t) => { if (profile.topTags.includes(t)) score += 3; });
    if (profile.topCategories.includes(c.category)) score += 2;
    c.bestFor?.forEach((b) => { if (profile.topBestFor.includes(b)) score += 2; });
    if (c.priceLevel === profile.avgPrice) score += 1;
    if (Math.abs((c.priceLevel || 0) - profile.avgPrice) <= 1) score += 0.5;
    score += (c.rating || 0) * 0.5;
    return { ...c, score };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function recommendationReason(places, savedCafeIds) {
  const profile = buildTasteProfile(places, savedCafeIds);
  if (!profile) return "Based on places you've saved";
  if (profile.topBestFor[0]) {
    const label = profile.topBestFor[0].toLowerCase();
    if (label === "study" || label === "work") return `Because you like quiet ${label} spots`;
    if (label === "date") return "Because you save date-friendly places";
  }
  if (profile.topTags[0]) return `Because you like ${profile.topTags[0].toLowerCase()} places`;
  if (profile.topCategories[0]) return `Because you save ${profile.topCategories[0].toLowerCase()}`;
  return `Because you saved ${savedCafeIds.length} places`;
}
