import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Rocket, Check } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { fetchMyPlaces } from "../../api/owner";
import { createBoost } from "../../api/ownerAnalytics";
import OwnerTopBar from "../../components/OwnerTopBar";

const AUDIENCES = [
  { id: "coffee", label: "Coffee lovers" },
  { id: "desserts", label: "Dessert lovers" },
  { id: "students", label: "Students" },
  { id: "work", label: "Remote workers" },
  { id: "date", label: "Date night" },
];

const BUDGETS = [500, 1000, 2500, 5000];
const RADII = [3, 5, 10];

export default function BoostPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  const approved = useMemo(() => places.filter((p) => p.status === "approved"), [places]);

  const [placeId, setPlaceId] = useState(params.get("placeId") || "");
  const [radius, setRadius] = useState(5);
  const [audiences, setAudiences] = useState(["coffee"]);
  const [budget, setBudget] = useState(1000);
  const [headline, setHeadline] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchMyPlaces()
      .then((list) => {
        setPlaces(list);
        if (!placeId && list.find((p) => p.status === "approved")) {
          setPlaceId(String(list.find((p) => p.status === "approved").id));
        }
      })
      .catch(() => setPlaces([]))
      .finally(() => setLoading(false));
  }, [user]);

  function toggleAudience(id) {
    setAudiences((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!placeId) {
      setError("Pick a live listing to boost.");
      return;
    }
    if (!audiences.length) {
      setError("Pick at least one audience.");
      return;
    }
    setSaving(true);
    try {
      const campaign = await createBoost({
        placeId: Number(placeId),
        targetRadiusKm: radius,
        audiences,
        budgetInr: budget,
        durationDays: 7,
        headline: headline.trim() || undefined,
      });
      setDone(campaign);
    } catch (err) {
      setError(err.message || "Could not start boost");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page-shell page-with-nav flex justify-center pt-14">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-warm-200 border-t-warm-500" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="page-shell page-with-nav pt-6 md:pt-8">
        <div className="mx-auto max-w-lg rounded-2xl border border-warm-100 bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sage-100">
            <Check size={28} className="text-sage-500" />
          </div>
          <h1 className="text-xl font-bold text-warm-700" style={{ fontFamily: "var(--font-display)" }}>
            Boost is live
          </h1>
          <p className="mt-2 text-sm text-warm-500">
            {done.placeName} will appear in a clearly labeled Sponsored slot for {done.durationDays} days.
            Verification is unchanged — paying never buys a trust badge.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-warm-50 p-3">
              <p className="font-bold text-warm-700">₹{done.budgetInr}</p>
              <p className="text-warm-400">Budget</p>
            </div>
            <div className="rounded-lg bg-warm-50 p-3">
              <p className="font-bold text-warm-700">{done.targetRadiusKm} km</p>
              <p className="text-warm-400">Area</p>
            </div>
            <div className="rounded-lg bg-warm-50 p-3">
              <p className="font-bold text-warm-700">{done.durationDays}d</p>
              <p className="text-warm-400">Run</p>
            </div>
          </div>
          <Link
            to="/owner/dashboard?tab=promote"
            className="mt-8 inline-flex rounded-xl bg-warm-600 px-6 py-3 text-sm font-semibold text-white hover:bg-terracotta-500"
          >
            Back to Business Hub
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell page-with-nav pt-6 md:pt-8">
      <OwnerTopBar subtitle="Promote your place nearby" />
      <button
        type="button"
        onClick={() => navigate("/owner/dashboard?tab=promote")}
        className="mb-4 flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-600"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warm-700 text-white">
          <Rocket size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-warm-700" style={{ fontFamily: "var(--font-display)" }}>
            Boost
          </h1>
          <p className="mt-1 text-sm text-warm-400">
            Want more people nearby to discover your place? Sponsored slots stay visually distinct from organic results.
          </p>
        </div>
      </div>

      {approved.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-warm-200 bg-white px-6 py-12 text-center">
          <p className="font-semibold text-warm-600">No live listings yet</p>
          <p className="mt-1 text-sm text-warm-400">Get a place approved first, then you can boost it.</p>
          <Link to="/owner/register-cafe" className="mt-4 inline-block text-sm font-semibold text-terracotta-500">
            Register a place →
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mx-auto max-w-lg space-y-6">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-warm-400">Listing</span>
            <select
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-700"
            >
              {approved.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-warm-400">Target area</span>
            <div className="flex flex-wrap gap-2">
              {RADII.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadius(r)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    radius === r ? "bg-warm-600 text-white" : "border border-warm-200 bg-white text-warm-600"
                  }`}
                >
                  {r} km
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-warm-400">Audience</span>
            <div className="flex flex-wrap gap-2">
              {AUDIENCES.map((a) => {
                const on = audiences.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAudience(a.id)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      on ? "bg-warm-600 text-white" : "border border-warm-200 bg-white text-warm-600"
                    }`}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-warm-400">Budget</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {BUDGETS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBudget(b)}
                  className={`rounded-xl px-3 py-3 text-sm font-bold ${
                    budget === b ? "bg-warm-700 text-white" : "border border-warm-200 bg-white text-warm-600"
                  }`}
                >
                  ₹{b.toLocaleString()}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-warm-400">Promote for 7 days · demo checkout (no real payment yet)</p>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-warm-400">
              Promo line (optional)
            </span>
            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              maxLength={120}
              placeholder='e.g. "20% off this weekend"'
              className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-700"
            />
          </label>

          <div className="rounded-xl border border-warm-100 bg-warm-50 px-4 py-3 text-xs text-warm-500">
            Sponsored listings show a clear <strong>Sponsored</strong> label and a “Why this?” disclosure.
            Paying never marks you Verified.
          </div>

          {error && <p className="text-sm text-terracotta-500">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-warm-700 py-3.5 text-sm font-semibold text-white hover:bg-warm-800 disabled:opacity-60"
          >
            <Rocket size={16} />
            {saving ? "Starting…" : `Promote for 7 days · ₹${budget.toLocaleString()}`}
          </button>
        </form>
      )}
    </div>
  );
}
