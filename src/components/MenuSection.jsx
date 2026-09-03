import { useMemo, useState } from "react";

const CATEGORY_STYLE = {
  Coffee: {
    chip: "bg-warm-600 text-white",
    card: "from-warm-50 to-terracotta-50 border-warm-100",
    accent: "text-warm-600",
  },
  Food: {
    chip: "bg-sage-500 text-white",
    card: "from-sage-50 to-warm-50 border-sage-100",
    accent: "text-sage-500",
  },
  Dessert: {
    chip: "bg-blush-500 text-white",
    card: "from-blush-50 to-gold-50 border-blush-100",
    accent: "text-blush-500",
  },
  Drinks: {
    chip: "bg-lavender-500 text-white",
    card: "from-lavender-50 to-warm-50 border-lavender-100",
    accent: "text-lavender-500",
  },
  Other: {
    chip: "bg-warm-500 text-white",
    card: "from-warm-50 to-cream border-warm-100",
    accent: "text-warm-500",
  },
};

const FOOD_PHOTOS = {
  Coffee: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&q=80",
  Food: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=300&q=80",
  Dessert: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&q=80",
  Drinks: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=300&q=80",
  Other: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&q=80",
  latte: "https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=300&q=80",
  toast: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=300&q=80",
  bowl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80",
  roll: "https://images.unsplash.com/photo-1509365465985-36d90405b411?w=300&q=80",
  espresso: "https://images.unsplash.com/photo-1510591509090-cd3f2c1c4f0e?w=300&q=80",
  cake: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&q=80",
  sandwich: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&q=80",
};

function photoFor(item) {
  if (item.image) return item.image;
  const name = (item.item || "").toLowerCase();
  if (name.includes("latte") || name.includes("cappuccino") || name.includes("flat white")) return FOOD_PHOTOS.latte;
  if (name.includes("toast") || name.includes("sourdough")) return FOOD_PHOTOS.toast;
  if (name.includes("bowl") || name.includes("salad") || name.includes("acai")) return FOOD_PHOTOS.bowl;
  if (name.includes("roll") || name.includes("cinnamon") || name.includes("croissant")) return FOOD_PHOTOS.roll;
  if (name.includes("espresso") || name.includes("pour") || name.includes("brew") || name.includes("filter")) return FOOD_PHOTOS.espresso;
  if (name.includes("cake") || name.includes("brownie") || name.includes("tiramisu") || name.includes("cheesecake")) return FOOD_PHOTOS.cake;
  if (name.includes("sandwich")) return FOOD_PHOTOS.sandwich;
  return FOOD_PHOTOS[item.category] || FOOD_PHOTOS.Other;
}

export default function MenuSection({ menu }) {
  const [view, setView] = useState("photos"); // photos | list

  const grouped = useMemo(() => {
    if (!menu?.length) return {};
    return menu.reduce((acc, item) => {
      const cat = item.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
  }, [menu]);

  if (!menu?.length) return null;

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_24px_rgba(45,36,24,0.08)] p-5 overflow-hidden">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h3 className="text-sm font-bold text-warm-700">Menu</h3>
        <div className="flex gap-1 p-1 bg-warm-50 rounded-xl">
          <button
            type="button"
            onClick={() => setView("photos")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              view === "photos" ? "bg-white text-warm-700 shadow-sm" : "text-warm-400"
            }`}
          >
            Photos
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              view === "list" ? "bg-white text-warm-700 shadow-sm" : "text-warm-400"
            }`}
          >
            List
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {Object.entries(grouped).map(([category, items]) => {
          const style = CATEGORY_STYLE[category] || CATEGORY_STYLE.Other;
          return (
            <div key={category}>
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 ${style.chip}`}>
                {category}
              </span>

              {view === "photos" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {items.map((item, i) => (
                    <div
                      key={i}
                      className={`rounded-2xl overflow-hidden border bg-gradient-to-br ${style.card} hover:-translate-y-0.5 hover:shadow-md transition-all`}
                    >
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={photoFor(item)}
                          alt={item.item}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-bold text-warm-700 leading-snug line-clamp-2">{item.item}</p>
                        <p className={`text-sm font-bold mt-1 ${style.accent}`}>₹{item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border bg-gradient-to-r ${style.card}`}
                    >
                      <img
                        src={photoFor(item)}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                      />
                      <span className="flex-1 text-sm font-medium text-warm-700">{item.item}</span>
                      <span className={`text-sm font-bold tabular-nums ${style.accent}`}>₹{item.price}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
