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

export default function ReviewSection({ cafeId, canWrite = true, fallbackRating = 0, fallbackCount = 0 }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const showForm = Boolean(user) && canWrite;

  const myReview = user
    ? reviews.find((r) => r.userId != null && String(r.userId) === String(user.uid))
    : null;

  async function load() {
    try {
      const list = await fetchReviews(cafeId);
      setReviews(list);
      const mine = user
        ? list.find((r) => r.userId != null && String(r.userId) === String(user.uid))
        : null;
      if (mine) {
        setRating(Number(mine.rating) || 0);
        setText(mine.text || "");
      }
    } catch {
      setReviews([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    setLoading(true);
    load();
  }, [cafeId, user?.uid]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user || rating === 0 || submitting) return;
    setSubmitting(true);
    try {
      await submitReview(cafeId, { rating, text: text.trim() || null, experienceTags: [] });
      trackEvent("review_submit", { placeId: cafeId, source: "detail" });
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

  // Prefer live list aggregates so seed/mock place.reviewCount can't disagree with an empty list
  const displayCount = reviews.length;
  const displayRating =
    displayCount > 0
      ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / displayCount).toFixed(1)
      : null;

  const others = myReview ? reviews.filter((r) => r.id !== myReview.id) : reviews;

  return (
    <div className="space-y-4">
      <div className="mb-1 flex items-center gap-2 text-sm">
        <Star size={16} className="fill-gold-400 text-gold-400" />
        {displayCount > 0 ? (
          <>
            <span className="font-bold text-warm-700">{displayRating}</span>
            <span className="text-warm-400">
              · {displayCount} review{displayCount === 1 ? "" : "s"}
            </span>
          </>
        ) : (
          <span className="text-warm-400">No reviews yet</span>
        )}
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="rounded-xl border border-warm-100 bg-white p-4">
          <p className="mb-2 text-sm font-semibold text-warm-700">
            {myReview ? "Update your review" : "Your review"}
          </p>
          <p className="mb-2 text-[11px] text-warm-400">
            One review per place — posting again updates your existing review.
          </p>
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
            {myReview ? "Save changes" : "Post review"}
          </button>
        </form>
      ) : !user ? (
        <p className="text-sm text-warm-400">Sign in to leave a review.</p>
      ) : !canWrite ? (
        <p className="rounded-xl border border-dashed border-warm-200 bg-warm-50 px-4 py-3 text-sm text-warm-500">
          Customer reviews appear here. You can&apos;t review your own listing.
        </p>
      ) : null}

      {others.length === 0 && !myReview ? (
        <p className="py-6 text-center text-sm text-warm-400">No reviews yet — be the first.</p>
      ) : (
        others.map((r) => <ReviewCard key={r.id} review={r} />)
      )}
    </div>
  );
}
