import { Sparkles, Leaf, TrendingUp, MapPin } from "lucide-react";

const filters = [
  { id: "all", label: "All", icon: null },
  { id: "nearby", label: "Nearby", icon: MapPin },
  { id: "trending", label: "Trending", icon: TrendingUp },
  { id: "new", label: "New", icon: Sparkles },
  { id: "hidden-gem", label: "Hidden Gems", icon: Leaf },
];

export default function FilterTabs({ active, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {filters.map((f) => {
        const Icon = f.icon;
        const isActive = active === f.id;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange(f.id)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              isActive
                ? f.id === "new"
                  ? "wandr-new-accent shadow-sm"
                  : "bg-warm-600 text-white shadow-sm"
                : "border border-warm-200 bg-transparent text-warm-500 hover:border-warm-400 hover:text-warm-700"
            }`}
          >
            {Icon && <Icon size={14} />}
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
