import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { usePlaces } from "../contexts/PlacesContext";
import { Heart, MapPin, Star, Award, Compass, ArrowRight, ArrowLeft } from "lucide-react";
import { loadSavedIds } from "../utils/favorites";
import { computeBadges } from "../utils/badges";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const { places } = usePlaces();
  const [savedIds, setSavedIds] = useState([]);

  useEffect(() => {
    if (!user) {
      setSavedIds([]);
      return;
    }
    loadSavedIds(user).then(setSavedIds).catch(() => setSavedIds([]));
  }, [user]);

  const savedPlaces = places.filter((p) => savedIds.includes(String(p.id)));
  const badges = computeBadges({ savedPlaces, submittedCount: 0 });

  if (!user) {
    return (
      <div className="page-shell page-with-nav pt-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warm-100">
          <Star size={28} className="text-warm-300" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-warm-700">Join wandr</h2>
        <p className="mx-auto mb-6 max-w-xs text-sm text-warm-400">
          Sign in to track your discoveries, earn badges, and build your collection
        </p>
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="inline-flex items-center gap-2 rounded-xl bg-warm-600 px-6 py-3 font-semibold text-white transition hover:bg-warm-700"
        >
          Sign In <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  const stats = [
    { label: "Discovered", value: savedPlaces.length, icon: Compass },
    { label: "Saved", value: savedIds.length, icon: Heart },
    { label: "Badges", value: badges.length, icon: Award },
  ];

  return (
    <div className="page-shell page-with-nav pt-6 md:pt-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm text-warm-500 transition hover:text-warm-600"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-warm-300 to-warm-500 text-2xl font-bold text-white shadow-md">
          {user.displayName?.[0]?.toUpperCase() || "U"}
        </div>
        <div>
          <h1 className="text-xl font-bold text-warm-700 md:text-2xl">{user.displayName || "Explorer"}</h1>
          <p className="text-sm text-warm-400">{user.email}</p>
          {role && role !== "user" && (
            <span className="mt-1 inline-block rounded-full bg-warm-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-warm-600">
              {role}
            </span>
          )}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-warm-100 bg-white p-4 text-center">
              <Icon size={18} className="mx-auto mb-2 text-warm-400" />
              <p className="text-2xl font-bold text-warm-700">{s.value}</p>
              <p className="mt-0.5 text-xs text-warm-400">{s.label}</p>
            </div>
          );
        })}
      </div>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-warm-700" style={{ fontFamily: "var(--font-display)" }}>
          Badges
        </h2>
        {badges.length === 0 ? (
          <p className="rounded-xl border border-dashed border-warm-200 bg-white p-4 text-sm text-warm-400">
            Save new, rising, and hidden places to unlock Early Finder, Gem Hunter, and more.
          </p>
        ) : (
          <div className="space-y-3">
            {badges.map((badge) => (
              <div key={badge.id} className="flex items-center gap-4 rounded-xl border border-warm-100 bg-white p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warm-50 text-xl">
                  {badge.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-warm-700">{badge.title}</p>
                  <p className="mt-0.5 text-xs text-warm-400">{badge.desc}</p>
                </div>
                <Award size={16} className="ml-auto text-gold-400" />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-8 space-y-2">
        <button type="button" onClick={() => navigate("/saved")} className="flex w-full items-center justify-between rounded-xl border border-warm-100 bg-white p-4 transition hover:bg-warm-50">
          <span className="flex items-center gap-3 text-sm font-semibold text-warm-700">
            <Heart size={16} className="text-terracotta-400" /> Saved Places
          </span>
          <ArrowRight size={16} className="text-warm-300" />
        </button>
        <button type="button" onClick={() => navigate("/submit")} className="flex w-full items-center justify-between rounded-xl border border-warm-100 bg-white p-4 transition hover:bg-warm-50">
          <span className="flex items-center gap-3 text-sm font-semibold text-warm-700">
            <MapPin size={16} className="text-sage-500" /> Submit a Place
          </span>
          <ArrowRight size={16} className="text-warm-300" />
        </button>
      </section>

      <button
        type="button"
        onClick={signOut}
        className="w-full py-3 text-center text-sm font-medium text-warm-400 transition hover:text-warm-600"
      >
        Sign out
      </button>
    </div>
  );
}
