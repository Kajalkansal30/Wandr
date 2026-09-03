/**
 * Inject a sponsored place into an organic list without replacing organic ranking.
 * Sponsored card is inserted after the first organic item and kept visually distinct.
 */
export function injectSponsoredSlot(organicList, allPlaces, { max = 1 } = {}) {
  const sponsored = (allPlaces || []).filter((p) => p.sponsored).slice(0, max);
  if (!sponsored.length) return organicList || [];

  const adIds = new Set(sponsored.map((p) => String(p.id)));
  const organic = (organicList || []).filter((p) => !adIds.has(String(p.id)));
  const ads = sponsored.map((p) => ({ ...p, _sponsoredSlot: true }));

  if (!organic.length) return ads;
  if (organic.length === 1) return [organic[0], ...ads];
  return [organic[0], ...ads, ...organic.slice(1)];
}

export function sponsoredPlaces(places) {
  return (places || []).filter((p) => p.sponsored);
}
