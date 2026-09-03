import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Plus, FolderHeart, MapPin, X, ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { usePlaces } from "../contexts/PlacesContext";
import CafeCard from "../components/CafeCard";
import { loadSavedIds } from "../utils/favorites";

const DEFAULT_COLLECTIONS = [
  { id: "want-to-visit", name: "Want to Visit", icon: "📍" },
  { id: "visited", name: "Visited", icon: "✅" },
  { id: "date-ideas", name: "Date Ideas", icon: "❤️" },
  { id: "study-spots", name: "Study Spots", icon: "📚" },
];

export default function SavedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { places } = usePlaces();
  const [savedIds, setSavedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCollection, setActiveCollection] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [collections, setCollections] = useState(DEFAULT_COLLECTIONS);

  useEffect(() => {
    async function fetchSaved() {
      if (!user) {
        setSavedIds([]);
        setLoading(false);
        return;
      }
      try {
        setSavedIds(await loadSavedIds(user));
      } catch {
        setSavedIds([]);
      }
      setLoading(false);
    }
    fetchSaved();
  }, [user]);

  const savedCafes = places.filter((c) => savedIds.includes(String(c.id)));

  function createCollection() {
    if (!newName.trim()) return;
    setCollections((prev) => [...prev, { id: `custom-${Date.now()}`, name: newName.trim(), icon: "📁" }]);
    setNewName("");
    setShowCreate(false);
  }

  if (loading) {
    return (
      <div className="page-shell page-with-nav flex justify-center pt-14">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-warm-200 border-t-warm-500" />
      </div>
    );
  }

  return (
    <div className="page-shell page-with-nav pt-6 md:pt-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm text-warm-500 transition hover:text-warm-600"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="mb-2 text-2xl font-bold text-warm-700 md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
        Places you want to discover
      </h1>
      <p className="mb-8 text-sm text-warm-400 md:text-base">
        {savedCafes.length} {savedCafes.length === 1 ? "place" : "places"} saved
      </p>

      {/* Collections */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        <button
          onClick={() => setActiveCollection(null)}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
            activeCollection === null
              ? "bg-warm-600 text-white"
              : "bg-white text-warm-600 border border-warm-200 hover:border-warm-400"
          }`}
        >
          All ({savedCafes.length})
        </button>
        {collections.map((col) => (
          <button
            key={col.id}
            onClick={() => setActiveCollection(col.id === activeCollection ? null : col.id)}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
              activeCollection === col.id
                ? "bg-warm-600 text-white"
                : "bg-white text-warm-600 border border-warm-200 hover:border-warm-400"
            }`}
          >
            <span>{col.icon}</span> {col.name}
          </button>
        ))}
        <button
          onClick={() => setShowCreate(true)}
          className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium text-warm-400 border border-dashed border-warm-300 hover:border-warm-500 hover:text-warm-600 transition"
        >
          <Plus size={14} /> New
        </button>
      </div>

      {/* Create collection modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-warm-700">New collection</h3>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-full bg-warm-50 flex items-center justify-center hover:bg-warm-100 transition">
                <X size={16} className="text-warm-500" />
              </button>
            </div>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder='e.g. "Weekend Spots"'
              className="w-full bg-warm-50 px-4 py-3 rounded-xl text-warm-700 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-warm-300/50 transition mb-4"
              autoFocus
            />
            <button
              onClick={createCollection}
              disabled={!newName.trim()}
              className="w-full bg-warm-600 text-white font-semibold py-3 rounded-xl hover:bg-warm-700 transition disabled:opacity-50"
            >
              Create Collection
            </button>
          </div>
        </div>
      )}

      {/* Cards */}
      {savedCafes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-warm-100 flex items-center justify-center mb-4">
            <Heart size={28} className="text-warm-300" />
          </div>
          <h3 className="text-lg font-semibold text-warm-600 mb-1">No saved places yet</h3>
          <p className="text-sm text-warm-400 max-w-[280px]">
            Tap the heart on any place to save it here for later
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {savedCafes.map((cafe, i) => (
            <CafeCard key={cafe.id} cafe={cafe} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
