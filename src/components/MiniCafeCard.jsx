import { useNavigate } from "react-router-dom";
import { Star, Sparkles, Heart } from "lucide-react";

export default function MiniCafeCard({ cafe, tall = false }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/cafe/${cafe.id}`)}
      className={`shrink-0 ${tall ? "w-[160px]" : "w-[180px]"} bg-white rounded-2xl overflow-hidden cursor-pointer card-hover group`}
      style={{ boxShadow: "0 2px 16px rgba(45,36,24,0.06)" }}
    >
      <div className={`relative overflow-hidden ${tall ? "h-44" : "h-32"}`}>
        <img
          src={cafe.image}
          alt={cafe.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
        {cafe.openedDaysAgo != null && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-terracotta-400 to-terracotta-300 text-white text-[10px] font-bold rounded-full shadow-md">
            <Sparkles size={9} /> {cafe.openedDaysAgo}d ago
          </div>
        )}
        <button
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart size={12} className="text-warm-400" />
        </button>
      </div>
      <div className="p-3">
        <h4 className="text-sm font-bold text-warm-700 truncate group-hover:text-warm-600 transition-colors">
          {cafe.name}
        </h4>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-warm-400">{cafe.distance} km</span>
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gold-50 rounded-full">
            <Star size={10} className="fill-gold-400 text-gold-400" />
            <span className="text-[11px] font-bold text-warm-600">{cafe.rating}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
