import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader, AlertCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { createPlace, startListingPhoneOtp, verifyListingPhoneOtp } from "../../api/owner";
import { fetchListingFeeStatus } from "../../api/billing";
import MapPinPicker from "../../components/MapPinPicker";
import OwnerTopBar from "../../components/OwnerTopBar";
import { isCloudinaryUploadAvailable, uploadPlaceCover } from "../../utils/uploadSpot";

const LOCATION_TYPES = [
  { id: "CAFE", label: "Café" },
  { id: "HOME_BAKERY", label: "Home Bakery" },
  { id: "FOOD_TRUCK", label: "Food Truck" },
  { id: "STREET_FOOD", label: "Street Food" },
  { id: "RESTAURANT", label: "Restaurant" },
  { id: "HOME_KITCHEN", label: "Home Kitchen" },
  { id: "POP_UP", label: "Pop-up" },
  { id: "BEVERAGE_STALL", label: "Beverage Stall" },
  { id: "OTHER", label: "Other" },
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

const STEPS = ["What are you?", "Get discovered", "Details & media", "Phone OTP"];

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-terracotta-500">
      <AlertCircle size={12} /> {message}
    </p>
  );
}

export default function RegisterCafePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [uploadPct, setUploadPct] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpHint, setOtpHint] = useState("");
  const [createdPlaceId, setCreatedPlaceId] = useState(null);
  const canUpload = isCloudinaryUploadAvailable();
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

  useEffect(() => {
    fetchListingFeeStatus()
      .then((s) => {
        if (!s.listingFeePaid) navigate("/owner/dashboard", { replace: true });
      })
      .catch(() => navigate("/owner/dashboard", { replace: true }));
  }, [navigate]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function toggleTag(tag) {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  }

  function validateStep(s) {
    const e = {};
    if (s === 0) {
      if (!form.locationType) e.locationType = "Pick a type";
      if (!form.name.trim()) e.name = "Name is required";
      if (!form.category) e.category = "Category is required";
    }
    if (s === 1) {
      if (!form.address.trim()) e.address = "Address is required";
      if (!form.city.trim()) e.city = "City is required";
      if (form.lat == null || form.lng == null) e.lat = "Drop a map pin";
      if (!form.phone.trim()) e.phone = "Business phone is required for OTP";
    }
    if (s === 2) {
      if (!form.description.trim() && form.tags.length === 0) {
        e.description = "Add a description or at least one vibe tag";
      }
    }
    return e;
  }

  function nextStep() {
    const e = validateStep(step);
    setTouched(true);
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setTouched(false);
    setStep(step + 1);
  }

  async function createAndSendOtp() {
    if (!user || submitting) return;
    const allErrors = { ...validateStep(0), ...validateStep(1), ...validateStep(2) };
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      return;
    }
    setSubmitting(true);
    try {
      let placeId = createdPlaceId;
      if (!placeId) {
        const place = await createPlace({
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
        placeId = place.id;
        setCreatedPlaceId(placeId);
      }
      const sent = await startListingPhoneOtp(placeId, form.phone);
      setOtpHint(sent.phone ? `Code sent to ${sent.phone}` : "OTP sent to your business phone");
      setStep(3);
    } catch (err) {
      alert(err.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp() {
    if (!createdPlaceId || submitting) return;
    if (!otpCode.trim()) {
      setErrors({ otp: "Enter the OTP" });
      return;
    }
    setSubmitting(true);
    try {
      await verifyListingPhoneOtp(createdPlaceId, otpCode.trim());
      navigate("/owner/dashboard?registered=1");
    } catch (err) {
      setErrors({ otp: err.message || "Invalid OTP" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-shell page-with-nav max-w-3xl pt-6">
      <OwnerTopBar subtitle="Add a new place to Wandr" />
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
        Fill details, verify your business phone with OTP, and go live — no admin wait.
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
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {LOCATION_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => update("locationType", t.id)}
                className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
                  form.locationType === t.id ? "border-warm-600 bg-warm-600 text-white" : "border-warm-100 bg-white text-warm-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <FieldError message={touched ? errors.locationType : ""} />
          <label className="mb-1.5 mt-4 block text-sm font-medium text-warm-600">Name</label>
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className={`mb-1 w-full rounded-xl border bg-white px-4 py-3 ${errors.name ? "border-terracotta-400" : "border-warm-100"}`}
          />
          <FieldError message={errors.name} />
          <label className="mb-1.5 mt-3 block text-sm font-medium text-warm-600">Category</label>
          <select
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            className={`w-full rounded-xl border bg-white px-4 py-3 ${errors.category ? "border-terracotta-400" : "border-warm-100"}`}
          >
            <option value="">Select</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <FieldError message={errors.category} />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-warm-600">Address</label>
            <input value={form.address} onChange={(e) => update("address", e.target.value)} className={`w-full rounded-xl border bg-white px-4 py-3 ${errors.address ? "border-terracotta-400" : "border-warm-100"}`} />
            <FieldError message={errors.address} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-warm-600">City</label>
            <input value={form.city} onChange={(e) => update("city", e.target.value)} className={`w-full rounded-xl border bg-white px-4 py-3 ${errors.city ? "border-terracotta-400" : "border-warm-100"}`} />
            <FieldError message={errors.city} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-warm-600">Business phone (OTP)</label>
            <input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91…" className={`w-full rounded-xl border bg-white px-4 py-3 ${errors.phone ? "border-terracotta-400" : "border-warm-100"}`} />
            <FieldError message={errors.phone} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-warm-600">Website (optional)</label>
            <input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://" className="w-full rounded-xl border border-warm-100 bg-white px-4 py-3" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-warm-600">Hours</label>
            <input value={form.hours} onChange={(e) => update("hours", e.target.value)} placeholder="Mon–Sun 9am–9pm" className="w-full rounded-xl border border-warm-100 bg-white px-4 py-3" />
          </div>
          <MapPinPicker
            value={form.lat != null && form.lng != null ? { lat: form.lat, lng: form.lng } : null}
            onChange={(coords) => {
              update("lat", coords?.lat ?? null);
              update("lng", coords?.lng ?? null);
            }}
          />
          <FieldError message={errors.lat} />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-warm-600">Cover image URL</label>
            <input
              value={form.imageUrl}
              onChange={(e) => update("imageUrl", e.target.value)}
              placeholder="https://…"
              className="w-full rounded-xl border border-warm-100 bg-white px-4 py-3"
            />
            {!canUpload && (
              <p className="mt-1.5 text-xs text-warm-400">
                File upload needs Cloudinary — paste a URL for now.
              </p>
            )}
          </div>
          {canUpload && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-warm-600">Or upload a photo</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/*"
                disabled={submitting}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  setUploadPct(0);
                  try {
                    const url = await uploadPlaceCover(file, { onProgress: setUploadPct });
                    update("imageUrl", url);
                  } catch (err) {
                    setErrors((prev) => ({
                      ...prev,
                      imageUrl: err.message || "Upload failed",
                    }));
                  } finally {
                    setUploadPct(null);
                  }
                }}
                className="w-full text-sm text-warm-500"
              />
              {uploadPct != null && (
                <p className="mt-1.5 text-xs text-warm-400">Uploading {uploadPct}%…</p>
              )}
            </div>
          )}
          {form.imageUrl && (
            <img src={form.imageUrl} alt="" className="h-40 w-full rounded-xl object-cover" />
          )}
          <FieldError message={errors.imageUrl} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-warm-600">
              Description <span className="text-terracotta-500">*</span>
            </label>
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} className={`w-full rounded-xl border bg-white px-4 py-3 ${errors.description ? "border-terracotta-400" : "border-warm-100"}`} />
            {!form.description.trim() && form.tags.length === 0 && (
              <FieldError message={errors.description} />
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-warm-600">Vibe tags {!form.description.trim() && <span className="text-terracotta-500">*</span>}</label>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${form.tags.includes(tag) ? "bg-warm-500 text-white" : "border border-warm-100 bg-white text-warm-500"}`}>{tag}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-warm-600">Instagram / WhatsApp</label>
            <input value={form.instagram} onChange={(e) => update("instagram", e.target.value)} placeholder="@instagram" className="mb-2 w-full rounded-xl border border-warm-100 bg-white px-4 py-3" />
            <input value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} placeholder="WhatsApp" className="w-full rounded-xl border border-warm-100 bg-white px-4 py-3" />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 rounded-2xl border border-warm-100 bg-white p-5">
          <h3 className="text-lg font-bold text-warm-700">Verify business phone</h3>
          <p className="text-sm text-warm-400">{otpHint || "Enter the OTP sent to your business phone."}</p>
          <p className="text-xs text-warm-400">In local/dev, check backend logs for the OTP when SMS provider is log.</p>
          <input
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            placeholder="6-digit OTP"
            className={`w-full rounded-xl border bg-white px-4 py-3 ${errors.otp ? "border-terracotta-400" : "border-warm-100"}`}
          />
          <FieldError message={errors.otp} />
          <button
            type="button"
            disabled={submitting || !createdPlaceId}
            onClick={() => createdPlaceId && startListingPhoneOtp(createdPlaceId, form.phone).then((s) => setOtpHint(s.phone ? `Code sent to ${s.phone}` : "OTP resent"))}
            className="text-sm font-semibold text-warm-600 underline"
          >
            Resend OTP
          </button>
        </div>
      )}

      <div className="mt-8 flex justify-between gap-3">
        {step < 2 && (
          <button
            type="button"
            onClick={nextStep}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-warm-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Continue <ArrowRight size={16} />
          </button>
        )}
        {step === 2 && (
          <button
            type="button"
            disabled={submitting}
            onClick={createAndSendOtp}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-warm-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? <Loader className="animate-spin" size={16} /> : null}
            Create & send OTP
          </button>
        )}
        {step === 3 && (
          <button
            type="button"
            disabled={submitting}
            onClick={handleVerifyOtp}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-warm-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? <Loader className="animate-spin" size={16} /> : null}
            Verify & go live
          </button>
        )}
      </div>
    </div>
  );
}
