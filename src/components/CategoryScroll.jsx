import { useState } from "react";
import { Sparkles, TrendingUp, Gem, ChevronDown, ChevronUp } from "lucide-react";

const PRIMARY = new Set(["new", "rising", "hidden-gem"]);

const PRIMARY_CATS = [
  { id: "new", label: "New", Icon: Sparkles },
  { id: "rising", label: "Rising", Icon: TrendingUp },
  { id: "hidden-gem", label: "Hidden gems", Icon: Gem },
  { id: "coffee", label: "Cafés" },
  { id: "desserts", label: "Desserts" },
  { id: "street-food", label: "Street food" },
  { id: "date", label: "Date" },
  { id: "study", label: "Study" },
  { id: "work", label: "Work" },
];

const MORE_CATS = [
  { id: "food-truck", label: "Food Trucks" },
  { id: "outdoor", label: "Outdoor" },
  { id: "late-night", label: "Late Night" },
  { id: "photo", label: "Photo Spots" },
  { id: "budget", label: "Budget" },
];

export default function CategoryScroll({ active, onChange }) {
  const [showMore, setShowMore] = useState(false);
  const cats = showMore ? [...PRIMARY_CATS, ...MORE_CATS] : PRIMARY_CATS;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {cats.map((cat) => {
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
                  : "bg-[#EF6F61] text-white shadow-sm"
                : "border border-warm-200 bg-transparent text-warm-500 hover:border-warm-400 hover:text-warm-700"
            }`}
          >
            {Icon && isPrimary && <Icon size={14} strokeWidth={2} />}
            {cat.label}
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-warm-200 bg-white px-4 py-2 text-sm font-semibold text-warm-700 transition hover:border-warm-400"
      >
        {showMore ? (
          <>
            Less <ChevronUp size={14} />
          </>
        ) : (
          <>
            More <ChevronDown size={14} />
          </>
        )}
      </button>
    </div>
  );
}
