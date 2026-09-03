import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, List, MapIcon, MapPin } from "lucide-react";
import SearchBar from "../components/SearchBar";
import CategoryScroll from "../components/CategoryScroll";
import CafeCard from "../components/CafeCard";
import MapView from "../components/MapView";
import { usePlaces } from "../contexts/PlacesContext";
import { filterByDiscovery } from "../utils/discovery";
import { applySearchFilters } from "../utils/searchParser";

export default function MapExplorePage() {
  const navigate = useNavigate();
  const { places: cafes } = usePlaces();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(null);
  const [mobileView, setMobileView] = useState("map");

  const filtered = useMemo(() => {
    let list = cafes;
    if (search.trim()) {
      list = applySearchFilters(list, search).results;
    }
    if (category) {
      list = filterByDiscovery(list, category);
    }
    return list;
  }, [search, category, cafes]);

  return (
    <div className="flex h-dvh min-h-0 flex-col">
      <div className="shrink-0 space-y-3 border-b border-warm-100 bg-cream px-[clamp(0.75rem,2vw,1.25rem)] py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-warm-200 bg-white transition hover:bg-warm-50"
          >
            <ArrowLeft size={16} className="text-warm-600" />
          </button>
          <div className="min-w-0 flex-1">
            <SearchBar value={search} onChange={(v) => { setSearch(v); if (v) setCategory(null); }} />
          </div>
          <button
            type="button"
            onClick={() => setMobileView(mobileView === "map" ? "list" : "map")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-warm-200 bg-white transition hover:bg-warm-50 lg:hidden"
          >
            {mobileView === "map" ? <List size={16} className="text-warm-600" /> : <MapIcon size={16} className="text-warm-600" />}
          </button>
        </div>
        <CategoryScroll active={category} onChange={(c) => { setCategory(c); if (c) setSearch(""); }} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div
          className={`min-h-0 w-full overflow-y-auto border-warm-100 bg-cream lg:w-[min(38%,28rem)] lg:border-r ${
            mobileView === "list" ? "block" : "hidden lg:block"
          }`}
        >
          <div className="space-y-3 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-warm-400">
              Explore this area · {filtered.length} {filtered.length === 1 ? "place" : "places"}
            </p>
            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <MapPin size={28} className="mx-auto mb-2 text-warm-200" />
                <p className="text-sm text-warm-400">No places match your search</p>
              </div>
            ) : (
              filtered.map((cafe, i) => (
                <CafeCard key={cafe.id} cafe={cafe} index={i} />
              ))
            )}
          </div>
        </div>

        <div className={`min-h-0 min-w-0 flex-1 ${mobileView === "map" ? "block" : "hidden lg:block"}`}>
          <MapView cafes={filtered} />
        </div>
      </div>
    </div>
  );
}
