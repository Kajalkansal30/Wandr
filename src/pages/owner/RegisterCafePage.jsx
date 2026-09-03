import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { createPlace } from "../../api/owner";
import MapPinPicker from "../../components/MapPinPicker";

const LOCATION_TYPES = [
  { id: "CAFE", label: "Café", emoji: "☕" },
  { id: "HOME_BAKERY", label: "Home Bakery", emoji: "🍰" },
  { id: "FOOD_TRUCK", label: "Food Truck", emoji: "🚚" },
  { id: "STREET_FOOD", label: "Street Food", emoji: "🛒" },
  { id: "RESTAURANT", label: "Restaurant", emoji: "🍽" },
  { id: "HOME_KITCHEN", label: "Home Kitchen", emoji: "🏠" },
  { id: "POP_UP", label: "Pop-up", emoji: "🎪" },
  { id: "BEVERAGE_STALL", label: "Beverage Stall", emoji: "🥤" },
  { id: "OTHER", label: "Other", emoji: "✨" },
];

const categories = [
  "Specialty Coffee", "Brunch & Coffee", "Artisan Coffee",
  "Books & Coffee", "Café & Bakery", "Organic Coffee", "Dessert Café",
  "Bakery", "Street Food", "Food Truck", "Dessert Bar", "Juice Bar",
];

const allTags = [
  "Minimal", "Cozy", "Garden", "Aesthetic", "Floral", "Bright",
  "Rustic", "Quiet", "Warm", "Artsy", "Peaceful", "Green", "Rooftop", "Pet Friendly",
];

const STEPS = ["What are you?", "Get discovered", "Make it beautiful", "Go live"];

