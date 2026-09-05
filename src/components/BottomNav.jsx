import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, Heart, MapIcon, User, Plus, Clapperboard, Store, MapPinned } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function BottomNav() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const isOwner = role === "owner" || role === "admin";
  const [chooserOpen, setChooserOpen] = useState(false);

  const base = "flex flex-col items-center gap-0.5 text-xs font-medium transition-all px-2.5";

  function cls({ isActive }) {
    return `${base} ${isActive ? "text-warm-600" : "text-warm-400 hover:text-warm-500"}`;
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-warm-100/50 md:hidden">
        <div className="page-shell flex items-center justify-around py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
          <NavLink to="/" end className={cls}>
            <Home size={20} />
            <span>Discover</span>
          </NavLink>

          <NavLink to="/map" className={cls}>
            <MapIcon size={20} />
            <span>Map</span>
          </NavLink>

          <NavLink to="/spotted" className={cls}>
            <Clapperboard size={20} />
            <span>Spotted</span>
          </NavLink>

          <button
            type="button"
            onClick={() => setChooserOpen(true)}
            className={`${base} text-warm-400`}
          >
            <div className="-mt-4 flex h-10 w-10 items-center justify-center rounded-full bg-warm-600 text-white shadow-md">
              <Plus size={20} />
            </div>
            <span className="-mt-0.5">Add</span>
          </button>

          {user ? (
            <NavLink to="/saved" className={cls}>
              <Heart size={20} />
              <span>Saved</span>
            </NavLink>
          ) : (
            <NavLink to="/login" className={cls}>
              <Heart size={20} />
              <span>Saved</span>
            </NavLink>
          )}

          <NavLink to={user ? "/profile" : "/login"} className={cls}>
            <User size={20} />
            <span>Profile</span>
          </NavLink>
        </div>
      </nav>

      {chooserOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 md:items-center"
          onClick={() => setChooserOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-cream p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-3 text-sm font-semibold text-warm-700">What do you want to share?</p>
            <button
              type="button"
              onClick={() => {
                setChooserOpen(false);
                navigate(user ? "/spotted/create" : "/login?next=/spotted/create");
              }}
              className="mb-2 flex w-full items-center gap-3 rounded-xl border border-warm-100 bg-white px-4 py-3 text-left transition hover:border-warm-300"
            >
              <Clapperboard size={18} className="text-warm-600" />
              <span>
                <span className="block text-sm font-semibold text-warm-700">Spot</span>
                <span className="text-xs text-warm-400">Short video of a café</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setChooserOpen(false);
                navigate(isOwner ? "/owner/dashboard" : user ? "/submit" : "/login?next=/submit");
              }}
              className="flex w-full items-center gap-3 rounded-xl border border-warm-100 bg-white px-4 py-3 text-left transition hover:border-warm-300"
            >
              {isOwner ? <Store size={18} className="text-warm-600" /> : <MapPinned size={18} className="text-warm-600" />}
              <span>
                <span className="block text-sm font-semibold text-warm-700">
                  {isOwner ? "Business hub" : "Submit a place"}
                </span>
                <span className="text-xs text-warm-400">
                  {isOwner ? "Manage your listings" : "Add a café to Wandr"}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setChooserOpen(false)}
              className="mt-3 w-full py-2 text-sm text-warm-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
