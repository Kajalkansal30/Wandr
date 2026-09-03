import { MapPin, X } from "lucide-react";
import { EXPLORE_AREAS, areaDisplayLabel } from "../utils/exploreArea";

export default function ExploreAnywhereSheet({ open, onClose, current, onSelect, customQuery, onCustomChange }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl bg-cream p-5 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-warm-700" style={{ fontFamily: "var(--font-display)" }}>
            Explore anywhere
          </h3>
          <button type="button" onClick={onClose} className="rounded-full bg-warm-100 p-2 text-warm-500">
            <X size={16} />
          </button>
        </div>
        <p className="mb-4 text-sm text-warm-400">Where do you want to wander?</p>

        <div className="space-y-2">
          {EXPLORE_AREAS.map((area) => (
            <button
              key={area.id}
              type="button"
              onClick={() => {
                onSelect(area);
                onClose();
              }}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                current?.id === area.id
                  ? "border-warm-500 bg-warm-50"
                  : "border-warm-100 bg-white hover:border-warm-300"
              }`}
            >
              <MapPin size={16} className="text-terracotta-400" />
              <span className="font-medium text-warm-700">{areaDisplayLabel(area)}</span>
            </button>
          ))}
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-warm-600">Search an area…</label>
          <input
            value={customQuery}
            onChange={(e) => onCustomChange(e.target.value)}
            placeholder="e.g. Hauz Khas, Gurgaon…"
            className="w-full rounded-xl border border-warm-100 bg-white px-4 py-3 text-sm text-warm-700 focus:outline-none focus:ring-2 focus:ring-warm-300"
            onKeyDown={(e) => {
              if (e.key === "Enter" && customQuery.trim()) {
                onSelect({ id: "custom", label: customQuery.trim(), city: customQuery.trim() });
                onClose();
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
