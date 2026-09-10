import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/** Greeting strip for owner pages — main Header already has logo / profile. */
export default function OwnerTopBar({ subtitle, listingHint, showBack }) {
  const { user } = useAuth();
  const location = useLocation();
  const firstName = user?.displayName?.split(/\s+/)[0] || "there";
  const back =
    showBack ??
    (location.pathname !== "/owner/dashboard" && location.pathname !== "/owner");

  return (
    <div className="mb-6">
      {back && (
        <Link to="/owner/dashboard" className="text-sm text-warm-400 hover:text-warm-600">
          ← Back
        </Link>
      )}
      <h1
        className={`${back ? "mt-3" : ""} text-2xl font-bold text-warm-700 md:text-3xl`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        Hi, {firstName}
      </h1>
      <p className="mt-1 text-sm text-warm-400">{subtitle || "Your places on Wandr"}</p>
      {listingHint && <p className="mt-0.5 text-sm font-medium text-warm-600">{listingHint}</p>}
    </div>
  );
}
