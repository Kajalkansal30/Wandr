import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Plus, MapPin, Check, BookOpen, X, ArrowLeft, Folder } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { usePlaces } from "../contexts/PlacesContext";
import CafeCard from "../components/CafeCard";
import { loadSavedIds } from "../utils/favorites";

const DEFAULT_COLLECTIONS = [
  { id: "want-to-visit", name: "Want to Visit", Icon: MapPin },
  { id: "visited", name: "Visited", Icon: Check },
  { id: "date-ideas", name: "Date Ideas", Icon: Heart },
  { id: "study-spots", name: "Study Spots", Icon: BookOpen },
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
    setCollections((prev) => [...prev, { id: `custom-${Date.now()}`, name: newName.trim(), Icon: Folder }]);
    setNewName("");
    setShowCreate(false);
  }

  if (loading) {
    return (
      <div className="page-shell page-with-nav flex justify-center pt-14">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-warm-200 border-t-warm-600" />
      </div>
    );
  }

  return (
    <div className="page-shell page-with-nav pt-6 md:pt-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm text-warm-400 transition hover:text-warm-600"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="mb-2 text-2xl font-bold text-warm-700 md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
        Places you want to discover
      </h1>
      <p className="mb-8 text-sm text-warm-400 md:text-base">
        {savedCafes.length} {savedCafes.length === 1 ? "place" : "places"} saved
      </p>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveCollection(null)}
          className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
            activeCollection === null
              ? "bg-warm-600 text-white"
              : "border border-warm-200 bg-transparent text-warm-500 hover:border-warm-400"
          }`}
        >
          All ({savedCafes.length})
        </button>
        {collections.map((col) => {
          const Icon = col.Icon || Folder;
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => setActiveCollection(col.id === activeCollection ? null : col.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                activeCollection === col.id
                  ? "bg-warm-600 text-white"
                  : "border border-warm-200 bg-transparent text-warm-500 hover:border-warm-400"
              }`}
            >
              <Icon size={14} /> {col.name}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed border-warm-300 px-3 py-2 text-sm font-medium text-warm-400 transition hover:border-warm-500 hover:text-warm-600"
        >
          <Plus size={14} /> New
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm animate-scale-in rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-warm-700">New collection</h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-warm-50 transition hover:bg-warm-100"
              >
                <X size={16} className="text-warm-500" />
              </button>
            </div>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Collection name"
              className="mb-4 w-full rounded-xl border border-warm-200 px-4 py-3 text-warm-700"
              onKeyDown={(e) => e.key === "Enter" && createCollection()}
            />
            <button
              type="button"
              onClick={createCollection}
              className="w-full rounded-xl bg-warm-600 py-3 font-semibold text-white transition hover:bg-terracotta-500"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {savedCafes.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Heart size={40} className="mb-4 text-warm-200" />
          <p className="font-medium text-warm-500">No saved places yet</p>
          <p className="mt-1 text-sm text-warm-400">Tap the heart on any place to save it here</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {savedCafes.map((cafe, i) => (
            <CafeCard key={cafe.id} cafe={cafe} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
