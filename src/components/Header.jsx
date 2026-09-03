import { Link, NavLink } from "react-router-dom";
import { MapPin, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Header() {
  const { user, role } = useAuth();

  const linkCls = ({ isActive }) =>
    `text-sm font-semibold transition-colors ${isActive ? "text-warm-700" : "text-warm-400 hover:text-warm-600"}`;

  return (
    <header className="sticky top-0 z-30 glass border-b border-warm-100/50">
      <div className="page-shell py-3 flex items-center justify-between gap-4">
        <Link to="/" className="shrink-0">
          <h1
            className="text-2xl font-bold tracking-tight text-warm-700"
            style={{ fontFamily: "var(--font-display)" }}
          >
            wandr
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <MapPin size={11} className="text-terracotta-400" />
            <span className="text-xs text-warm-400 font-medium tracking-[0.15em] uppercase">
              Out&amp;About
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/" end className={linkCls}>Discover</NavLink>
          <NavLink to="/map" className={linkCls}>Explore Map</NavLink>
          <NavLink to="/lists" className={linkCls}>Collections</NavLink>
          {user && <NavLink to="/saved" className={linkCls}>Saved</NavLink>}
          <NavLink
            to={user && role === "owner" ? "/owner/dashboard" : "/login?next=/owner/dashboard"}
            className={linkCls}
          >
            For Businesses
          </NavLink>
          {user && role === "admin" && <NavLink to="/admin" className={linkCls}>Admin</NavLink>}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <Link
              to="/profile"
              className="w-9 h-9 rounded-full bg-gradient-to-br from-warm-300 to-warm-500 flex items-center justify-center text-sm font-bold text-white shadow-sm hover:shadow-md transition"
            >
              {user.displayName?.[0]?.toUpperCase() || "U"}
            </Link>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-warm-600 text-white text-sm font-semibold hover:bg-warm-700 transition shadow-sm"
            >
              <User size={15} />
              <span className="hidden md:inline">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
