import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { verifyClaimBusinessEmail } from "../api/places";
import { isVerificationRequiredError } from "../api/auth";

export default function ClaimVerifyPage() {
  const [params] = useSearchParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const claimId = params.get("claimId") || "";
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(`/claim-verify?token=${token}&claimId=${claimId}`)}`);
      return;
    }
    if (!token || !claimId) {
      setStatus("error");
      setMessage("Missing token or claimId in the link.");
      return;
    }
    let cancelled = false;
    (async () => {
      setStatus("working");
      try {
        const res = await verifyClaimBusinessEmail(Number(claimId), token);
        if (cancelled) return;
        setStatus("ok");
        setMessage(res.message || (res.autoApproved ? "Verified and approved." : "Business email verified."));
      } catch (err) {
        if (cancelled) return;
        if (isVerificationRequiredError(err)) {
          navigate("/verify-email");
          return;
        }
        setStatus("error");
        setMessage(err.message || "Could not verify business email");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, user, token, claimId, navigate]);

  return (
    <div className="page-shell page-with-nav mx-auto max-w-md pt-16 text-center">
      <h1 className="text-2xl font-bold text-warm-700" style={{ fontFamily: "var(--font-display)" }}>
        Business email verification
      </h1>
      {status === "working" || status === "idle" ? (
        <p className="mt-4 text-sm text-warm-500">Confirming…</p>
      ) : null}
      {status === "ok" ? (
        <>
          <p className="mt-4 text-sm text-sage-500">{message}</p>
          <Link to="/" className="mt-6 inline-block rounded-xl bg-warm-700 px-5 py-2.5 text-sm font-semibold text-white">
            Back home
          </Link>
        </>
      ) : null}
      {status === "error" ? (
        <>
          <p className="mt-4 text-sm text-terracotta-500">{message}</p>
          <Link to="/profile" className="mt-6 inline-block text-sm font-semibold text-warm-700 underline">
            Profile
          </Link>
        </>
      ) : null}
    </div>
  );
}
