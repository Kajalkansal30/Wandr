import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, Compass, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function OwnerTopBar({ subtitle, listingHint }) {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const firstName = user?.displayName?.split(/\s+/)[0] || "there";

  useEffect(() => {
    function onDoc(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="mb-6 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <Link to="/" className="inline-block">
          <img src="/logo.png" alt="Wandr" className="h-9 w-auto object-contain" />
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-warm-700 md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
          Hi, {firstName}
        </h1>
        <p className="mt-1 text-sm text-warm-400">
          {subtitle || "Your places on Wandr"}
        </p>
        {listingHint && (
          <p className="mt-0.5 text-sm font-medium text-warm-600">{listingHint}</p>
        )}
      </div>

      <div className="relative flex shrink-0 items-center gap-2" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-warm-700 text-sm font-bold text-cream shadow-sm"
          aria-label="Account menu"
        >
          {user?.displayName?.[0]?.toUpperCase() || "O"}
        </button>
        {open && (
          <div className="absolute right-0 top-12 z-40 w-48 overflow-hidden rounded-xl border border-warm-100 bg-white shadow-lg">
            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-warm-700 hover:bg-warm-50"
            >
              <Compass size={15} /> View Discover
            </Link>
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-warm-700 hover:bg-warm-50"
            >
              <User size={15} /> Profile
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-terracotta-500 hover:bg-warm-50"
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
