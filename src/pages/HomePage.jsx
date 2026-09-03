import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { MapIcon, List, MapPin, ArrowRight, Search, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { usePlaces } from "../contexts/PlacesContext";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import CategoryScroll from "../components/CategoryScroll";
import DiscoverySection from "../components/DiscoverySection";
import CafeCard from "../components/CafeCard";
import MapView from "../components/MapView";
import ExploreAnywhereSheet from "../components/ExploreAnywhereSheet";
import { filterByDiscovery, newPlaces, risingPlaces, hiddenPlaces } from "../utils/discovery";
import { applySearchFilters } from "../utils/searchParser";
import { getRecommendations, recommendationReason } from "../utils/recommendations";
import { loadSavedIds } from "../utils/favorites";
import {
  loadExploreArea,
  saveExploreArea,
  filterByArea,
  areaDisplayLabel,
} from "../utils/exploreArea";
import {
  TASTE_BOOTSTRAP,
  loadTastePrefs,
  toggleTastePref,
  PICKED_FOR_YOU_MIN_SAVES,
} from "../utils/preferences";
import { trackEvent } from "../api/analytics";
import { injectSponsoredSlot } from "../utils/sponsored";

const VIBES = [
  { id: "date", label: "Date Night", emoji: "❤️", image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&q=80" },
  { id: "study", label: "Quiet & Study", emoji: "📚", image: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400&q=80" },
  { id: "work", label: "Work", emoji: "💻", image: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400&q=80" },
  { id: "outdoor", label: "Outdoor", emoji: "🌿", image: "https://images.unsplash.com/photo-1442512595331-e89e7384260c?w=400&q=80" },
  { id: "late-night", label: "Late Night", emoji: "🌙", image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80" },
  { id: "photo", label: "Photo Spots", emoji: "📸", image: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=400&q=80" },
];

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [area, setArea] = useState(() => loadExploreArea());
  const [areaOpen, setAreaOpen] = useState(false);
  const [customArea, setCustomArea] = useState("");
  const { user } = useAuth();
  const { places: allPlaces, loading: placesLoading } = usePlaces();
  const [savedIds, setSavedIds] = useState([]);
  const [tastePrefs, setTastePrefs] = useState(() => loadTastePrefs());
  const newSectionRef = useRef(null);

  useEffect(() => {
    if (!user) {
      setSavedIds([]);
      return;
    }
    loadSavedIds(user).then(setSavedIds).catch(() => setSavedIds([]));
  }, [user]);

  const cafes = useMemo(() => filterByArea(allPlaces, area), [allPlaces, area]);
  const canPersonalize = savedIds.length >= PICKED_FOR_YOU_MIN_SAVES;
  const forYou = useMemo(
    () => (canPersonalize ? getRecommendations(cafes, savedIds, 3) : []),
    [cafes, savedIds, canPersonalize]
  );
  const forYouReason = useMemo(
    () => (canPersonalize ? recommendationReason(cafes, savedIds) : ""),
    [cafes, savedIds, canPersonalize]
  );

  const searchParsed = useMemo(() => {
    if (!search.trim()) return null;
    return applySearchFilters(cafes, search);
  }, [search, cafes]);

  const categoryResults = useMemo(() => {
    if (!category) return null;
    return filterByDiscovery(cafes, category);
  }, [category, cafes]);

  const news = useMemo(() => newPlaces(cafes), [cafes]);
  const rising = useMemo(() => risingPlaces(cafes, 6), [cafes]);
  const gems = useMemo(() => hiddenPlaces(cafes), [cafes]);
  const newsWithAds = useMemo(() => injectSponsoredSlot(news.slice(0, 4), cafes), [news, cafes]);
  const searchWithAds = useMemo(() => {
    if (!searchParsed?.results) return null;
    return injectSponsoredSlot(searchParsed.results, cafes);
  }, [searchParsed, cafes]);
  const nearby = useMemo(
    () => [...cafes].sort((a, b) => (a.distance || 0) - (b.distance || 0)),
    [cafes]
  );

  const categoryWithAds = useMemo(() => {
    if (!categoryResults) return null;
    return injectSponsoredSlot(categoryResults, cafes);
  }, [categoryResults, cafes]);

  const isFiltered = Boolean(searchParsed || categoryResults);
  const displayList = searchWithAds || categoryWithAds || cafes;
  const searchChips = searchParsed?.chips || [];

  function removeChip(chipId) {
    const next = searchChips.filter((c) => c.id !== chipId);
    if (next.length === 0) setSearch("");
    else setSearch(next.map((c) => c.label).join(" "));
  }

  function onCategoryChange(c) {
    setCategory(c);
    if (c) {
      setSearch("");
      trackEvent("filter_used", { source: "home_category", metadata: { category: c } });
    }
  }

  useEffect(() => {
    if (!search.trim()) return;
    const t = setTimeout(() => {
      trackEvent("search", { source: "home", metadata: { q: search.slice(0, 120) } });
    }, 600);
    return () => clearTimeout(t);
  }, [search]);

  if (placesLoading && allPlaces.length === 0) {
    return (
      <>
        <Header />
        <main className="page-shell page-with-nav flex justify-center pt-20">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-warm-200 border-t-warm-500" />
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="page-shell page-with-nav pt-6">
        {!isFiltered && viewMode === "list" && (
          <section className="mb-8 md:mb-10">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setAreaOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-warm-200 bg-white px-3 py-1.5 text-sm font-medium text-warm-600 transition hover:border-warm-400"
              >
                <MapPin size={14} className="text-terracotta-400" />
                {areaDisplayLabel(area)}
              </button>
              <Link
                to={`/whats-new/${encodeURIComponent(area.city || area.label || "Delhi")}`}
                className="text-xs font-semibold text-warm-500 underline-offset-2 hover:underline"
              >
                What&apos;s new here?
              </Link>
            </div>

            <div className="mb-5 w-full max-w-3xl">
              <h1
                className="text-[1.75rem] font-bold leading-tight tracking-tight text-warm-700 sm:text-4xl md:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Find somewhere worth discovering.
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-warm-400 sm:mt-3 sm:text-base md:text-lg">
                New cafés, hidden gems, street food and local spots before everyone else finds them.
              </p>
            </div>

            <div className="mb-4 w-full max-w-3xl">
              <SearchBar
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  if (v) setCategory(null);
                }}
                onShortcutCategory={(id) => {
                  setCategory(id);
                  setSearch("");
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => newSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center gap-2 text-sm font-semibold text-warm-600 transition hover:text-warm-700"
            >
              Explore nearby <ArrowRight size={14} />
            </button>
          </section>
        )}

        {(isFiltered || viewMode === "map") && (
          <div className="mb-6">
            <h2
              className="text-2xl font-bold text-warm-700 md:text-3xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {searchParsed ? "Discover" : "Explore"}
            </h2>
            <div className="mt-4 max-w-2xl">
              <SearchBar
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  if (v) setCategory(null);
                }}
                onShortcutCategory={(id) => {
                  setCategory(id);
                  setSearch("");
                }}
              />
            </div>
            {searchChips.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {searchChips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => removeChip(chip.id)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-warm-100 px-3 py-1.5 text-xs font-semibold text-warm-700"
                  >
                    {chip.label}
                    <X size={12} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mb-8 flex items-center gap-3">
          <div className="flex-1 overflow-hidden">
            <CategoryScroll active={category} onChange={onCategoryChange} />
          </div>
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
              viewMode === "map"
                ? "bg-warm-600 text-white shadow-md"
                : "border border-warm-200 bg-white text-warm-500 hover:border-warm-400"
            }`}
          >
            {viewMode === "list" ? <MapIcon size={16} /> : <List size={16} />}
          </button>
        </div>

        {viewMode === "map" ? (
          <div className="grid animate-scale-in gap-5 lg:grid-cols-5">
            <div className="min-h-[50vh] overflow-hidden rounded-2xl lg:col-span-3 lg:min-h-[70vh]">
              <MapView cafes={displayList} />
            </div>
            <div className="hidden max-h-[70vh] space-y-4 overflow-y-auto pr-2 lg:col-span-2 lg:block">
              <p className="text-sm font-semibold text-warm-600">Explore this area · {displayList.length} places</p>
              {displayList.map((cafe, i) => (
                <CafeCard key={cafe.id} cafe={cafe} index={i} />
              ))}
            </div>
          </div>
        ) : isFiltered ? (
          displayList.length === 0 ? (
            <div className="flex animate-fade-in flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warm-100">
                <Search size={28} className="text-warm-300" />
              </div>
              <p className="mb-1 text-lg font-semibold text-warm-600">Nothing to discover yet</p>
              <p className="mb-6 text-sm text-warm-400">Try another vibe — or explore hidden gems</p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("hidden-gem");
                }}
                className="text-sm font-semibold text-warm-600 underline"
              >
                Explore hidden gems →
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {displayList.map((cafe, i) => (
                <CafeCard key={cafe.id} cafe={cafe} index={i} />
              ))}
            </div>
          )
        ) : (
          <div>
            <div ref={newSectionRef}>
              <DiscoverySection
                title="New around you"
                subtitle={
                  news.length
                    ? `${news.length} place${news.length === 1 ? "" : "s"} opened recently`
                    : "Fresh listings before they go mainstream"
                }
              >
                {news.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-warm-200 bg-white px-6 py-10 text-center">
                    <p className="font-semibold text-warm-600">No new places nearby yet</p>
                    <button
                      type="button"
                      onClick={() => setCategory("hidden-gem")}
                      className="mt-3 text-sm font-semibold text-terracotta-500 hover:underline"
                    >
                      Explore hidden gems →
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {newsWithAds.map((cafe, i) => (
                      <CafeCard
                        key={cafe._sponsoredSlot ? `ad-${cafe.id}` : cafe.id}
                        cafe={cafe}
                        index={i}
                        featured={i === 0 && !cafe._sponsoredSlot}
                      />
                    ))}
                  </div>
                )}
              </DiscoverySection>
            </div>

            <DiscoverySection title="Rising" subtitle="About to be discovered — momentum this week">
              {rising.length === 0 ? (
                <p className="text-sm text-warm-400">No rising places right now. Check back soon.</p>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {rising.map((cafe, i) => (
                    <CafeCard key={cafe.id} cafe={cafe} index={i} />
                  ))}
                </div>
              )}
            </DiscoverySection>

            {gems.length > 0 && (
              <DiscoverySection title="Hidden gems" subtitle="Great places that haven't become famous yet">
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {gems.slice(0, 6).map((cafe, i) => (
                    <CafeCard key={cafe.id} cafe={cafe} index={i} />
                  ))}
                </div>
              </DiscoverySection>
            )}

            <section className="section-gap">
              <h2
                className="mb-5 text-lg font-bold text-warm-700 md:text-xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Explore by vibe
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {VIBES.map((vibe) => (
                  <button
                    key={vibe.id}
                    type="button"
                    onClick={() => {
                      setCategory(vibe.id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-xl"
                  >
                    <img
                      src={vibe.image}
                      alt={vibe.label}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <span className="mb-0.5 block text-lg">{vibe.emoji}</span>
                      <span className="text-xs font-semibold leading-tight text-white">{vibe.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="section-gap">
              <div
                className="group relative h-64 cursor-pointer overflow-hidden rounded-2xl md:h-80"
                onClick={() => setViewMode("map")}
                onKeyDown={(e) => e.key === "Enter" && setViewMode("map")}
                role="button"
                tabIndex={0}
              >
                <MapView cafes={nearby.slice(0, 12)} />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-warm-800/70 via-transparent to-transparent" />
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-end justify-between p-5">
                  <div>
                    <h2 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                      Explore the map
                    </h2>
                    <p className="mt-0.5 text-sm text-white/70">Explore {cafes.length} places</p>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-semibold text-white">
                    Open map <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </section>

            {canPersonalize && forYou.length > 0 ? (
              <DiscoverySection title="Picked for you" subtitle={forYouReason}>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {forYou.map((cafe, i) => (
                    <CafeCard key={cafe.id} cafe={cafe} index={i} />
                  ))}
                </div>
              </DiscoverySection>
            ) : !canPersonalize ? (
              <section className="section-gap">
                <h2
                  className="mb-2 text-lg font-bold text-warm-700 md:text-xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Tell us what you like
                </h2>
                <p className="mb-4 text-sm text-warm-400">
                  Pick a few vibes so Wandr can personalize later — Picked for you unlocks after {PICKED_FOR_YOU_MIN_SAVES}+ saves.
                </p>
                <div className="flex flex-wrap gap-2">
                  {TASTE_BOOTSTRAP.map((pref) => {
                    const on = tastePrefs.includes(pref.id);
                    return (
                      <button
                        key={pref.id}
                        type="button"
                        onClick={() => {
                          const next = toggleTastePref(pref.id);
                          setTastePrefs(next);
                          trackEvent("taste_pref", {
                            source: "home_bootstrap",
                            metadata: { id: pref.id, on: next.includes(pref.id) },
                          });
                        }}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          on
                            ? "bg-warm-600 text-white"
                            : "border border-warm-200 bg-white text-warm-600 hover:border-warm-400"
                        }`}
                      >
                        {pref.emoji} {pref.label}
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </main>

      <ExploreAnywhereSheet
        open={areaOpen}
        onClose={() => setAreaOpen(false)}
        current={area}
        customQuery={customArea}
        onCustomChange={setCustomArea}
        onSelect={(next) => {
          setArea(next);
          saveExploreArea(next);
          setCustomArea("");
        }}
      />
    </>
  );
}
