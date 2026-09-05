import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, MapPin, Star, Heart, Clock, Phone, AtSign as InstagramIcon,
  Wifi, Plug, Volume2, Car, PawPrint, Moon, Camera, Share2, Navigation, Flag,
  CheckCircle, Edit, BarChart3,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { usePlaces } from "../contexts/PlacesContext";
import { fetchPlace, claimPlace, confirmPlaceInfo } from "../api/places";
import Badge from "../components/Badge";
import ReviewSection from "../components/ReviewSection";
import MenuSection from "../components/MenuSection";
import ReportModal from "../components/ReportModal";
import { loadSavedIds, toggleSavedCafe } from "../utils/favorites";
import { discoveryLabel, experienceTags, photoSpot } from "../utils/discovery";
import { trackEvent } from "../api/analytics";
import { hoursAgoLabel, operatingLabel, addressLabel } from "../utils/placeStatus";
import { fetchPlaceSpots } from "../api/spotted";
import SaveToCollectionSheet from "../components/SaveToCollectionSheet";
import { removePlaceFromAllCollections } from "../utils/collections";

const attrIcons = {
  wifi: { icon: Wifi, format: (v) => (v === "fast" ? "Fast WiFi" : v === "basic" ? "Basic WiFi" : null) },
  powerOutlets: { icon: Plug, format: (v) => (v ? "Power outlets" : null) },
  noiseLevel: { icon: Volume2, format: (v) => (v ? `${v[0].toUpperCase() + v.slice(1)} noise` : null) },
  parking: { icon: Car, format: (v) => (v && v !== "none" ? `${v[0].toUpperCase() + v.slice(1)} parking` : null) },
  petFriendly: { icon: PawPrint, format: (v) => (v ? "Pet friendly" : null) },
  lateNight: { icon: Moon, format: (v) => (v ? "Open late" : null) },
  photoSpot: { icon: Camera, format: (v) => (v ? "Great for photos" : null) },
};

const TABS = ["Overview", "Menu", "Reviews", "Info"];

