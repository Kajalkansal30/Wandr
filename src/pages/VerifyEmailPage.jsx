import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resendVerificationRequest, verifyEmailRequest } from "../api/auth";
import { useAuth } from "../contexts/AuthContext";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const { user, markEmailVerified } = useAuth();
  const token = params.get("token") || "";
  const [status, setStatus] = useState(token ? "loading" : "missing");
  const [message, setMessage] = useState("");
  const [resendBusy, setResendBusy] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    verifyEmailRequest(token)
      .then((res) => {
        if (cancelled) return;
        setStatus("ok");
        setMessage(res.message || "Email verified");
        markEmailVerified?.();
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(err.message || "Verification failed");
      });
    return () => {
      cancelled = true;
    };
  }, [token, markEmailVerified]);

  async function onResend() {
    setResendBusy(true);
    setResendMsg("");
    try {
      const res = await resendVerificationRequest();
      setResendMsg(res.message || "Verification email sent");
    } catch (err) {
      setResendMsg(err.message || "Could not resend");
    } finally {
      setResendBusy(false);
    }
  }

  return (
    <div className="page-shell page-with-nav mx-auto max-w-md pt-10 text-center">
      <h1 className="text-2xl font-bold text-warm-700" style={{ fontFamily: "var(--font-display)" }}>
        Email verification
      </h1>
      {status === "loading" && <p className="mt-4 text-sm text-warm-500">Confirming your email…</p>}
      {status === "missing" && (
        <p className="mt-4 text-sm text-terracotta-500">
          Missing token. Open the link from your email, or resend a new one.
        </p>
      )}
      {status === "ok" && <p className="mt-4 text-sm text-sage-500">{message}</p>}
      {status === "error" && <p className="mt-4 text-sm text-terracotta-500">{message}</p>}

      {(status === "error" || status === "missing") && user && (
        <div className="mt-6 space-y-2">
          <p className="text-sm text-warm-500">Links expire after 24 hours. Request a new email:</p>
          <button
            type="button"
            disabled={resendBusy}
            onClick={onResend}
            className="rounded-full bg-warm-700 px-4 py-2 text-sm font-semibold text-cream disabled:opacity-60"
          >
            {resendBusy ? "Sending…" : "Resend verification email"}
          </button>
          {resendMsg ? <p className="text-sm text-warm-600">{resendMsg}</p> : null}
        </div>
      )}

      <Link to="/" className="mt-6 inline-block text-sm font-semibold text-warm-700 underline">
        Continue exploring
      </Link>
      {!user && (
        <p className="mt-3 text-sm text-warm-400">
          <Link to="/login" className="underline">
            Sign in
          </Link>{" "}
          to resend a verification email.
        </p>
      )}
    </div>
  );
}
