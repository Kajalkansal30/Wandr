const PRIMARY = new Set(["new", "rising", "hidden-gem"]);

const categories = [
  { id: "new", label: "🆕 New", primary: true },
  { id: "rising", label: "🔥 Rising", primary: true },
  { id: "hidden-gem", label: "💎 Hidden Gems", primary: true },
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
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(isActive ? null : cat.id)}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
              isActive
                ? "bg-warm-600 text-white shadow-sm"
                : isPrimary
                  ? "border-2 border-warm-300 bg-white font-semibold text-warm-700 hover:border-warm-500"
                  : "border border-warm-200 bg-white text-warm-600 hover:border-warm-400"
            }`}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
