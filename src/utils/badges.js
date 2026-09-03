import { useMemo } from "react";

/** Lightweight rules-based badges from saves + discovery signals. */
export function computeBadges({ savedPlaces = [], submittedCount = 0 }) {
  const badges = [];
  const newSaves = savedPlaces.filter((p) => p.badge === "new" || (p.openedDaysAgo != null && p.openedDaysAgo <= 14));
  const gemSaves = savedPlaces.filter((p) => p.badge === "hidden-gem");
  const risingSaves = savedPlaces.filter((p) => (p.savesThisWeek || 0) > (p.savesLastWeek || 0) * 1.3);

  if (newSaves.length >= 3) {
    badges.push({
      id: "early-finder",
      title: "Early Finder",
      desc: "Found places before they became popular.",
      icon: "🏆",
    });
  }
  if (submittedCount >= 1 || savedPlaces.length >= 10) {
    badges.push({
      id: "local-scout",
      title: "Local Scout",
      desc: "Helping map what’s worth discovering.",
      icon: "🧭",
    });
  }
  if (gemSaves.length >= 3) {
    badges.push({
      id: "gem-hunter",
      title: "Gem Hunter",
      desc: "Discovered hidden gems.",
      icon: "💎",
    });
  }
  if (risingSaves.length >= 2) {
    badges.push({
      id: "trend-spotter",
      title: "Trend Spotter",
      desc: "Found rising places early.",
      icon: "🔥",
    });
  }
  return badges;
}

export function useBadges(savedPlaces, submittedCount = 0) {
  return useMemo(() => computeBadges({ savedPlaces, submittedCount }), [savedPlaces, submittedCount]);
}
