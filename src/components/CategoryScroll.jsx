import { Sparkles, TrendingUp, Gem } from "lucide-react";

const PRIMARY = new Set(["new", "rising", "hidden-gem"]);

const categories = [
  { id: "new", label: "New", Icon: Sparkles, primary: true },
  { id: "rising", label: "Rising", Icon: TrendingUp, primary: true },
  { id: "hidden-gem", label: "Hidden gems", Icon: Gem, primary: true },
  { id: "coffee", label: "Cafés" },
  { id: "desserts", label: "Desserts" },
  { id: "street-food", label: "Street Food" },
  { id: "food-truck", label: "Food Trucks" },
  { id: "date", label: "Date" },
  { id: "study", label: "Study" },
  { id: "work", label: "Work" },
  { id: "outdoor", label: "Outdoor" },
  { id: "late-night", label: "Late Night" },
  { id: "photo", label: "Photo Spots" },
  { id: "budget", label: "Budget" },
];

export default function CategoryScroll({ active, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {categories.map((cat) => {
        const isActive = active === cat.id;
        const isPrimary = PRIMARY.has(cat.id);
        const Icon = cat.Icon;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(isActive ? null : cat.id)}
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
              isActive
                ? cat.id === "new"
                  ? "wandr-new-accent shadow-sm"
                  : "bg-warm-600 text-white shadow-sm"
                : "border border-warm-200 bg-transparent text-warm-500 hover:border-warm-400 hover:text-warm-700"
            }`}
          >
            {Icon && isPrimary && <Icon size={14} strokeWidth={2} />}
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
