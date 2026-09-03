import { isHidden, isNew, isRising, photoSpot } from "./discovery";

/**
 * Deterministic NL → structured filter chips (no AI).
 * @returns {{ chips: Array<{id:string,label:string,type:string,value?:any}>, sortNearby: boolean, text residual }}
 */
export function parseSearchQuery(raw) {
  let q = String(raw || "").toLowerCase().trim();
  const chips = [];
  const used = new Set();

  function add(id, label, type, value) {
    if (used.has(id)) return;
    used.add(id);
    chips.push({ id, label, type, value });
  }

  function consume(re) {
    if (re.test(q)) {
      q = q.replace(re, " ").replace(/\s+/g, " ").trim();
      return true;
    }
    return false;
  }

  if (consume(/\b(near\s*me|nearby|around\s*me)\b/g)) add("nearby", "Nearby", "sort", true);

  const underMatch = q.match(/under\s*₹?\s*(\d+)/i) || q.match(/₹\s*(\d+)/);
  if (underMatch) {
    const n = Number(underMatch[1]);
    add(`price-${n}`, `₹${n}`, "maxCost", n);
    q = q.replace(underMatch[0], " ").replace(/\s+/g, " ").trim();
  }

  if (consume(/\b(new|just\s*opened|fresh)\b/g)) add("new", "New", "discovery", "new");
  if (consume(/\b(rising|trending|blowing\s*up)\b/g)) add("rising", "Rising", "discovery", "rising");
  if (consume(/\b(hidden\s*gems?|underrated)\b/g)) add("hidden", "Hidden", "discovery", "hidden");

  if (consume(/\bquiet\b/g)) add("quiet", "Quiet", "noise", "quiet");
  if (consume(/\blively\b/g)) add("lively", "Lively", "noise", "lively");

  if (consume(/\b(photo\s*spot|aesthetic|instagram|photos?)\b/g)) add("photo", "Photo spot", "photo", true);

  if (consume(/\b(late\s*night|open\s*late)\b/g)) add("late", "Late night", "lateNight", true);

  if (consume(/\b(studying|study)\b/g)) add("study", "Study", "bestFor", "Study");
  if (consume(/\b(work|working|laptop|remote)\b/g)) add("work", "Work", "bestFor", "Work");
  if (consume(/\b(date|romantic)\b/g)) add("date", "Date", "bestFor", "Date");

  if (consume(/\b(street\s*food)\b/g)) add("street", "Street food", "type", "street-food");
  if (consume(/\b(food\s*truck|truck)\b/g)) add("truck", "Food truck", "type", "food-truck");
  if (consume(/\b(dessert|bakery|sweet)\b/g)) add("dessert", "Desserts", "category", "dessert");
  if (consume(/\b(caf[eé]s?|coffee)\b/g)) add("cafe", "Café", "type", "cafe");

  if (consume(/\b(garden|outdoor|rooftop)\b/g)) add("outdoor", "Outdoor", "outdoor", true);

  const residual = q.replace(/\b(for|a|an|the|to|in|with|and|or|place|spot|somewhere)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return { chips, sortNearby: chips.some((c) => c.id === "nearby"), residual };
}

export function applySearchFilters(list, query) {
  const { chips, sortNearby, residual } = parseSearchQuery(query);
  let result = [...list];

  for (const chip of chips) {
    switch (chip.type) {
      case "discovery":
        if (chip.value === "new") result = result.filter(isNew);
        else if (chip.value === "rising") result = result.filter(isRising);
        else if (chip.value === "hidden") result = result.filter(isHidden);
        break;
      case "noise":
        result = result.filter(
          (c) => c.noiseLevel === chip.value || (chip.value === "quiet" && (c.tags || []).some((t) => /quiet/i.test(t)))
        );
        break;
      case "photo":
        result = result.filter(photoSpot);
        break;
      case "lateNight":
        result = result.filter((c) => c.lateNight);
        break;
      case "bestFor":
        result = result.filter((c) => c.bestFor?.includes(chip.value));
        break;
      case "type":
        result = result.filter((c) => c.type === chip.value || (chip.value === "cafe" && (!c.type || c.type === "cafe")));
        break;
      case "category":
        result = result.filter(
          (c) =>
            c.category?.toLowerCase().includes("dessert") ||
            c.category?.toLowerCase().includes("bakery")
        );
        break;
      case "outdoor":
        result = result.filter(
          (c) =>
            c.seating?.some((s) => ["Outdoor", "Garden", "Rooftop"].includes(s)) ||
            (c.tags || []).some((t) => /garden|outdoor|rooftop/i.test(t))
        );
        break;
      case "maxCost":
        result = result.filter((c) => (c.avgCostForTwo || 9999) <= chip.value);
        break;
      default:
        break;
    }
  }

  if (residual) {
    const r = residual.toLowerCase();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(r) ||
        c.category?.toLowerCase().includes(r) ||
        (c.tags || []).some((t) => t.toLowerCase().includes(r)) ||
        c.bestFor?.some((b) => b.toLowerCase().includes(r)) ||
        c.city?.toLowerCase().includes(r) ||
        c.address?.toLowerCase().includes(r)
    );
  }

  if (sortNearby) {
    result = [...result].sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  return { results: result, chips, sortNearby, residual };
}

export const SEARCH_SUGGESTIONS = [
  "new cafés near me",
  "hidden gems in Delhi",
  "quiet café for studying",
  "date spot under ₹1000",
  "street food open late",
];
