import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { forgotPasswordRequest } from "../api/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPasswordRequest(email);
      setDone(true);
    } catch (err) {
      setError(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell page-with-nav mx-auto max-w-md pt-10">
      <Link to="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm text-warm-400 hover:text-warm-600">
        <ArrowLeft size={16} /> Back to sign in
      </Link>
      <h1 className="text-2xl font-bold text-warm-700" style={{ fontFamily: "var(--font-display)" }}>
        Forgot password
      </h1>
      <p className="mt-2 text-sm text-warm-500">
        Enter your email and we&apos;ll send a reset link if an account exists.
      </p>
      {done ? (
        <p className="mt-6 rounded-xl border border-sage-200 bg-sage-50 px-4 py-3 text-sm text-sage-500">
          If that email is registered, a reset link is on its way. Check your inbox (and spam).
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <p className="text-sm text-terracotta-500">{error}</p>}
          <div className="relative">
            <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full rounded-xl border border-warm-200 bg-white py-3.5 pl-11 pr-4 text-warm-700 focus:outline-none focus:ring-2 focus:ring-warm-400/40"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-warm-600 py-3.5 font-semibold text-white hover:bg-terracotta-500 disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </div>
  );
}
