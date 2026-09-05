import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { User, Plus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import AddChooser from "./AddChooser";

export default function Header() {
  const { user, role } = useAuth();
  const [chooserOpen, setChooserOpen] = useState(false);

  const linkCls = ({ isActive }) =>
    `text-sm font-semibold transition-colors ${isActive ? "text-warm-700" : "text-warm-400 hover:text-warm-700"}`;

  return (
    <>
      <header className="sticky top-0 z-30 glass border-b border-warm-100">
        <div className="page-shell flex items-center justify-between gap-4 py-2.5 md:py-3">
          <Link to="/" className="shrink-0">
            <img
              src="/logo.png"
              alt="Wandr"
              className="h-9 w-auto object-contain md:h-10"
            />
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <NavLink to="/" end className={linkCls}>Discover</NavLink>
            <NavLink to="/spotted" className={linkCls}>Spotted</NavLink>
            <NavLink to="/map" className={linkCls}>Explore Map</NavLink>
            <NavLink to="/lists" className={linkCls}>Guides</NavLink>
            {user && <NavLink to="/saved" className={linkCls}>Saved</NavLink>}
            {user && role === "owner" && (
              <NavLink to="/owner/dashboard" className={linkCls}>Business Hub</NavLink>
            )}
            {user && role === "admin" && <NavLink to="/admin" className={linkCls}>Admin</NavLink>}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setChooserOpen(true)}
              className="hidden items-center gap-1.5 rounded-full bg-warm-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-terracotta-500 md:inline-flex"
            >
              <Plus size={16} />
              Add
            </button>
            {user ? (
              <Link
                to="/profile"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-warm-700 text-sm font-bold text-cream shadow-sm transition hover:opacity-90"
              >
                {user.displayName?.[0]?.toUpperCase() || "U"}
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-full bg-warm-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-terracotta-500"
              >
                <User size={15} />
                <span className="hidden md:inline">Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </header>
      <AddChooser open={chooserOpen} onClose={() => setChooserOpen(false)} />
    </>
  );
}
