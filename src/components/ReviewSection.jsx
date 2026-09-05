import { useState, useEffect } from "react";
import { Star, Send, Loader } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { fetchReviews, submitReview } from "../api/places";
import { trackEvent } from "../api/analytics";

function StarRating({ value, onChange, readonly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`transition ${readonly ? "cursor-default" : "cursor-pointer"}`}
        >
          <Star
            size={readonly ? 12 : 22}
            className={`transition-colors ${
              star <= (hover || value) ? "fill-gold-400 text-gold-400" : "text-warm-200"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  const date = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
    : "Recently";
  const name = review.userDisplayName || review.userName || "Anonymous";

  return (
    <div className="bg-white rounded-xl p-4 border border-warm-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-warm-200 flex items-center justify-center text-xs font-bold text-warm-600">
            {name[0]?.toUpperCase() || "U"}
          </div>
          <span className="text-sm font-semibold text-warm-700">{name}</span>
        </div>
        <span className="text-xs text-warm-300">{date}</span>
      </div>
      <StarRating value={review.rating} readonly />
      {review.text && <p className="text-sm text-warm-500 mt-2 leading-relaxed">{review.text}</p>}
      {review.experienceTags?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {review.experienceTags.map((t) => (
            <span key={t} className="rounded-full bg-warm-50 px-2 py-0.5 text-[11px] text-warm-500">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReviewSection({ cafeId, canWrite = true }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const showForm = Boolean(user) && canWrite;

  async function load() {
    try {
      setReviews(await fetchReviews(cafeId));
    } catch {
      setReviews([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [cafeId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user || rating === 0 || submitting) return;
    setSubmitting(true);
    try {
      await submitReview(cafeId, { rating, text: text.trim() || null, experienceTags: [] });
      trackEvent("review_submit", { placeId: cafeId, source: "detail" });
      setRating(0);
      setText("");
      await load();
    } catch (err) {
      alert(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader size={20} className="animate-spin text-warm-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showForm ? (
        <form onSubmit={handleSubmit} className="rounded-xl border border-warm-100 bg-white p-4">
          <p className="mb-2 text-sm font-semibold text-warm-700">Your review</p>
          <StarRating value={rating} onChange={setRating} />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="What was it like?"
            className="mt-3 w-full resize-none rounded-xl border border-warm-100 bg-warm-50 px-3 py-2 text-sm text-warm-700"
          />
          <button
            type="submit"
            disabled={rating === 0 || submitting}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-warm-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
            Post review
          </button>
        </form>
      ) : !user ? (
        <p className="text-sm text-warm-400">Sign in to leave a review.</p>
      ) : !canWrite ? (
        <p className="rounded-xl border border-dashed border-warm-200 bg-warm-50 px-4 py-3 text-sm text-warm-500">
          Customer reviews appear here. You can&apos;t review your own listing.
        </p>
      ) : null}

      {reviews.length === 0 ? (
        <p className="py-6 text-center text-sm text-warm-400">No reviews yet — be the first.</p>
      ) : (
        reviews.map((r) => <ReviewCard key={r.id} review={r} />)
      )}
    </div>
  );
}
