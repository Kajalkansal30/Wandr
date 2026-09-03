import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { fetchMyPlace, updatePlace } from "../../api/owner";
import MapPinPicker from "../../components/MapPinPicker";

const categories = [
  "Specialty Coffee", "Brunch & Coffee", "Artisan Coffee",
  "Books & Coffee", "Café & Bakery", "Organic Coffee", "Dessert Café",
  "Bakery", "Street Food", "Food Truck", "Dessert Bar", "Juice Bar",
];

const allTags = [
  "Minimal", "Cozy", "Garden", "Aesthetic", "Floral", "Bright",
  "Rustic", "Quiet", "Warm", "Artsy", "Peaceful", "Green", "Rooftop", "Pet Friendly",
];

export default function EditCafePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState("basic");
  const [form, setForm] = useState({
    name: "", category: "", description: "", priceLevel: 2,
    address: "", city: "", tags: [], phone: "", instagram: "", hours: "",
    lat: null, lng: null, imageUrl: "",
    bestFor: [], avgCostForTwo: "",
  });

  useEffect(() => {
    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const d = await fetchMyPlace(id);
        setForm({
          name: d.name || "", category: d.category || "", description: d.description || "",
          priceLevel: d.priceLevel || 2, address: d.address || "", city: d.city || "",
          tags: d.tags || [], phone: d.phone || "", instagram: d.instagram || "", hours: d.hours || "",
          lat: d.lat || null, lng: d.lng || null, imageUrl: d.image || "",
          bestFor: d.bestFor || [], avgCostForTwo: d.avgCostForTwo || "",
        });
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [id, user]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleTag(tag) {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : prev.tags.length < 4 ? [...prev.tags, tag] : prev.tags,
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updatePlace(id, {
        name: form.name,
        category: form.category,
        description: form.description,
        priceLevel: form.priceLevel,
        address: form.address,
        city: form.city,
        tags: form.tags,
        phone: form.phone,
        instagram: form.instagram,
        hours: form.hours,
        lat: form.lat,
        lng: form.lng,
        image: form.imageUrl || undefined,
        bestFor: form.bestFor,
        avgCostForTwo: form.avgCostForTwo ? Number(form.avgCostForTwo) : null,
      });
      navigate("/owner/dashboard");
    } catch (err) {
      alert(err.message || "Failed to save changes.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page-shell page-with-nav pt-14 flex justify-center">
        <div className="w-8 h-8 border-3 border-warm-200 border-t-warm-500 rounded-full animate-spin" />
      </div>
    );
  }

  const sections = [
    { id: "basic", label: "Basic" },
    { id: "photos", label: "Photo" },
    { id: "location", label: "Location" },
    { id: "experience", label: "Experience" },
  ];

  return (
    <div className="page-shell page-with-nav pt-6 max-w-3xl">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-600 transition">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="text-2xl font-bold text-warm-700 mb-4">Edit Cafe</h1>

      <div className="flex gap-1 overflow-x-auto pb-2 mb-6 no-scrollbar">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              section === s.id ? "bg-warm-500 text-white" : "bg-warm-100 text-warm-500"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === "basic" && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-warm-600 mb-1.5 block">Cafe Name</label>
            <input value={form.name} onChange={(e) => update("name", e.target.value)} className="w-full bg-white px-4 py-3 rounded-xl border border-warm-100 text-warm-700 focus:outline-none focus:ring-2 focus:ring-warm-300 transition" />
          </div>
          <div>
            <label className="text-sm font-medium text-warm-600 mb-1.5 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button key={c} type="button" onClick={() => update("category", c)} className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${form.category === c ? "bg-warm-500 text-white" : "bg-white border border-warm-100 text-warm-500 hover:border-warm-300"}`}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-warm-600 mb-1.5 block">Description</label>
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} className="w-full bg-white px-4 py-3 rounded-xl border border-warm-100 text-warm-700 focus:outline-none focus:ring-2 focus:ring-warm-300 transition resize-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-warm-600 mb-1.5 block">Price Level</label>
            <div className="flex gap-2">
              {[1, 2, 3].map((p) => (
                <button key={p} type="button" onClick={() => update("priceLevel", p)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${form.priceLevel === p ? "bg-warm-500 text-white" : "bg-white border border-warm-100 text-warm-500"}`}>{"₹".repeat(p)}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-warm-600 mb-1.5 block">Vibe Tags</label>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${form.tags.includes(tag) ? "bg-warm-500 text-white" : "bg-white border border-warm-100 text-warm-500 hover:border-warm-300"}`}>{tag}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-warm-600 mb-1.5 block">Phone</label>
            <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full bg-white px-4 py-3 rounded-xl border border-warm-100 text-warm-700 focus:outline-none focus:ring-2 focus:ring-warm-300 transition" />
          </div>
          <div>
            <label className="text-sm font-medium text-warm-600 mb-1.5 block">Instagram</label>
            <input value={form.instagram} onChange={(e) => update("instagram", e.target.value)} className="w-full bg-white px-4 py-3 rounded-xl border border-warm-100 text-warm-700 focus:outline-none focus:ring-2 focus:ring-warm-300 transition" />
          </div>
          <div>
            <label className="text-sm font-medium text-warm-600 mb-1.5 block">Hours</label>
            <input value={form.hours} onChange={(e) => update("hours", e.target.value)} className="w-full bg-white px-4 py-3 rounded-xl border border-warm-100 text-warm-700 focus:outline-none focus:ring-2 focus:ring-warm-300 transition" />
          </div>
        </div>
      )}

      {section === "photos" && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-warm-600 mb-1.5 block">Cover image URL</label>
            <input
              value={form.imageUrl}
              onChange={(e) => update("imageUrl", e.target.value)}
              placeholder="https://..."
              className="w-full bg-white px-4 py-3 rounded-xl border border-warm-100 text-warm-700 focus:outline-none focus:ring-2 focus:ring-warm-300 transition"
            />
          </div>
          {form.imageUrl && (
            <img src={form.imageUrl} alt="" className="h-40 w-full rounded-xl object-cover" />
          )}
        </div>
      )}

      {section === "location" && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-warm-600 mb-1.5 block">Address</label>
            <textarea value={form.address} onChange={(e) => update("address", e.target.value)} rows={2} className="w-full bg-white px-4 py-3 rounded-xl border border-warm-100 text-warm-700 focus:outline-none focus:ring-2 focus:ring-warm-300 transition resize-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-warm-600 mb-1.5 block">City</label>
            <input value={form.city} onChange={(e) => update("city", e.target.value)} className="w-full bg-white px-4 py-3 rounded-xl border border-warm-100 text-warm-700 focus:outline-none focus:ring-2 focus:ring-warm-300 transition" />
          </div>
          <div>
            <label className="text-sm font-medium text-warm-600 mb-1.5 block">Pin Location</label>
            <MapPinPicker
              value={{ lat: form.lat, lng: form.lng }}
              onChange={({ lat, lng }) => { update("lat", lat); update("lng", lng); }}
            />
          </div>
        </div>
      )}

      {section === "experience" && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-warm-600 mb-1.5 block">Best For</label>
            <div className="flex flex-wrap gap-2">
              {["Study", "Work", "Date", "Group", "Solo"].map((b) => (
                <button key={b} type="button" onClick={() => update("bestFor", form.bestFor.includes(b) ? form.bestFor.filter((x) => x !== b) : [...form.bestFor, b])} className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${form.bestFor.includes(b) ? "bg-warm-500 text-white" : "bg-white border border-warm-100 text-warm-500"}`}>{b}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-warm-600 mb-1.5 block">Avg Cost for Two</label>
            <input value={form.avgCostForTwo} onChange={(e) => update("avgCostForTwo", e.target.value)} placeholder="e.g. 500" type="number" className="w-full bg-white px-4 py-3 rounded-xl border border-warm-100 text-warm-700 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-warm-300 transition" />
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-8 w-full bg-warm-600 hover:bg-warm-700 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60"
      >
        {saving ? <><Loader size={18} className="animate-spin" /> Saving...</> : "Save Changes"}
      </button>
    </div>
  );
}
