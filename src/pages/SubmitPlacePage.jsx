import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { submitCommunityPlace } from "../api/places";

const CATEGORIES = ["Café", "Bakery", "Restaurant", "Street Food", "Food Truck", "Dessert", "Pop-up", "Other"];

export default function SubmitPlacePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    locationType: "CAFE",
    address: "",
    city: "Delhi",
    description: "",
    instagram: "",
    priceLevel: 2,
  });

  function update(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) {
      navigate("/login?next=/submit");
      return;
    }
    setBusy(true);
    try {
      await submitCommunityPlace({
        name: form.name,
        category: form.category,
        locationType: form.locationType,
        description: form.description,
        address: form.address,
        city: form.city,
        instagram: form.instagram || undefined,
        priceLevel: form.priceLevel,
      });
      setSubmitted(true);
    } catch (err) {
      alert(err.message || "Failed to submit");
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <div className="page-shell page-with-nav flex flex-col items-center justify-center pt-20 text-center">
        <CheckCircle size={40} className="mb-3 text-sage-500" />
        <h2 className="text-xl font-bold text-warm-700">Thanks for adding a place</h2>
        <p className="mt-2 max-w-sm text-sm text-warm-400">
          It&apos;s a community listing (unclaimed) pending review. The owner can claim it later.
        </p>
        <button type="button" onClick={() => navigate("/")} className="mt-6 rounded-xl bg-warm-600 px-6 py-3 text-sm font-semibold text-white">
          Back home
        </button>
      </div>
    );
  }

  return (
    <div className="page-shell page-with-nav max-w-lg pt-6">
      <button type="button" onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-warm-500">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="text-2xl font-bold text-warm-700" style={{ fontFamily: "var(--font-display)" }}>
        Add a place
      </h1>
      <p className="mt-1 mb-6 text-sm text-warm-400">Community listing — owner can claim later.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Place name" className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm" />
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" onClick={() => update("category", c)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${form.category === c ? "bg-warm-600 text-white" : "border border-warm-200 bg-white text-warm-600"}`}>{c}</button>
          ))}
        </div>
        <textarea value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Address / usual location" rows={2} className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm" />
        <input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="City" className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm" />
        <textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Why is this special?" rows={3} className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm" />
        <button type="submit" disabled={busy || !form.name || !form.category} className="w-full rounded-xl bg-warm-700 py-3.5 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? "Submitting…" : "Submit place"}
        </button>
      </form>
    </div>
  );
}
