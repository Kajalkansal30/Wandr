import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Leaf, Heart, BookOpen, Flame, Wallet } from "lucide-react";
import CafeCard from "../components/CafeCard";
import { usePlaces } from "../contexts/PlacesContext";

const curatedLists = [
  {
    id: "new-this-week",
    title: "New This Week",
    subtitle: "Fresh openings you don't want to miss",
    icon: Sparkles,
    filter: (c) => c.badge === "new",
    color: "bg-terracotta-50 text-terracotta-500",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80",
  },
  {
    id: "hidden-gems",
    title: "Hidden Gems",
    subtitle: "Underrated spots with amazing vibes",
    icon: Leaf,
    filter: (c) => c.badge === "hidden-gem",
    color: "bg-sage-100 text-sage-500",
    image: "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=400&q=80",
  },
  {
    id: "best-for-dates",
    title: "Best for Dates",
    subtitle: "Romantic spots to impress",
    icon: Heart,
    filter: (c) => c.bestFor?.includes("Date"),
    color: "bg-blush-100 text-blush-500",
    image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&q=80",
  },
  {
    id: "study-work",
    title: "Study & Work",
    subtitle: "WiFi, outlets, and quiet vibes",
    icon: BookOpen,
    filter: (c) => c.bestFor?.includes("Study") || c.bestFor?.includes("Work"),
    color: "bg-lavender-100 text-lavender-500",
    image: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400&q=80",
  },
  {
    id: "trending",
    title: "Trending Right Now",
    subtitle: "The spots everyone's saving",
    icon: Flame,
    filter: () => true,
    sort: (a, b) => (b.savedCount || 0) - (a.savedCount || 0),
    color: "bg-gold-100 text-gold-400",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
  },
  {
    id: "under-500",
    title: "Under ₹500 for Two",
    subtitle: "Great vibes on a budget",
    icon: Wallet,
    filter: (c) => (c.avgCostForTwo || 0) <= 500,
    color: "bg-warm-100 text-warm-600",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80",
  },
];

export function CuratedListsIndex() {
  const navigate = useNavigate();
  const { places } = usePlaces();
  return (
    <div className="page-shell page-with-nav pt-6 md:pt-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm text-warm-500 transition hover:text-warm-600"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-warm-700 md:text-3xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Curated Collections
        </h1>
        <p className="mt-1 text-sm text-warm-400">Handpicked collections for every mood</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {curatedLists.map((list) => {
          const Icon = list.icon;
          const count = places.filter(list.filter).length;
          return (
            <Link
              key={list.id}
              to={`/lists/${list.id}`}
              className="group relative rounded-2xl overflow-hidden aspect-[2/1] cursor-pointer"
            >
              <img
                src={list.image}
                alt={list.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={16} className="text-white/80" />
                  <span className="text-xs font-semibold text-white/60">{count} places</span>
                </div>
                <h3 className="text-base font-bold text-white leading-snug">{list.title}</h3>
                <p className="text-xs text-white/60 mt-0.5">{list.subtitle}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function CuratedListPage() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const { places } = usePlaces();
  const list = curatedLists.find((l) => l.id === listId);

  if (!list) {
    return (
      <div className="page-shell page-with-nav pt-20 text-center">
        <h2 className="text-xl font-bold text-warm-600">List not found</h2>
        <Link to="/lists" className="text-warm-500 underline text-sm mt-2 inline-block">Browse all lists</Link>
      </div>
    );
  }

  let results = places.filter(list.filter);
  if (list.sort) results = [...results].sort(list.sort);

  return (
    <div className="page-shell page-with-nav pt-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-5 flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-600 transition"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden mb-8 aspect-[3/1]">
        <img src={list.image} alt={list.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
          <h1
            className="text-2xl md:text-3xl font-bold text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {list.title}
          </h1>
          <p className="text-sm text-white/70 mt-1">{results.length} places · {list.subtitle}</p>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-warm-400">No places in this list yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {results.map((cafe, i) => (
            <CafeCard key={cafe.id} cafe={cafe} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
