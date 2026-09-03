import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star, MapPin, Sparkles, Leaf, TrendingUp } from "lucide-react";

export default function AutoSlideCarousel({ cafes = [], interval = 4000 }) {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = cafes.length;

  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);

  useEffect(() => {
    if (paused || total <= 1) return;
    const id = setInterval(next, interval);
    return () => clearInterval(id);
  }, [paused, total, interval, next]);

  if (!total) return null;

  function getBadge(cafe) {
    if (cafe.badge === "new") return { icon: Sparkles, text: `New · Opened ${cafe.openedDaysAgo}d ago`, cls: "bg-terracotta-500" };
    if (cafe.badge === "hidden-gem") return { icon: Leaf, text: "Hidden Gem", cls: "bg-sage-500" };
    const growth = cafe.savesLastWeek > 0
      ? Math.round(((cafe.savesThisWeek - cafe.savesLastWeek) / cafe.savesLastWeek) * 100) : 0;
    if (growth > 30) return { icon: TrendingUp, text: `Trending · +${growth}%`, cls: "bg-warm-700" };
    return null;
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {cafes.map((cafe) => {
          const badge = getBadge(cafe);
          const BadgeIcon = badge?.icon;
          return (
            <div
              key={cafe.id}
              className="w-full shrink-0 cursor-pointer"
              onClick={() => navigate(`/cafe/${cafe.id}`)}
            >
              <div className="relative h-[200px] overflow-hidden sm:h-[260px] md:h-[300px] lg:h-[340px]">
                <img
                  src={cafe.image}
                  alt={cafe.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />

                {/* Badge */}
                {badge && (
                  <div className={`absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white ${badge.cls}`}>
                    <BadgeIcon size={13} />
                    {badge.text}
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                  <h3
                    className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {cafe.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-2 text-white/80 text-sm">
                    <span className="flex items-center gap-1">
                      <Star size={14} className="fill-gold-300 text-gold-300" />
                      {cafe.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={14} /> {cafe.distance} km
                    </span>
                    <span>{cafe.category}</span>
                    <span>{"₹".repeat(cafe.priceLevel)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {total > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md transition-opacity"
            style={{ opacity: paused ? 1 : 0 }}
          >
            <ChevronLeft size={18} className="text-warm-700" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md transition-opacity"
            style={{ opacity: paused ? 1 : 0 }}
          >
            <ChevronRight size={18} className="text-warm-700" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {cafes.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                className={`h-1.5 rounded-full transition-all ${
                  i === current ? "bg-white w-6" : "bg-white/40 w-1.5"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
