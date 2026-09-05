import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Heart,
  Share2,
  Volume2,
  VolumeX,
  Flag,
  MapPin,
  Star,
  Plus,
  Bookmark,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { fetchSpottedFeed, toggleSpotLike, reportSpot } from "../api/spotted";
import { loadSavedIds, toggleSavedCafe } from "../utils/favorites";
import { trackEvent } from "../api/analytics";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "nearby", label: "Nearby" },
  { id: "new", label: "Just opened" },
];

function formatDistance(km) {
  if (km == null || Number.isNaN(km)) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function SpotSlide({ spot, active, muted, onToggleMute, user, savedIds, setSavedIds }) {
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const [liked, setLiked] = useState(spot.likedByMe);
  const [likeCount, setLikeCount] = useState(spot.likeCount || 0);
  const [reporting, setReporting] = useState(false);
  const place = spot.place;
  const saved = place && savedIds.includes(String(place.id));

  useEffect(() => {
    setLiked(spot.likedByMe);
    setLikeCount(spot.likeCount || 0);
  }, [spot.id, spot.likedByMe, spot.likeCount]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = muted;
    if (active) {
      el.play().catch(() => {});
      trackEvent("spot_view", { placeId: place?.id, source: "spotted", metadata: { spotId: spot.id } });
    } else {
      el.pause();
    }
  }, [active, muted, spot.id, place?.id]);

  async function onLike() {
    if (!user) {
      navigate("/login?next=/spotted");
      return;
    }
    try {
      const res = await toggleSpotLike(spot.id);
      setLiked(Boolean(res.liked));
      setLikeCount(res.likeCount ?? likeCount);
    } catch {
      /* ignore */
    }
  }

  async function onSave() {
    if (!user) {
      navigate("/login?next=/spotted");
      return;
    }
    if (!place?.id) return;
    const prev = saved;
    setSavedIds((ids) =>
      prev ? ids.filter((x) => x !== String(place.id)) : [...ids, String(place.id)]
    );
    try {
      await toggleSavedCafe(user, place.id, prev);
      trackEvent("spot_save", { placeId: place.id, source: "spotted", metadata: { spotId: spot.id } });
    } catch {
      setSavedIds((ids) =>
        prev ? [...ids, String(place.id)] : ids.filter((x) => x !== String(place.id))
      );
    }
  }

  async function onShare() {
    const url = `${window.location.origin}/cafe/${place?.id || ""}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: place?.name || "Wandr Spot", text: spot.caption || "", url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* ignore */
    }
  }

  async function onReport() {
    if (!user) {
      navigate("/login?next=/spotted");
      return;
    }
    if (reporting) return;
    setReporting(true);
    try {
      await reportSpot(spot.id, "inappropriate", "Reported from Spotted feed");
      alert("Thanks — we’ll review this spot.");
    } catch {
      alert("Could not send report. Try again.");
    } finally {
      setReporting(false);
    }
  }

  function viewCafe() {
    if (!place?.id) return;
    trackEvent("spot_cafe_click", { placeId: place.id, source: "spotted", metadata: { spotId: spot.id } });
    navigate(`/cafe/${place.id}`);
  }

  const dist = formatDistance(place?.distance);

  return (
    <section className="relative h-[100dvh] w-full shrink-0 snap-start snap-always overflow-hidden bg-warm-800">
      <video
        ref={videoRef}
        src={spot.url}
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        loop
        muted={muted}
        preload="metadata"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/35" />

      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-[max(5.5rem,env(safe-area-inset-bottom))] md:pb-8">
        <div className="flex items-end gap-3">
          <div className="min-w-0 flex-1">
            {spot.caption && (
              <p className="mb-3 text-sm font-medium leading-snug text-white/95 line-clamp-3">
                {spot.caption}
              </p>
            )}
            {place && (
              <button type="button" onClick={viewCafe} className="pointer-events-auto text-left">
                <p className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                  {place.name}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-white/75">
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} />
                    {[place.city || place.address, dist].filter(Boolean).join(" · ")}
                  </span>
                  {place.rating != null && (
                    <span className="inline-flex items-center gap-0.5">
                      <Star size={12} className="fill-gold-300 text-gold-300" />
                      {place.rating}
                    </span>
                  )}
                </p>
              </button>
            )}
            <button
              type="button"
              onClick={viewCafe}
              className="pointer-events-auto mt-4 inline-flex rounded-full bg-warm-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-terracotta-500"
            >
              View Café
            </button>
          </div>

          <div className="pointer-events-auto flex flex-col items-center gap-4 pb-2">
            <button type="button" onClick={onToggleMute} className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white">
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button type="button" onClick={onLike} className="flex flex-col items-center gap-0.5 text-white">
              <Heart size={26} className={liked ? "fill-warm-600 text-warm-600" : ""} />
              <span className="text-[11px] font-medium">{likeCount}</span>
            </button>
            <button type="button" onClick={onSave} className="flex flex-col items-center gap-0.5 text-white">
              <Bookmark size={26} className={saved ? "fill-white text-white" : ""} />
              <span className="text-[11px] font-medium">Save</span>
            </button>
            <button type="button" onClick={onShare} className="flex flex-col items-center gap-0.5 text-white">
              <Share2 size={24} />
              <span className="text-[11px] font-medium">Share</span>
            </button>
            <button type="button" onClick={onReport} className="flex flex-col items-center gap-0.5 text-white/80">
              <Flag size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function SpottedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const focusId = params.get("spot");
  const [filter, setFilter] = useState("all");
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [savedIds, setSavedIds] = useState([]);
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const scrollerRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (!user) {
      setSavedIds([]);
      return;
    }
    loadSavedIds(user).then(setSavedIds).catch(() => setSavedIds([]));
  }, [user]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchSpottedFeed({
        lat: coords.lat,
        lng: coords.lng,
        filter,
      });
      let list = data;
      if (focusId) {
        const idx = list.findIndex((s) => String(s.id) === String(focusId));
        if (idx > 0) {
          const [hit] = list.splice(idx, 1);
          list = [hit, ...list];
        }
      }
      setSpots(list);
      setActiveIdx(0);
    } catch (e) {
      setError(e.message || "Could not load Spotted");
      setSpots([]);
    } finally {
      setLoading(false);
    }
  }, [coords.lat, coords.lng, filter, focusId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const slides = [...root.querySelectorAll("[data-spot-slide]")];
    if (!slides.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const idx = Number(visible.target.getAttribute("data-idx"));
        if (!Number.isNaN(idx)) setActiveIdx(idx);
      },
      { root, threshold: [0.6, 0.75] }
    );
    slides.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [spots]);

  return (
    <div className="relative bg-warm-800">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/50 to-transparent pt-[env(safe-area-inset-top)]">
        <div className="pointer-events-auto page-shell flex items-center justify-between gap-3 py-3">
          <div>
            <h1 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
              Spotted
            </h1>
            <p className="text-[11px] text-white/65">See what’s worth discovering around you</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(user ? "/spotted/create" : "/login?next=/spotted/create")}
            className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur"
          >
            <Plus size={14} /> Spot
          </button>
        </div>
        <div className="pointer-events-auto page-shell flex gap-2 overflow-x-auto pb-3 scrollbar-none">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                filter === f.id
                  ? f.id === "new"
                    ? "wandr-new-accent"
                    : "bg-warm-600 text-white"
                  : "border border-white/25 bg-black/20 text-white/85"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-[100dvh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        </div>
      ) : error ? (
        <div className="flex h-[100dvh] flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm text-white/80">{error}</p>
          <button type="button" onClick={load} className="rounded-full bg-warm-600 px-4 py-2 text-sm font-semibold text-white">
            Retry
          </button>
        </div>
      ) : spots.length === 0 ? (
        <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-base font-semibold text-white">No spots yet</p>
          <p className="max-w-xs text-sm text-white/65">
            Be the first to share what’s happening at a café near you.
          </p>
          <button
            type="button"
            onClick={() => navigate(user ? "/spotted/create" : "/login?next=/spotted/create")}
            className="rounded-full bg-warm-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Create a Spot
          </button>
          <Link to="/" className="text-sm text-white/70 underline">
            Back to Discover
          </Link>
        </div>
      ) : (
        <div
          ref={scrollerRef}
          className="h-[100dvh] snap-y snap-mandatory overflow-y-scroll scrollbar-none"
        >
          {spots.map((spot, i) => (
            <div key={spot.id} data-spot-slide data-idx={i}>
              <SpotSlide
                spot={spot}
                active={i === activeIdx}
                muted={muted}
                onToggleMute={() => setMuted((m) => !m)}
                user={user}
                savedIds={savedIds}
                setSavedIds={setSavedIds}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
