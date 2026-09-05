import { useEffect, useState } from "react";
import { FolderPlus, X, Check } from "lucide-react";
import {
  loadCollections,
  createCollection,
  togglePlaceInCollection,
} from "../utils/collections";

export default function SaveToCollectionSheet({ open, userId, placeId, onClose }) {
  const [collections, setCollections] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (open) setCollections(loadCollections(userId));
  }, [open, userId]);

  if (!open || !placeId) return null;

  function toggle(colId) {
    setCollections(togglePlaceInCollection(userId, colId, placeId));
  }

  function handleCreate() {
    if (!newName.trim()) return;
    const next = createCollection(userId, newName.trim());
    const created = next[0];
    setCollections(togglePlaceInCollection(userId, created.id, placeId));
    setNewName("");
    setCreating(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 md:items-center" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-cream p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-warm-700" style={{ fontFamily: "var(--font-display)" }}>
            Save to…
          </h3>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-warm-400 hover:bg-warm-100">
            <X size={18} />
          </button>
        </div>
        <p className="mb-3 text-xs text-warm-400">Saved to your library. Add it to a collection:</p>
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {collections.map((col) => {
            const on = col.placeIds.includes(String(placeId));
            return (
              <button
                key={col.id}
                type="button"
                onClick={() => toggle(col.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  on ? "bg-warm-600 text-white" : "bg-white text-warm-700 hover:bg-warm-50"
                }`}
              >
                <span className="font-medium">{col.name}</span>
                {on && <Check size={16} />}
              </button>
            );
          })}
        </div>
        {creating ? (
          <div className="mt-3 flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Collection name"
              className="flex-1 rounded-xl border border-warm-200 px-3 py-2 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-xl bg-warm-600 px-3 py-2 text-sm font-semibold text-white"
            >
              Add
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-warm-300 py-2.5 text-sm font-medium text-warm-500"
          >
            <FolderPlus size={16} /> New collection
          </button>
        )}
        <button type="button" onClick={onClose} className="mt-2 w-full py-2 text-sm text-warm-400">
          Done
        </button>
      </div>
    </div>
  );
}
