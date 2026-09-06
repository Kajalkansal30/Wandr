import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmailRequest } from "../api/auth";
import { useAuth } from "../contexts/AuthContext";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const token = params.get("token") || "";
  const [status, setStatus] = useState(token ? "loading" : "missing");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    verifyEmailRequest(token)
      .then((res) => {
        if (cancelled) return;
        setStatus("ok");
        setMessage(res.message || "Email verified");
        if (user) {
          const next = { ...user, emailVerified: true };
          localStorage.setItem("wandr_session", JSON.stringify({
            user: next,
            role: JSON.parse(localStorage.getItem("wandr_session") || "{}").role || "user",
          }));
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(err.message || "Verification failed");
      });
    return () => { cancelled = true; };
  }, [token, user]);

  return (
    <div className="page-shell page-with-nav mx-auto max-w-md pt-10 text-center">
      <h1 className="text-2xl font-bold text-warm-700" style={{ fontFamily: "var(--font-display)" }}>
        Email verification
      </h1>
      {status === "loading" && <p className="mt-4 text-sm text-warm-500">Confirming your email…</p>}
      {status === "missing" && <p className="mt-4 text-sm text-terracotta-500">Missing token. Open the link from your email.</p>}
      {status === "ok" && <p className="mt-4 text-sm text-sage-500">{message}</p>}
      {status === "error" && <p className="mt-4 text-sm text-terracotta-500">{message}</p>}
      <Link to="/" className="mt-6 inline-block text-sm font-semibold text-warm-700 underline">
        Continue exploring
      </Link>
      {!user && (
        <p className="mt-3 text-sm text-warm-400">
          <Link to="/login" className="underline">Sign in</Link> after verifying.
        </p>
      )}
    </div>
  );
}
