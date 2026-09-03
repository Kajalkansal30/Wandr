import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MapPin, Star, Sparkles, Leaf, TrendingUp, HelpCircle, X, Megaphone } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { loadSavedIds, toggleSavedCafe } from "../utils/favorites";
import { discoveryLabel, experienceTags, saveGrowthPct } from "../utils/discovery";
import { trackEvent } from "../api/analytics";
import { operatingLabel } from "../utils/placeStatus";

const KIND_STYLE = {
  new: { icon: Sparkles, classes: "bg-terracotta-500 text-white" },
  rising: { icon: TrendingUp, classes: "bg-warm-700 text-white" },
  hidden: { icon: Leaf, classes: "bg-sage-500 text-white" },
  early: { icon: Sparkles, classes: "bg-gold-400 text-white" },
  sponsored: { icon: Megaphone, classes: "bg-warm-800 text-white" },
};

export default function CafeCard({ cafe, index = 0, featured = false }) {
  const [saved, setSaved] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const whyRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSponsored = Boolean(cafe.sponsored || cafe._sponsoredSlot);
  const label = isSponsored
    ? {
        kind: "sponsored",
        short: "Sponsored",
        title: cafe.sponsoredHeadline || "Promoted listing",
        reasons: [
          "This café paid to promote its listing to people exploring this area.",
          "Organic results are still ranked separately.",
          "Paying does not buy a Verified badge.",
        ],
      }
    : discoveryLabel(cafe);
  const tags = experienceTags(cafe, 3);
  const growth = saveGrowthPct(cafe);
  const priceLabel = "₹".repeat(cafe.priceLevel || 1);
  const KindIcon = label ? KIND_STYLE[label.kind]?.icon : null;
  const openInfo = !isSponsored ? operatingLabel(cafe) : null;

  useEffect(() => {
    if (!isSponsored || !cafe.boostCampaignId) return;
    trackEvent("boost_impression", {
      placeId: cafe.id,
      source: "discover_home",
      metadata: { campaignId: Number(cafe.boostCampaignId) },
    });
  }, [cafe.id, cafe.boostCampaignId, isSponsored]);

  useEffect(() => {
    if (!user) {
      setSaved(false);
      return;
    }
    loadSavedIds(user).then((ids) => setSaved(ids.includes(String(cafe.id))));
  }, [user, cafe.id]);

  useEffect(() => {
    function onDoc(e) {
      if (whyRef.current && !whyRef.current.contains(e.target)) setWhyOpen(false);
    }
    if (whyOpen) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [whyOpen]);

  async function toggleSave(e) {
    e.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    const prev = saved;
    setSaved(!prev);
    try {
      await toggleSavedCafe(user, cafe.id, prev);
    } catch {
      setSaved(prev);
    }
  }

  return (
    <article
      onClick={() => navigate(`/cafe/${cafe.id}`)}
      className={`animate-fade-in-up bg-white rounded-xl overflow-hidden card-hover cursor-pointer group relative ${
        featured ? "sm:col-span-2 lg:col-span-2" : ""
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={`relative overflow-hidden bg-warm-100 ${featured ? "aspect-[21/10]" : "aspect-[16/10]"}`}>
        {!imgError ? (
          <img
            src={cafe.image}
            alt={cafe.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-warm-400">
            {cafe.name}
          </div>
        )}

        {label && KindIcon && (
          <div
            className={`absolute top-3 left-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${KIND_STYLE[label.kind].classes}`}
          >
            <KindIcon size={12} />
            {label.short}
          </div>
        )}

        <button
          type="button"
          onClick={toggleSave}
          className={`absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-all ${
            saved ? "bg-white" : "bg-white/70 backdrop-blur-sm sm:opacity-0 sm:group-hover:opacity-100"
          }`}
        >
          <Heart
            size={15}
            className={saved ? "fill-terracotta-400 text-terracotta-400 animate-heart-pop" : "text-warm-500"}
          />
        </button>

        {openInfo && (openInfo.kind === "temp" || openInfo.kind === "closed" || openInfo.kind === "truck" || openInfo.kind === "popup") && (
          <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-warm-700">
            {openInfo.label}
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="line-clamp-1 text-base font-bold leading-snug text-warm-700">{cafe.name}</h3>

        <p className="mt-1 text-sm text-warm-400">
          {cafe.category}
          <span className="text-warm-200"> · </span>
          {priceLabel}
        </p>

        {isSponsored && cafe.sponsoredHeadline && (
          <p className="mt-1 text-sm italic text-warm-500">&ldquo;{cafe.sponsoredHeadline}&rdquo;</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-warm-500">
          <span className="inline-flex items-center gap-1 font-medium text-warm-700">
            <Star size={12} className="fill-gold-400 text-gold-400" />
            {cafe.rating}
            <span className="font-normal text-warm-400">· {cafe.reviewCount || 0} reviews</span>
          </span>
          <span className="inline-flex items-center gap-0.5 text-warm-400">
            <MapPin size={12} />
            {cafe.distance} km
          </span>
        </div>

        {tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="rounded-full bg-warm-50 px-2 py-0.5 text-[11px] font-medium text-warm-600">
                {t}
              </span>
            ))}
          </div>
        )}

        {label && (
          <div className="mt-3 flex items-start justify-between gap-2 border-t border-warm-50 pt-3">
            <div>
              <p className="text-sm font-semibold text-warm-700">
                {label.kind === "rising" && growth > 0 ? `🔥 +${growth}% saves this week` : label.title}
              </p>
              {label.kind === "rising" && (
                <p className="mt-0.5 text-xs text-warm-400">People are starting to discover this.</p>
              )}
            </div>
            <div className="relative" ref={whyRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setWhyOpen((v) => !v);
                }}
                className="flex items-center gap-1 text-[11px] font-medium text-warm-400 hover:text-warm-600"
                aria-label="Why am I seeing this?"
              >
                <HelpCircle size={13} />
                Why{isSponsored ? " this?" : "?"}
              </button>
              {whyOpen && (
                <div
                  className="absolute right-0 bottom-full z-20 mb-2 w-56 rounded-xl border border-warm-100 bg-white p-3 shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold text-warm-700">Why am I seeing this?</p>
                    <button type="button" onClick={() => setWhyOpen(false)} className="text-warm-300">
                      <X size={12} />
                    </button>
                  </div>
                  <ul className="space-y-1.5">
                    {label.reasons.map((r) => (
                      <li key={r} className="text-xs text-warm-500">
                        · {r}
                      </li>
                    ))}
                  </ul>
                  {isSponsored && (
                    <button
                      type="button"
                      onClick={() => setWhyOpen(false)}
                      className="mt-3 w-full rounded-lg bg-warm-100 py-1.5 text-xs font-semibold text-warm-700"
                    >
                      Got it
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
