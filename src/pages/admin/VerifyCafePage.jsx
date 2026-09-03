import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, MapPin, Phone, Ban, HelpCircle } from "lucide-react";
import {
  approvePlace,
  rejectPlace,
  requestPlaceInfo,
  suspendPlace,
  closePlace,
  fetchAdminPlace,
} from "../../api/admin";

const INFO_REASONS = [
  "Confirm location",
  "Upload business evidence",
  "Confirm phone",
  "Add menu",
  "Explain business type",
  "Provide operating hours",
];

export default function VerifyCafePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cafe, setCafe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [note, setNote] = useState("");
  const [reasons, setReasons] = useState([]);
  const [mode, setMode] = useState(null);

  useEffect(() => {
    fetchAdminPlace(id)
      .then(setCafe)
      .catch(() => setCafe(null))
      .finally(() => setLoading(false));
  }, [id]);

  function toggleReason(r) {
    setReasons((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  }

  async function run(action) {
    setActing(true);
    try {
      const body = { note, reasons };
      if (action === "approve") await approvePlace(id, body);
      else if (action === "reject") await rejectPlace(id, body);
      else if (action === "info") await requestPlaceInfo(id, body);
      else if (action === "suspend") await suspendPlace(id, body);
      else if (action === "close") await closePlace(id, body);
      navigate("/admin");
    } catch (err) {
      alert(err.message || "Action failed");
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <div className="page-shell page-with-nav flex justify-center pt-14">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-warm-200 border-t-warm-500" />
      </div>
    );
  }

  if (!cafe) {
    return (
      <div className="page-shell page-with-nav pt-14 text-center">
        <p className="text-warm-500">Place not found.</p>
      </div>
    );
  }

  return (
    <div className="page-shell page-with-nav max-w-3xl pt-6">
      <button type="button" onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-warm-500">
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold text-warm-700" style={{ fontFamily: "var(--font-display)" }}>
        Verify business
      </h1>
      <p className="mt-1 text-sm text-warm-400">
        Listing: {cafe.status} · Ownership: {cafe.ownershipStatus}
      </p>

      {cafe.image && (
        <img src={cafe.image} alt="" className="mt-4 h-40 w-full rounded-xl object-cover" />
      )}

      <div className="mt-5 space-y-4 rounded-2xl border border-warm-100 bg-white p-5">
        <div>
          <h2 className="text-xl font-bold text-warm-700">{cafe.name}</h2>
          <p className="text-sm text-warm-400">
            {cafe.locationType} · {cafe.category}
          </p>
        </div>

        <section>
          <h3 className="text-xs font-bold uppercase tracking-wide text-warm-400">Owner</h3>
          <p className="mt-1 text-sm text-warm-600">{cafe.ownerDisplayName || "— unclaimed —"}</p>
          {cafe.phone && (
            <p className="mt-1 flex items-center gap-2 text-sm text-warm-500">
              <Phone size={14} /> {cafe.phone}
              {cafe.phoneVerified && <span className="text-sage-500">✓</span>}
            </p>
          )}
        </section>

        <section>
          <h3 className="text-xs font-bold uppercase tracking-wide text-warm-400">Location</h3>
          <p className="mt-1 flex items-start gap-2 text-sm text-warm-600">
            <MapPin size={14} className="mt-0.5 shrink-0" />
            {[cafe.address, cafe.city].filter(Boolean).join(", ") || "No address"}
          </p>
          <p className="mt-1 text-xs text-warm-400">
            Confidence: {cafe.lat && cafe.lng ? "HIGH (coords set)" : "LOW"}
            {cafe.locationVerified ? " · Location verified" : ""}
          </p>
        </section>

        <section>
          <h3 className="text-xs font-bold uppercase tracking-wide text-warm-400">Trust signals</h3>
          <ul className="mt-2 space-y-1 text-sm text-warm-600">
            {(cafe.verifiedDetails || []).map((d) => (
              <li key={d}>· {d}</li>
            ))}
            {!(cafe.verifiedDetails || []).length && <li className="text-warm-400">None yet</li>}
          </ul>
        </section>

        <section>
          <h3 className="text-xs font-bold uppercase tracking-wide text-warm-400">Risk flags</h3>
          <p className="mt-1 text-sm text-warm-400">None</p>
        </section>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-warm-400">Admin note</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-warm-200 bg-warm-50 px-3 py-2 text-sm"
            placeholder="Persisted on every decision"
          />
        </label>

        {mode === "info" && (
          <div className="rounded-xl bg-warm-50 p-3">
            <p className="mb-2 text-xs font-semibold text-warm-600">Need more information</p>
            <div className="flex flex-wrap gap-2">
              {INFO_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleReason(r)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    reasons.includes(r) ? "bg-warm-700 text-white" : "bg-white text-warm-600 border border-warm-200"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={acting}
            onClick={() => run("approve")}
            className="flex items-center justify-center gap-2 rounded-xl bg-sage-100 py-3 text-sm font-semibold text-sage-500"
          >
            <CheckCircle size={16} /> Approve
          </button>
          <button
            type="button"
            disabled={acting}
            onClick={() => (mode === "info" ? run("info") : setMode("info"))}
            className="flex items-center justify-center gap-2 rounded-xl bg-gold-100 py-3 text-sm font-semibold text-warm-700"
          >
            <HelpCircle size={16} /> {mode === "info" ? "Send request" : "Request info"}
          </button>
          <button
            type="button"
            disabled={acting}
            onClick={() => run("reject")}
            className="flex items-center justify-center gap-2 rounded-xl bg-terracotta-50 py-3 text-sm font-semibold text-terracotta-500"
          >
            <XCircle size={16} /> Reject
          </button>
          <button
            type="button"
            disabled={acting}
            onClick={() => run("suspend")}
            className="flex items-center justify-center gap-2 rounded-xl bg-warm-100 py-3 text-sm font-semibold text-warm-600"
          >
            <Ban size={16} /> Suspend
          </button>
        </div>
        <button
          type="button"
          disabled={acting}
          onClick={() => run("close")}
          className="w-full rounded-xl border border-warm-200 py-2.5 text-xs font-semibold text-warm-400"
        >
          Mark permanently closed
        </button>
      </div>
    </div>
  );
}
