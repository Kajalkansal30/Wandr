import type { Place } from "../api/places";

export type CuratedListDef = {
  id: string;
  title: string;
  subtitle: string;
  filter: (c: Place) => boolean;
  sort?: (a: Place, b: Place) => number;
};

export const CURATED_LISTS: CuratedListDef[] = [
  {
    id: "new-this-week",
    title: "New This Week",
    subtitle: "Fresh openings",
    filter: (c) => Boolean((c as any).badge === "new" || c.operatingStatus === "NEW"),
  },
  {
    id: "hidden-gems",
    title: "Hidden Gems",
    subtitle: "Underrated spots",
    filter: (c) => (c.tags || []).some((t) => /hidden|gem/i.test(t)),
  },
  {
    id: "trending",
    title: "Trending",
    subtitle: "Most saved",
    filter: () => true,
    sort: (a, b) => (b.savedCount || 0) - (a.savedCount || 0),
  },
  {
    id: "study-work",
    title: "Study & Work",
    subtitle: "Quiet work vibes",
    filter: (c) => (c.bestFor || []).some((t) => /study|work/i.test(t)),
  },
];

export function getCuratedList(listId: string) {
  return CURATED_LISTS.find((l) => l.id === listId) || CURATED_LISTS[0];
}
