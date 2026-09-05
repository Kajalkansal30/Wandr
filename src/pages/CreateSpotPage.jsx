import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { usePlaces } from "../contexts/PlacesContext";
import { createSpot } from "../api/spotted";
import { isSpotUploadAvailable, uploadSpotFile } from "../utils/uploadSpot";

const SPOT_KINDS = [
  { id: "NEW_CAFE", label: "New café" },
  { id: "NEW_MENU", label: "New menu" },
  { id: "FOOD", label: "Food" },
  { id: "AMBIENCE", label: "Ambience" },
  { id: "HIDDEN_GEM", label: "Hidden gem" },
  { id: "EXPERIENCE", label: "Experience" },
  { id: "EVENT", label: "Event" },
  { id: "OFFER", label: "Offer" },
  { id: "REVIEW", label: "Review" },
  { id: "BEHIND_SCENES", label: "Behind the scenes" },
];

export default function CreateSpotPage() {
  const { user } = useAuth();
  const { places } = usePlaces();
  const navigate = useNavigate();
  const canUpload = isSpotUploadAvailable();

  const [query, setQuery] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [spotKind, setSpotKind] = useState("AMBIENCE");
  const [caption, setCaption] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = places || [];
    if (!q) return list.slice(0, 8);
    return list
      .filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.city?.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [places, query]);

  const selected = places?.find((p) => String(p.id) === String(placeId));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!placeId) {
      setError("Choose which café this spot is about.");
      return;
    }
    if (!spotKind) {
      setError("Pick what you’re showing.");
      return;
    }

    setLoading(true);
    try {
      let videoUrl = url.trim();
      if (file && canUpload) {
        videoUrl = await uploadSpotFile(file, user?.uid || user?.id);
      }
      if (!videoUrl) {
        setError(canUpload ? "Add a video file or paste a URL." : "Paste a video URL to continue.");
        setLoading(false);
        return;
      }
      if (!/^https?:\/\//i.test(videoUrl)) {
        setError("Video URL must start with http:// or https://");
        setLoading(false);
        return;
      }

      const spot = await createSpot({
        placeId: Number(placeId),
        url: videoUrl,
        caption: caption.trim() || null,
        spotKind,
      });
      setDone(spot);
    } catch (err) {
      setError(err.message || "Could not publish spot");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    const pending = done.status === "PENDING";
    return (
      <div className="page-shell page-with-nav py-10">
        <h1 className="text-2xl font-bold text-warm-700" style={{ fontFamily: "var(--font-display)" }}>
          {pending ? "Spot submitted" : "Spot is live"}
        </h1>
        <p className="mt-2 text-sm text-warm-400">
          {pending
            ? "We’ll review it shortly. Thanks for helping people discover cafés."
            : "People can find it in Spotted now."}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate("/spotted")}
            className="rounded-xl bg-warm-600 px-5 py-3 text-sm font-semibold text-white hover:bg-terracotta-500"
          >
            Open Spotted
          </button>
          {done.placeId && (
            <Link
              to={`/cafe/${done.placeId}`}
              className="rounded-xl border border-warm-200 px-5 py-3 text-sm font-semibold text-warm-600"
            >
              View café
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell page-with-nav py-6 md:py-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm text-warm-400 hover:text-warm-600"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold text-warm-700 md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
        Create a Spot
      </h1>
      <p className="mt-1 text-sm text-warm-400">Every spot must be connected to a real café.</p>

      <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-lg space-y-6">
        {error && (
          <div className="rounded-xl border border-terracotta-100 bg-terracotta-50 px-4 py-3 text-sm text-terracotta-500">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-warm-600">Which café?</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cafés"
            className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-warm-700"
          />
          {selected && (
            <p className="mt-2 text-sm font-semibold text-warm-700">
              Selected: {selected.name}
              {selected.city ? ` · ${selected.city}` : ""}
            </p>
          )}
          <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-xl border border-warm-100 bg-white">
            {matches.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPlaceId(String(p.id));
                  setQuery(p.name);
                }}
                className={`flex w-full flex-col px-4 py-2.5 text-left text-sm transition hover:bg-warm-50 ${
                  String(placeId) === String(p.id) ? "bg-warm-50" : ""
                }`}
              >
                <span className="font-semibold text-warm-700">{p.name}</span>
                <span className="text-xs text-warm-400">{[p.address, p.city].filter(Boolean).join(" · ")}</span>
              </button>
            ))}
            {matches.length === 0 && (
              <p className="px-4 py-3 text-sm text-warm-400">No cafés match that search.</p>
            )}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-warm-600">What are you showing?</p>
          <div className="flex flex-wrap gap-2">
            {SPOT_KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setSpotKind(k.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  spotKind === k.id
                    ? "bg-warm-600 text-white"
                    : "border border-warm-200 text-warm-500 hover:border-warm-400"
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-warm-600">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="What makes this place worth discovering?"
            className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-warm-700"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-warm-600">Video URL</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…mp4"
            className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-warm-700"
          />
          {!canUpload && (
            <p className="mt-1.5 text-xs text-warm-400">
              File upload needs Firebase Storage — paste a URL for now.
            </p>
          )}
        </div>

        {canUpload && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-warm-600">Or upload a file</label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-warm-500"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-warm-600 py-3.5 font-semibold text-white transition hover:bg-terracotta-500 disabled:opacity-60"
        >
          {loading ? <Loader size={18} className="animate-spin" /> : "Publish"}
        </button>
      </form>
    </div>
  );
}