export default function CafeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { getById } = usePlaces();
  const [cafe, setCafe] = useState(() => getById(id));
  const [loadingCafe, setLoadingCafe] = useState(!getById(id));
  const [saved, setSaved] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");
  const [imgError, setImgError] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimPhone, setClaimPhone] = useState("");
  const [claimEvidence, setClaimEvidence] = useState("");
  const [claimBusy, setClaimBusy] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("");
  const [spots, setSpots] = useState([]);
  const [saveSheetOpen, setSaveSheetOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cached = getById(id);
    if (cached) {
      setCafe(cached);
      setLoadingCafe(false);
      return;
    }
    setLoadingCafe(true);
    fetchPlace(id)
      .then((p) => {
        if (!cancelled) setCafe(p);
      })
      .catch(() => {
        if (!cancelled) setCafe(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingCafe(false);
      });
    return () => { cancelled = true; };
  }, [id, getById]);

  useEffect(() => {
    if (!cafe) return;
    trackEvent("place_view", { placeId: cafe.id, source: "detail" });
  }, [cafe?.id]);

  useEffect(() => {
    if (!cafe?.id) return;
    fetchPlaceSpots(cafe.id)
      .then(setSpots)
      .catch(() => setSpots([]));
  }, [cafe?.id]);

  useEffect(() => {
    if (!user || !cafe) return;
    loadSavedIds(user).then((ids) => {
      if (ids.includes(String(cafe.id))) setSaved(true);
      else setSaved(false);
    });
  }, [user, cafe]);

  useEffect(() => {
    setImgError(false);
  }, [id]);

  if (loadingCafe) {
    return (
      <div className="page-shell page-with-nav flex justify-center pt-20">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-warm-200 border-t-warm-500" />
      </div>
    );
  }

  if (!cafe) {
    return (
      <div className="page-shell page-with-nav pt-20 text-center">
        <h2 className="text-xl font-bold text-warm-600">Cafe not found</h2>
        <Link to="/" className="mt-2 inline-block text-sm text-warm-500 underline">Back to home</Link>
      </div>
    );
  }

  async function toggleSave() {
    if (!user) { navigate("/login"); return; }
    const prev = saved;
    setSaved(!prev);
    try {
      await toggleSavedCafe(user, cafe.id, prev);
      if (!prev) setSaveSheetOpen(true);
      else removePlaceFromAllCollections(user.uid, cafe.id);
    } catch {
      setSaved(prev);
    }
  }

  function handleShare() {
    trackEvent("share_place", { placeId: cafe.id, source: "detail" });
    if (navigator.share) {
      navigator.share({ title: cafe.name, text: `Check out ${cafe.name} on wandr`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  function handleDirections() {
    trackEvent("direction_click", { placeId: cafe.id, source: "detail" });
    const url = cafe.lat && cafe.lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${cafe.lat},${cafe.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cafe.name} ${cafe.address || ""}`)}`;
    window.open(url, "_blank");
  }

  async function handleClaim() {
    if (!user) { navigate(`/login?next=/cafe/${cafe.id}`); return; }
    setClaimBusy(true);
    try {
      await claimPlace(cafe.id, { phone: claimPhone, evidence: claimEvidence });
      trackEvent("claim_complete", { placeId: cafe.id, source: "detail" });
      setClaimOpen(false);
      alert("Claim submitted — an admin will review ownership.");
      const refreshed = await fetchPlace(cafe.id);
      setCafe(refreshed);
    } catch (err) {
      alert(err.message || "Could not submit claim");
    } finally {
      setClaimBusy(false);
    }
  }

  async function handleConfirm(allYes) {
    if (!user) { navigate(`/login?next=/cafe/${cafe.id}`); return; }
    setConfirmBusy(true);
    try {
      const checks = { location: allYes, hours: allYes, price: allYes, menu: allYes };
      const updated = await confirmPlaceInfo(cafe.id, checks);
      setCafe(updated);
      setConfirmMsg(allYes ? "Thanks — info marked as confirmed." : "Thanks — corrections queued for review.");
    } catch (err) {
      alert(err.message || "Could not confirm");
    } finally {
      setConfirmBusy(false);
    }
  }

  const priceLabel = "₹".repeat(cafe.priceLevel);
  const label = discoveryLabel(cafe);
  const vibes = experienceTags(cafe, 3);
  const trustItems = cafe.verifiedDetails?.length ? cafe.verifiedDetails : [];
  const freshness = hoursAgoLabel(cafe.lastInformationCheck);
  const openInfo = operatingLabel(cafe);
  const isOwnListing =
    Boolean(user) &&
    (role === "owner" || role === "admin") &&
    cafe.ownerId != null &&
    String(cafe.ownerId) === String(user.uid);
  const canClaim = !isOwnListing && cafe.ownershipStatus === "UNCLAIMED";
  const toneClass =
    openInfo?.tone === "good"
      ? "text-sage-500"
      : openInfo?.tone === "bad"
        ? "text-terracotta-500"
        : openInfo?.tone === "warn"
          ? "text-gold-400"
          : "text-warm-500";

  return (
    <div className="page-shell page-with-nav pt-4 md:pt-6">
      <div className="relative overflow-hidden rounded-xl bg-warm-100 md:rounded-2xl">
        {!imgError ? (
          <img
            src={cafe.image}
            alt={cafe.name}
            className="aspect-[16/10] h-auto w-full object-cover sm:aspect-[21/9]"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex aspect-[16/10] w-full items-center justify-center bg-warm-100 sm:aspect-[21/9]">
            <span className="text-sm text-warm-400">{cafe.name}</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute top-3 left-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:bg-white sm:top-4 sm:left-4"
        >
          <ArrowLeft size={18} className="text-warm-700" />
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:bg-white sm:top-4 sm:right-4"
        >
          <Share2 size={16} className="text-warm-600" />
        </button>
      </div>

      {/* Owner manage bar — always for own listing */}
      {isOwnListing && (
        <div className="sticky top-0 z-30 mt-3 flex items-center justify-between rounded-xl border border-warm-200 bg-warm-50 px-4 py-3 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-warm-700">Your listing</p>
            <p className="text-xs text-warm-400">
              {(cafe.status === "approved" || cafe.status === "APPROVED") ? "Live on Discover" : `Status: ${cafe.status}`}
              {cafe.ownershipStatus === "OWNER_VERIFIED" && " · Verified"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate(`/owner/edit-cafe/${cafe.id}`)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-warm-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-terracotta-500"
            >
              <Edit size={13} /> Edit
            </button>
            <button
              type="button"
              onClick={() => navigate("/owner/dashboard?tab=analytics")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-warm-200 bg-white px-3.5 py-2 text-xs font-semibold text-warm-600 transition hover:bg-warm-50"
            >
              <BarChart3 size={13} /> Analytics
            </button>
          </div>
        </div>
      )}

      {/* Decision-first viewport */}
      <div className="mt-5 w-full md:mt-6">
        {label && (
          <span className="mb-2 inline-flex rounded-full bg-warm-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-warm-700">
            {label.short}
          </span>
        )}
        <h1
          className="break-words text-2xl font-bold text-warm-700 md:text-3xl lg:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {cafe.name}
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-warm-500">
          <span className="flex items-center gap-1 font-semibold text-warm-700">
            <Star size={14} className="fill-gold-400 text-gold-400" />
            {cafe.rating}
            <span className="font-normal text-warm-400">· {cafe.reviewCount} reviews</span>
          </span>
          <span className="text-warm-200">·</span>
          <span className="flex items-center gap-1">
            <MapPin size={13} className="text-warm-300" /> {cafe.distance} km
          </span>
          <span className="text-warm-200">·</span>
          <span>{priceLabel}</span>
          {openInfo && (
            <>
              <span className="text-warm-200">·</span>
              <span className={`font-medium ${toneClass}`}>{openInfo.label}</span>
            </>
          )}
        </div>

        {(trustItems.length > 0 || freshness) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-warm-400">
            {trustItems.map((detail) => (
              <span key={detail} className="inline-flex items-center gap-1">
                <CheckCircle size={11} className="shrink-0 text-sage-500" />
                {detail}
              </span>
            ))}
            {freshness && (
              <span className="inline-flex items-center gap-1">
                <Clock size={11} className="shrink-0 text-warm-300" />
                {freshness}
              </span>
            )}
          </div>
        )}

        {vibes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {vibes.map((t) => (
              <span key={t} className="rounded-full bg-warm-50 px-3 py-1.5 text-xs font-medium text-warm-600">
                {t}
              </span>
            ))}
          </div>
        )}

        {!isOwnListing && (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleDirections}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-warm-600 py-3.5 font-semibold text-white shadow-sm transition hover:bg-terracotta-500"
            >
              <Navigation size={16} /> Go there
            </button>
            <button
              type="button"
              onClick={toggleSave}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-warm-200 bg-white py-3.5 font-semibold text-warm-600 transition hover:bg-warm-50"
            >
              <Heart size={16} className={saved ? "fill-terracotta-400 text-terracotta-400" : ""} />
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        )}

        <p className="mt-3 text-sm text-warm-400">{addressLabel(cafe)}</p>

        {spots.length > 0 && (
          <div className="mt-6">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-warm-700" style={{ fontFamily: "var(--font-display)" }}>
                  Spotted here
                </h3>
                <p className="text-xs text-warm-400">Short videos from this café</p>
              </div>
              <Link to="/spotted" className="text-xs font-semibold text-warm-600">
                Open Spotted
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
              {spots.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => navigate(`/spotted?spot=${s.id}`)}
                  className="relative h-40 w-28 shrink-0 overflow-hidden rounded-xl bg-warm-800"
                >
                  <video
                    src={s.url}
                    muted
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="line-clamp-2 text-[10px] font-medium text-white">{s.caption || "Spot"}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs — spaced, scrollable on narrow screens */}
      <div className="sticky top-0 z-20 mt-6 border-b border-warm-100 bg-cream">
        <div className="scrollbar-none flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                if (tab === "Menu") trackEvent("menu_view", { placeId: cafe.id, source: "detail" });
              }}
              className={`relative shrink-0 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === tab ? "text-warm-700" : "text-warm-400 hover:text-warm-600"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute right-3 bottom-0 left-3 h-0.5 rounded-full bg-warm-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 mb-8 w-full space-y-6 animate-fade-in" key={activeTab}>
        {activeTab === "Overview" && (
          <>
            {cafe.description && (
              <p className="text-base leading-relaxed text-warm-600">{cafe.description}</p>
            )}

            <div className="flex flex-wrap gap-2">
              {cafe.tags.map((tag) => (
                <Badge key={tag} label={tag} />
              ))}
            </div>

            {cafe.bestFor?.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-warm-500">Best for</h3>
                <div className="flex flex-wrap gap-2">
                  {cafe.bestFor.map((b) => (
                    <span
                      key={b}
                      className="rounded-full border border-warm-100 bg-warm-50 px-3 py-1.5 text-sm font-medium text-warm-600"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="mb-3 text-sm font-semibold text-warm-500">Experience</h3>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(attrIcons).map(([key, { icon: Icon, format }]) => {
                  const val = key === "photoSpot" ? photoSpot(cafe) : cafe[key];
                  const labelText = format(val);
                  if (!labelText) return null;
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-2.5 rounded-xl border border-warm-100 bg-white px-3 py-2.5 text-sm text-warm-600"
                    >
                      <Icon size={15} className="shrink-0 text-warm-400" />
                      <span>{labelText}</span>
                    </div>
                  );
                })}
                {cafe.seating?.length > 0 && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-warm-100 bg-white px-3 py-2.5 text-sm text-warm-600 sm:col-span-2 lg:col-span-3">
                    <span className="text-warm-400">Seating:</span>
                    <span>{cafe.seating.join(", ")}</span>
                  </div>
                )}
                {cafe.avgCostForTwo && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-warm-100 bg-white px-3 py-2.5 text-sm text-warm-600 sm:col-span-2 lg:col-span-3">
                    <span className="text-warm-400">Avg for two:</span>
                    <span className="font-bold text-warm-700">₹{cafe.avgCostForTwo}</span>
                  </div>
                )}
              </div>
            </div>

            {cafe.savedCount > 0 && (
              <div className="flex items-center gap-2">
                <Heart size={13} className="text-terracotta-300" />
                <span className="text-sm text-warm-400">{cafe.savedCount} people saved this cafe</span>
              </div>
            )}
          </>
        )}

        {activeTab === "Menu" && (
          cafe.menu?.length ? (
            <MenuSection menu={cafe.menu} />
          ) : (
            <div className="rounded-xl border border-warm-100 bg-white p-8 text-center">
              <p className="text-sm text-warm-400">No menu listed yet</p>
            </div>
          )
        )}

        {activeTab === "Reviews" && (
          <>
            <div className="mb-4 flex items-center gap-2 text-sm">
              <Star size={16} className="fill-gold-400 text-gold-400" />
              <span className="font-bold text-warm-700">{cafe.rating}</span>
              <span className="text-warm-400">· {cafe.reviewCount} reviews</span>
            </div>
            <ReviewSection cafeId={String(cafe.id)} canWrite={!isOwnListing} />
          </>
        )}

        {activeTab === "Info" && (
          <div className="space-y-5">
            <div className="space-y-3 rounded-xl border border-warm-100 bg-white p-5">
              {cafe.hours && (
                <div className="flex items-center gap-3 text-sm text-warm-600">
                  <Clock size={16} className="shrink-0 text-warm-400" />
                  <span>{cafe.hours}</span>
                </div>
              )}
              {cafe.phone && (
                <a
                  href={`tel:${cafe.phone}`}
                  onClick={() => trackEvent("call_click", { placeId: cafe.id, source: "detail" })}
                  className="flex items-center gap-3 text-sm text-warm-600"
                >
                  <Phone size={16} className="shrink-0 text-warm-400" />
                  <span>{cafe.phone}</span>
                </a>
              )}
              {cafe.instagram && (
                <div className="flex items-center gap-3 text-sm text-warm-600">
                  <InstagramIcon size={16} className="shrink-0 text-warm-400" />
                  <span>{cafe.instagram}</span>
                </div>
              )}
              {cafe.address && (
                <div className="flex items-start gap-3 text-sm text-warm-600">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-warm-400" />
                  <span>{cafe.address}{cafe.city && `, ${cafe.city}`}</span>
                </div>
              )}
            </div>

            {user && !isOwnListing && (
              <button
                type="button"
                onClick={() => setShowReport(true)}
                className="flex items-center gap-1.5 text-sm text-warm-400 transition hover:text-warm-600"
              >
                <Flag size={14} /> Report this place
              </button>
            )}

            {canClaim && (
              <div className="rounded-xl border border-dashed border-warm-200 bg-warm-50 p-4">
                <p className="text-sm font-semibold text-warm-700">Owner hasn&apos;t claimed this place</p>
                <p className="mt-1 text-xs text-warm-400">Are you the owner or manager?</p>
                {!claimOpen ? (
                  <button
                    type="button"
                    onClick={() => {
                      trackEvent("claim_start", { placeId: cafe.id, source: "detail" });
                      setClaimOpen(true);
                    }}
                    className="mt-3 rounded-xl bg-warm-700 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Claim this business
                  </button>
                ) : (
                  <div className="mt-3 space-y-2">
                    <input
                      value={claimPhone}
                      onChange={(e) => setClaimPhone(e.target.value)}
                      placeholder="Business phone"
                      className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm"
                    />
                    <textarea
                      value={claimEvidence}
                      onChange={(e) => setClaimEvidence(e.target.value)}
                      placeholder="Brief evidence (Instagram, docs, etc.)"
                      rows={2}
                      className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      disabled={claimBusy}
                      onClick={handleClaim}
                      className="rounded-xl bg-warm-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {claimBusy ? "Submitting…" : "Submit claim"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {!isOwnListing && (
              <div className="rounded-xl border border-warm-100 bg-white p-4">
                <h3 className="mb-2 text-sm font-semibold text-warm-700">Is this still correct?</h3>
                <p className="mb-3 text-xs text-warm-400">Location · Hours · Price · Menu</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={confirmBusy}
                    onClick={() => handleConfirm(true)}
                    className="rounded-full bg-sage-100 px-4 py-2 text-xs font-semibold text-sage-500"
                  >
                    ✓ Yes, looks right
                  </button>
                  <button
                    type="button"
                    disabled={confirmBusy}
                    onClick={() => handleConfirm(false)}
                    className="rounded-full bg-warm-100 px-4 py-2 text-xs font-semibold text-warm-600"
                  >
                    ✕ Something&apos;s off
                  </button>
                </div>
                {confirmMsg && <p className="mt-2 text-xs text-warm-500">{confirmMsg}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {showReport && (
        <ReportModal
          cafeId={String(cafe.id)}
          cafeName={cafe.name}
          onClose={() => setShowReport(false)}
        />
      )}
      <SaveToCollectionSheet
        open={saveSheetOpen}
        userId={user?.uid}
        placeId={cafe.id}
        onClose={() => setSaveSheetOpen(false)}
      />
    </div>
  );
}
