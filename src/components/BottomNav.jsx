import { NavLink } from "react-router-dom";
import { Home, Heart, MapIcon, User, Plus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function BottomNav() {
  const { user } = useAuth();

  const base = "flex flex-col items-center gap-0.5 text-xs font-medium transition-all px-3";

  function cls({ isActive }) {
    return `${base} ${isActive ? "text-warm-600" : "text-warm-300 hover:text-warm-400"}`;
  }

  return (
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

        <NavLink to="/submit" className={cls}>
          <div className="w-10 h-10 -mt-4 rounded-full bg-warm-600 text-white flex items-center justify-center shadow-md">
            <Plus size={20} />
          </div>
          <span className="-mt-0.5">Add</span>
        </NavLink>

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
  );
}
