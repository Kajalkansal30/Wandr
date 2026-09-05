import { useNavigate } from "react-router-dom";
import { Clapperboard, Store, MapPinned } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function AddChooser({ open, onClose }) {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const isOwner = role === "owner" || role === "admin";

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 md:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-cream p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-3 text-sm font-semibold text-warm-700">What do you want to share?</p>
        <button
          type="button"
          onClick={() => {
            onClose();
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
            onClose();
            if (isOwner) navigate("/owner/dashboard");
            else if (user) navigate("/submit");
            else navigate("/login?next=/submit");
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
        <button type="button" onClick={onClose} className="mt-3 w-full py-2 text-sm text-warm-400">
          Cancel
        </button>
      </div>
    </div>
  );
}
