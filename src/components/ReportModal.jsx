import { useState } from "react";
import { X, Flag } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { reportPlace } from "../api/places";

const REASONS = [
  { id: "fake", label: "Fake business" },
  { id: "wrong_location", label: "Wrong location" },
  { id: "closed", label: "Closed permanently" },
  { id: "duplicate", label: "Duplicate listing" },
  { id: "misleading", label: "Misleading information" },
];

export default function ReportModal({ cafeId, cafeName, onClose }) {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!reason || !user || submitting) return;
    setSubmitting(true);
    try {
      await reportPlace(cafeId, reason, details.trim());
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 pb-8 animate-[fadeInUp_0.25s_ease-out]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-warm-100 flex items-center justify-center text-warm-400 hover:bg-warm-200 transition"
        >
          <X size={16} />
        </button>

        {submitted ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-3">
              <Flag size={20} className="text-sage-500" />
            </div>
            <h3 className="font-bold text-warm-700 text-lg">Report Submitted</h3>
            <p className="text-sm text-warm-400 mt-1">
              Our team will review this report. Thank you for helping keep wandr trustworthy.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 bg-warm-600 text-white rounded-xl text-sm font-semibold hover:bg-warm-700 transition"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Flag size={18} className="text-warm-500" />
              <h3 className="font-bold text-warm-700 text-lg">Report this place</h3>
            </div>

            <p className="text-sm text-warm-400 mb-4">Why are you reporting {cafeName || "this place"}?</p>

            <div className="space-y-2 mb-4">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setReason(r.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    reason === r.id
                      ? "bg-warm-500 text-white"
                      : "bg-warm-50 text-warm-600 hover:bg-warm-100"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Additional details (optional)"
              rows={2}
              className="w-full bg-warm-50 px-4 py-3 rounded-xl border border-warm-100 text-sm text-warm-700 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-warm-300 transition resize-none mb-4"
            />

            <button
              onClick={handleSubmit}
              disabled={!reason || submitting}
              className="w-full bg-warm-600 hover:bg-warm-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
