import { useNavigate } from "react-router-dom";
import { Star, MapPin, Sparkles, Leaf } from "lucide-react";

const TYPE_LABELS = {
  "street-food": "Street Food",
  "food-truck": "Food Truck",
  bakery: "Bakery",
};

export default function MasonryPin({ cafe, index = 0 }) {
  const navigate = useNavigate();
  const heights = ["h-40", "h-52", "h-44", "h-56", "h-48", "h-60"];
  const imgH = heights[index % heights.length];
  const typeLabel = TYPE_LABELS[cafe.type] || null;

  return (
    <article
      onClick={() => navigate(`/cafe/${cafe.id}`)}
      className="break-inside-avoid mb-4 bg-white rounded-xl overflow-hidden cursor-pointer card-hover group animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className={`relative ${imgH} overflow-hidden`}>
        <img
          src={cafe.image}
          alt={cafe.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Discovery badge */}
        {cafe.badge === "new" && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-terracotta-500 text-white text-xs font-semibold">
            <Sparkles size={10} /> New
          </div>
        )}
        {cafe.badge === "hidden-gem" && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-sage-500 text-white text-xs font-semibold">
            <Leaf size={10} /> Gem
          </div>
        )}

        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
          <span className="text-white text-xs font-medium drop-shadow flex items-center gap-1">
            <MapPin size={11} /> {cafe.distance} km
          </span>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/30 backdrop-blur-sm">
            <Star size={11} className="fill-gold-300 text-gold-300" />
            <span className="text-xs font-bold text-white">{cafe.rating}</span>
          </div>
        </div>
      </div>

      <div className="p-3">
        <h3 className="text-sm font-bold text-warm-700 leading-snug">{cafe.name}</h3>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-warm-400">
          {typeLabel && <span className="text-terracotta-400 font-medium">{typeLabel}</span>}
          {typeLabel && <span className="text-warm-200">·</span>}
          <span>{cafe.category}</span>
          <span className="text-warm-200">·</span>
          <span>{"₹".repeat(cafe.priceLevel)}</span>
        </div>
      </div>
    </article>
  );
}
