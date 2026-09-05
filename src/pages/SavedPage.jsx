import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Plus, MapPin, Check, BookOpen, X, ArrowLeft, Folder } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { usePlaces } from "../contexts/PlacesContext";
import CafeCard from "../components/CafeCard";
import { loadSavedIds } from "../utils/favorites";
import {
  loadCollections,
  createCollection,
  deleteCollection,
} from "../utils/collections";

const ICONS = {
  "want-to-visit": MapPin,
  visited: Check,
  "date-ideas": Heart,
  "study-spots": BookOpen,
};

export default function SavedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { places } = usePlaces();
  const [savedIds, setSavedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCollection, setActiveCollection] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    if (!user) {
      setSavedIds([]);
      setCollections([]);
      setLoading(false);
      return;
    }
    setCollections(loadCollections(user.uid));
    loadSavedIds(user)
      .then(setSavedIds)
      .catch(() => setSavedIds([]))
      .finally(() => setLoading(false));
  }, [user]);

  const savedCafes = places.filter((c) => savedIds.includes(String(c.id)));
  const visibleCafes = (() => {
    if (!activeCollection) return savedCafes;
    const col = collections.find((c) => c.id === activeCollection);
    if (!col) return savedCafes;
    return savedCafes.filter((c) => col.placeIds.includes(String(c.id)));
  })();

  function handleCreate() {
    if (!newName.trim() || !user) return;
    setCollections(createCollection(user.uid, newName.trim()));
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
        Saved
      </h1>
      <p className="mb-8 text-sm text-warm-400 md:text-base">
        {savedCafes.length} {savedCafes.length === 1 ? "place" : "places"} in your library
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
          const Icon = ICONS[col.id] || Folder;
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
              <span className="opacity-70">({col.placeIds.filter((id) => savedIds.includes(id)).length})</span>
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

      {activeCollection && activeCollection.startsWith("custom-") && (
        <button
          type="button"
          onClick={() => {
            if (!user) return;
            setCollections(deleteCollection(user.uid, activeCollection));
            setActiveCollection(null);
          }}
          className="mb-4 text-xs font-medium text-terracotta-500 hover:underline"
        >
          Delete this collection
        </button>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm animate-scale-in rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-warm-700">New collection</h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-warm-50"
              >
                <X size={16} className="text-warm-500" />
              </button>
            </div>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Weekend brunch"
              className="mb-4 w-full rounded-xl border border-warm-200 px-4 py-3 text-warm-700"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <button
              type="button"
              onClick={handleCreate}
              className="w-full rounded-xl bg-warm-600 py-3 font-semibold text-white transition hover:bg-terracotta-500"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {visibleCafes.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Heart size={40} className="mb-4 text-warm-200" />
          <p className="font-medium text-warm-500">
            {activeCollection ? "Nothing in this collection yet" : "No saved places yet"}
          </p>
          <p className="mt-1 text-sm text-warm-400">
            {activeCollection
              ? "Open a place and use Save to… to add it here"
              : "Tap the heart on any place to save it"}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCafes.map((cafe, i) => (
            <CafeCard key={cafe.id} cafe={cafe} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
