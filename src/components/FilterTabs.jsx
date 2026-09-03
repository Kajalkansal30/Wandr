import { Sparkles, Leaf, Flame, MapPin } from "lucide-react";

const filters = [
  { id: "all", label: "All", icon: null },
  { id: "nearby", label: "Nearby", icon: MapPin },
  { id: "trending", label: "Trending", icon: Flame },
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
            onClick={() => onChange(f.id)}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isActive
                ? "bg-warm-600 text-white shadow-sm"
                : "bg-white text-warm-500 border border-warm-100 hover:border-warm-300"
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