export default function RegisterCafePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    locationType: "",
    name: "",
    category: "",
    description: "",
    priceLevel: 2,
    address: "",
    city: "",
    serviceArea: "",
    exactAddressPrivate: "",
    lat: null,
    lng: null,
    imageUrl: "",
    tags: [],
    phone: "",
    whatsapp: "",
    website: "",
    instagram: "",
    hours: "",
    bestFor: [],
    avgCostForTwo: "",
  });

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleTag(tag) {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : prev.tags.length < 4
          ? [...prev.tags, tag]
          : prev.tags,
    }));
  }

  const isMobile = ["FOOD_TRUCK", "POP_UP", "STREET_FOOD"].includes(form.locationType);
  const isHome = ["HOME_BAKERY", "HOME_KITCHEN"].includes(form.locationType);

  async function handleSubmit() {
    if (!user || submitting) return;
    setSubmitting(true);
    try {
      await createPlace({
        name: form.name,
        category: form.category,
        locationType: form.locationType,
        description: form.description,
        priceLevel: form.priceLevel,
        address: form.address,
        city: form.city,
        serviceArea: form.serviceArea || undefined,
        exactAddressPrivate: form.exactAddressPrivate || undefined,
        lat: form.lat,
        lng: form.lng,
        image: form.imageUrl || undefined,
        tags: form.tags,
        phone: form.phone,
        whatsapp: form.whatsapp || undefined,
        website: form.website || undefined,
        instagram: form.instagram,
        hours: form.hours,
        bestFor: form.bestFor,
        avgCostForTwo: form.avgCostForTwo ? Number(form.avgCostForTwo) : null,
      });
      navigate("/owner/dashboard");
    } catch (err) {
      alert(err.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-shell page-with-nav max-w-3xl pt-6">
      <button
        type="button"
        onClick={() => (step > 0 ? setStep(step - 1) : navigate(-1))}
        className="mb-4 flex items-center gap-1.5 text-sm text-warm-500 transition hover:text-warm-600"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="mb-1 text-2xl font-bold text-warm-700" style={{ fontFamily: "var(--font-display)" }}>
        Get discovered
      </h1>
      <p className="mb-6 text-sm text-warm-400">
        Put your place in front of people looking for somewhere new. Verification ≠ paid promotion.
      </p>

      <div className="mb-8 flex gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 flex-col items-center gap-1">
            <div className={`h-1 w-full rounded-full transition-colors ${i <= step ? "bg-warm-500" : "bg-warm-100"}`} />
            <span className={`text-[10px] font-medium ${i <= step ? "text-warm-600" : "text-warm-300"}`}>{s}</span>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div>
          <p className="mb-3 text-sm font-medium text-warm-600">What are you?</p>
          <div className="grid grid-cols-3 gap-2">
            {LOCATION_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => update("locationType", t.id)}
                className={`rounded-xl px-2 py-3 text-center text-xs font-semibold ${
                  form.locationType === t.id ? "bg-warm-600 text-white" : "border border-warm-100 bg-white text-warm-600"
                }`}
              >
                <span className="mb-1 block text-lg">{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-warm-600">Name</label>
            <input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Moon & Moss Café" className="w-full rounded-xl border border-warm-100 bg-white px-4 py-3 text-warm-700" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-warm-600">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button key={c} type="button" onClick={() => update("category", c)} className={`rounded-xl px-3.5 py-2 text-sm font-medium ${form.category === c ? "bg-warm-500 text-white" : "border border-warm-100 bg-white text-warm-500"}`}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-warm-600">Phone</label>
            <input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 …" className="w-full rounded-xl border border-warm-100 bg-white px-4 py-3" />
          </div>
          {isMobile ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-warm-600">Usually found / operating areas</label>
              <textarea value={form.serviceArea} onChange={(e) => update("serviceArea", e.target.value)} rows={2} placeholder="e.g. Outside IIT main gate on weekends" className="w-full rounded-xl border border-warm-100 bg-white px-4 py-3" />
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-warm-600">{isHome ? "Public area / city landmark" : "Address"}</label>
              <textarea value={form.address} onChange={(e) => update("address", e.target.value)} rows={2} className="w-full rounded-xl border border-warm-100 bg-white px-4 py-3" />
            </div>
          )}
          {isHome && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-warm-600">Private address (not shown publicly)</label>
              <input value={form.exactAddressPrivate} onChange={(e) => update("exactAddressPrivate", e.target.value)} className="w-full rounded-xl border border-warm-100 bg-white px-4 py-3" />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-warm-600">City</label>
            <input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Delhi" className="w-full rounded-xl border border-warm-100 bg-white px-4 py-3" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-warm-600">Hours / schedule</label>
            <input value={form.hours} onChange={(e) => update("hours", e.target.value)} placeholder="9 AM – 10 PM" className="w-full rounded-xl border border-warm-100 bg-white px-4 py-3" />
          </div>
          {!isMobile && (
            <MapPinPicker
              value={{ lat: form.lat, lng: form.lng }}
              onChange={({ lat, lng }) => { update("lat", lat); update("lng", lng); }}
            />
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-warm-600">Cover image URL</label>
            <input value={form.imageUrl} onChange={(e) => update("imageUrl", e.target.value)} placeholder="https://…" className="w-full rounded-xl border border-warm-100 bg-white px-4 py-3" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-warm-600">Description</label>
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} className="w-full rounded-xl border border-warm-100 bg-white px-4 py-3" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-warm-600">Vibe tags</label>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${form.tags.includes(tag) ? "bg-warm-500 text-white" : "border border-warm-100 bg-white text-warm-500"}`}>{tag}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-warm-600">Instagram / WhatsApp / Website</label>
            <input value={form.instagram} onChange={(e) => update("instagram", e.target.value)} placeholder="@instagram" className="mb-2 w-full rounded-xl border border-warm-100 bg-white px-4 py-3" />
            <input value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} placeholder="WhatsApp" className="mb-2 w-full rounded-xl border border-warm-100 bg-white px-4 py-3" />
            <input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="Website" className="w-full rounded-xl border border-warm-100 bg-white px-4 py-3" />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="space-y-3 rounded-2xl border border-warm-100 bg-white p-5">
            <h3 className="text-lg font-bold text-warm-700">{form.name || "Untitled"}</h3>
            <p className="text-sm text-warm-400">{form.locationType} · {form.category} · {"₹".repeat(form.priceLevel)}</p>
            {form.description && <p className="text-sm text-warm-500">{form.description}</p>}
            <p className="text-sm text-warm-400">{isMobile ? form.serviceArea : form.address}{form.city && `, ${form.city}`}</p>
          </div>
          <p className="text-center text-xs text-warm-400">Submit for review — ownership claimed, verification comes after admin approval.</p>
        </div>
      )}

      <div className="mt-8">
        {step < 3 ? (
          <button
            type="button"
            disabled={step === 0 && !form.locationType}
            onClick={() => setStep(step + 1)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-warm-600 py-3.5 font-semibold text-white transition hover:bg-warm-700 disabled:opacity-50"
          >
            Continue <ArrowRight size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-sage-400 py-3.5 font-semibold text-white transition hover:bg-sage-500 disabled:opacity-60"
          >
            {submitting ? <><Loader size={18} className="animate-spin" /> Submitting...</> : "Go live — submit for review"}
          </button>
        )}
      </div>
    </div>
  );
}
