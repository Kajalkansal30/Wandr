import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Store, Clock, CheckCircle, XCircle, Edit, Heart, BarChart3, ArrowLeft, Rocket, Navigation, Phone, Share2, Eye, Shield } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { fetchMyPlaces } from "../../api/owner";
import { fetchOwnerAnalytics, fetchMyBoosts } from "../../api/ownerAnalytics";
import { FunnelChart, MetricBars, Sparkline, SourcePieList } from "../../components/owner/AnalyticsCharts";
import { api } from "../../api/client";

const statusConfig = {
  pending: { label: "Pending", icon: Clock, color: "bg-gold-100 text-gold-400" },
  approved: { label: "Live", icon: CheckCircle, color: "bg-sage-100 text-sage-500" },
  rejected: { label: "Rejected", icon: XCircle, color: "bg-terracotta-50 text-terracotta-500" },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const tab = searchParams.get("tab") || "cafes";
  const setActiveTab = (id) => setSearchParams(id === "cafes" ? {} : { tab: id });

  const [days, setDays] = useState(30);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [boosts, setBoosts] = useState([]);
  const [trust, setTrust] = useState(null);
  const [trustPlaceId, setTrustPlaceId] = useState(null);

  useEffect(() => {
    async function fetchMyCafes() {
      if (!user) {
        setCafes([]);
        setLoading(false);
        return;
      }
      try {
        setCafes(await fetchMyPlaces());
      } catch {
        setCafes([]);
      }
      setLoading(false);
    }
    fetchMyCafes();
  }, [user]);

  useEffect(() => {
    if (!user || (tab !== "analytics" && tab !== "cafes")) return;
    let cancelled = false;
    setAnalyticsLoading(true);
    fetchOwnerAnalytics({ days })
      .then((data) => {
        if (!cancelled) setAnalytics(data);
      })
      .catch(() => {
        if (!cancelled) setAnalytics(null);
      })
      .finally(() => {
        if (!cancelled) setAnalyticsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, days, tab]);

  useEffect(() => {
    if (!user || tab !== "promote") return;
    fetchMyBoosts()
      .then(setBoosts)
      .catch(() => setBoosts([]));
  }, [user, tab]);

  const approved = cafes.filter((c) => c.status === "approved" || c.status === "APPROVED");
  const totalSaves = approved.reduce((sum, c) => sum + (c.savedCount || 0), 0);
  const totals = analytics?.totals || {};

  useEffect(() => {
    if (!user || tab !== "trust") return;
    const live = cafes.filter((c) => c.status === "approved" || c.status === "APPROVED");
    if (live.length === 0) return;
    const pid = trustPlaceId || live[0].id;
    if (!trustPlaceId) setTrustPlaceId(pid);
    api(`/api/owner/places/${pid}/trust`, { auth: true })
      .then(setTrust)
      .catch(() => setTrust(null));
  }, [user, tab, cafes, trustPlaceId]);

  const discoveryMetrics = useMemo(
    () => [
      { key: "place_view", label: "Profile views", value: totals.place_view || 0, hint: "Discovery" },
      { key: "menu_view", label: "Menu views", value: totals.menu_view || 0, hint: "Intent" },
      { key: "save_place", label: "Saves", value: totals.save_place || 0, hint: "Intent" },
    ],
    [totals]
  );

  const intentMetrics = useMemo(
    () => [
      {
        key: "direction_click",
        label: "Direction requests",
        value: totals.direction_click || 0,
        hint: "High intent — not confirmed visits",
      },
      { key: "call_click", label: "Calls", value: totals.call_click || 0, hint: "High intent" },
      { key: "share_place", label: "Shares", value: totals.share_place || 0, hint: "High intent" },
    ],
    [totals]
  );

  if (loading) {
    return (
      <div className="page-shell page-with-nav flex justify-center pt-14">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-warm-200 border-t-warm-500" />
      </div>
    );
  }

  return (
    <div className="page-shell page-with-nav pt-6 md:pt-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm text-warm-500 transition hover:text-warm-600"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-warm-400">Wandr</p>
          <h1 className="text-2xl font-bold text-warm-700 md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
            Business Hub
          </h1>
          <p className="mt-1 text-sm text-warm-400 md:text-base">
            Discovery that measures interest — not vanity metrics
          </p>
        </div>
        <Link
          to="/owner/register-cafe"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-warm-600 shadow-md transition hover:bg-warm-700"
        >
          <Plus size={20} className="text-white" />
        </Link>
      </div>

      {approved.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat icon={Store} label="Live" value={approved.length} />
          <Stat icon={Eye} label="Profile views" value={totals.place_view || 0} />
          <Stat icon={Heart} label="Saves" value={(totals.save_place || 0) || totalSaves} />
          <Stat icon={Navigation} label="Directions" value={totals.direction_click || 0} />
        </div>
      )}

      <div className="mb-6 flex gap-1 rounded-xl bg-warm-100 p-1">
        {[
          { id: "cafes", label: "Listings", icon: Store },
          { id: "trust", label: "Trust", icon: Shield },
          { id: "analytics", label: "Analytics", icon: BarChart3 },
          { id: "promote", label: "Promote", icon: Rocket },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium transition-all ${
                tab === t.id ? "bg-white text-warm-700 shadow-sm" : "text-warm-400"
              }`}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "cafes" &&
        (cafes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warm-100">
              <Store size={28} className="text-warm-300" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-warm-600">No cafes registered</h3>
            <p className="mb-6 max-w-[260px] text-sm text-warm-400">
              List your cafe on wandr and reach new customers
            </p>
            <Link
              to="/owner/register-cafe"
              className="inline-flex items-center gap-2 rounded-xl bg-warm-600 px-6 py-3 font-semibold text-white transition hover:bg-warm-700"
            >
              <Plus size={18} /> Register Your Cafe
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {cafes.map((cafe) => {
              const cfg = statusConfig[cafe.status] || statusConfig.pending;
              const StatusIcon = cfg.icon;
              return (
                <div
                  key={cafe.id}
                  className="flex items-center gap-4 rounded-xl border border-warm-100 bg-white p-4"
                >
                  <img
                    src={cafe.image}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-lg object-cover bg-warm-100"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-bold text-warm-700">{cafe.name}</h3>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg.color}`}>
                        <StatusIcon size={11} /> {cfg.label}
                      </span>
                      {cafe.ownershipStatus === "OWNER_VERIFIED" && (
                        <span className="text-[11px] font-medium text-sage-500">✓ Owner verified</span>
                      )}
                      {cafe.ownershipStatus === "OWNER_CLAIMED" && cafe.status === "approved" && (
                        <span className="text-[11px] font-medium text-warm-400">Claimed · verify to unlock trust</span>
                      )}
                      {cafe.needsInfoReasons && (
                        <span className="text-[11px] font-medium text-gold-400">Needs info</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-warm-400">
                      {cafe.savedCount || 0} saves · {cafe.reviewCount || 0} reviews
                    </p>
                  </div>
                  <Link
                    to={`/owner/edit-cafe/${cafe.id}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-warm-50 text-warm-500 hover:bg-warm-100"
                  >
                    <Edit size={16} />
                  </Link>
                </div>
              );
            })}
          </div>
        ))}

      {tab === "trust" && (
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-warm-700" style={{ fontFamily: "var(--font-display)" }}>
            Verification Center
          </h2>
          {approved.length === 0 ? (
            <p className="py-12 text-center text-sm text-warm-400">Get a listing approved to build your trust profile.</p>
          ) : (
            <>
              <select
                value={trustPlaceId || approved[0].id}
                onChange={(e) => setTrustPlaceId(e.target.value)}
                className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm"
              >
                {approved.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {trust && (
                <div className="space-y-4 rounded-2xl border border-warm-100 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-warm-400">Your trust profile</p>
                  {[
                    ["Owner identity", trust.identityPct],
                    ["Business information", trust.businessPct],
                    ["Location", trust.locationPct],
                  ].map(([label, pct]) => (
                    <div key={label}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-warm-600">{label}</span>
                        <span className="font-bold text-warm-700">{pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-warm-100">
                        <div className="h-full rounded-full bg-warm-600" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                  <p className="text-sm text-warm-500">
                    Profile trust: <strong className="text-warm-700">{trust.trustLevel}</strong>
                    {" · "}
                    {trust.ownershipStatus}
                  </p>
                  {trust.ownershipStatus !== "OWNER_VERIFIED" && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await api(`/api/owner/places/${trustPlaceId || approved[0].id}/request-verification`, {
                            method: "POST",
                            auth: true,
                            body: { evidence: "Please verify my business", verificationRequest: true },
                          });
                          alert("Verification request submitted to admin.");
                        } catch (err) {
                          alert(err.message || "Failed");
                        }
                      }}
                      className="w-full rounded-xl bg-warm-700 py-3 text-sm font-semibold text-white"
                    >
                      Complete verification
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === "analytics" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-warm-700" style={{ fontFamily: "var(--font-display)" }}>
              Discovery
            </h2>
            <div className="flex gap-1 rounded-lg bg-warm-100 p-0.5">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                    days === d ? "bg-white text-warm-700 shadow-sm" : "text-warm-400"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {analyticsLoading && !analytics ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-warm-200 border-t-warm-500" />
            </div>
          ) : approved.length === 0 ? (
            <p className="py-12 text-center text-sm text-warm-400">Get a cafe approved to see analytics.</p>
          ) : (
            <>
              <section className="rounded-2xl border border-warm-100 bg-white p-5">
                <h3 className="mb-4 text-sm font-semibold text-warm-600">This period</h3>
                <MetricBars items={discoveryMetrics} />
              </section>

              <section className="rounded-2xl border border-warm-100 bg-white p-5">
                <h3 className="mb-1 text-sm font-semibold text-warm-600">Customer intent</h3>
                <p className="mb-4 text-xs text-warm-400">Calls, WhatsApp-style shares, and navigation clicks</p>
                <div className="mb-4 grid grid-cols-3 gap-2">
                  {intentMetrics.map((m) => (
                    <div key={m.key} className="rounded-xl bg-warm-50 p-3 text-center">
                      {m.key === "direction_click" && <Navigation size={14} className="mx-auto mb-1 text-warm-400" />}
                      {m.key === "call_click" && <Phone size={14} className="mx-auto mb-1 text-warm-400" />}
                      {m.key === "share_place" && <Share2 size={14} className="mx-auto mb-1 text-warm-400" />}
                      <p className="text-lg font-bold text-warm-700">{(m.value || 0).toLocaleString()}</p>
                      <p className="text-[11px] text-warm-400">{m.label}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-warm-100 bg-white p-5">
                <h3 className="mb-4 text-sm font-semibold text-warm-600">Discovery funnel</h3>
                <FunnelChart steps={analytics?.funnel || []} />
              </section>

              <section className="rounded-2xl border border-warm-100 bg-white p-5">
                <h3 className="mb-1 text-sm font-semibold text-warm-600">Profile views over time</h3>
                <p className="mb-4 text-xs text-warm-400">Daily place_view events</p>
                <Sparkline daily={analytics?.daily || []} eventKey="place_view" />
              </section>

              <section className="rounded-2xl border border-warm-100 bg-white p-5">
                <h3 className="mb-4 text-sm font-semibold text-warm-600">Discovery source</h3>
                <SourcePieList sources={analytics?.bySource || []} />
              </section>

              {(analytics?.places || []).length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-warm-600">Per listing</h3>
                  {analytics.places.map((p) => (
                    <div key={p.placeId} className="rounded-xl border border-warm-100 bg-white p-4">
                      <h4 className="mb-3 font-bold text-warm-700">{p.name}</h4>
                      <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
                        {[
                          ["Views", p.totals?.place_view],
                          ["Menu", p.totals?.menu_view],
                          ["Saves", p.totals?.save_place],
                          ["Directions", p.totals?.direction_click],
                          ["Calls", p.totals?.call_click],
                          ["Shares", p.totals?.share_place],
                        ].map(([label, val]) => (
                          <div key={label} className="rounded-lg bg-warm-50 p-2">
                            <p className="text-sm font-bold text-warm-700">{Number(val || 0).toLocaleString()}</p>
                            <p className="text-[10px] text-warm-400">{label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              )}
            </>
          )}
        </div>
      )}

      {tab === "promote" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-warm-100 bg-gradient-to-br from-warm-700 to-warm-800 p-6 text-white">
            <div className="flex items-start gap-3">
              <Rocket size={22} className="mt-0.5 shrink-0" />
              <div>
                <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
                  Boost
                </h2>
                <p className="mt-1 text-sm text-white/75">
                  Want more people nearby to discover your café? Sponsored slots stay labeled — never mixed with
                  verification.
                </p>
                <Link
                  to="/owner/boost"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-warm-700 hover:bg-warm-50"
                >
                  <Rocket size={14} className="text-warm-700" /> Create promotion
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-warm-200 bg-warm-50 px-4 py-3 text-xs text-warm-500">
            <strong className="text-warm-600">Verification ≠ promotion.</strong> Paying for Boost never buys a ✓
            Verified badge. Organic and sponsored rankings stay separate.
          </div>

          {boosts.length === 0 ? (
            <p className="py-8 text-center text-sm text-warm-400">No campaigns yet.</p>
          ) : (
            <div className="space-y-3">
              {boosts.map((b) => (
                <div key={b.id} className="rounded-xl border border-warm-100 bg-white p-4">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-warm-700">{b.placeName}</p>
                      <p className="text-xs text-warm-400">
                        {b.headline || "Boost"} · ₹{b.budgetInr} · {b.targetRadiusKm} km
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        b.status === "ACTIVE" ? "bg-sage-100 text-sage-600" : "bg-warm-100 text-warm-500"
                      }`}
                    >
                      {b.status === "ACTIVE" ? "Live" : "Ended"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-warm-50 p-2">
                      <p className="text-sm font-bold text-warm-700">{Number(b.impressions || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-warm-400">Impressions</p>
                    </div>
                    <div className="rounded-lg bg-warm-50 p-2">
                      <p className="text-sm font-bold text-warm-700">{Number(b.profileVisits || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-warm-400">Profile visits</p>
                    </div>
                    <div className="rounded-lg bg-warm-50 p-2">
                      <p className="text-sm font-bold text-warm-700">{Number(b.directionClicks || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-warm-400">Direction requests</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-warm-100 bg-white p-3 text-center">
      <Icon size={16} className="mx-auto mb-1 text-warm-400" />
      <p className="text-lg font-bold text-warm-700">{Number(value || 0).toLocaleString()}</p>
      <p className="text-xs text-warm-400">{label}</p>
    </div>
  );
}
