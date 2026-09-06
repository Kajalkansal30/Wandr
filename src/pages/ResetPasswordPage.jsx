import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Lock, ArrowLeft } from "lucide-react";
import { resetPasswordRequest } from "../api/auth";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("Missing reset token. Open the link from your email.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await resetPasswordRequest(token, password);
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message || "Reset failed");
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
        Choose a new password
      </h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && <p className="text-sm text-terracotta-500">{error}</p>}
        <div className="relative">
          <Lock size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="w-full rounded-xl border border-warm-200 bg-white py-3.5 pl-11 pr-4 text-warm-700 focus:outline-none focus:ring-2 focus:ring-warm-400/40"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-warm-600 py-3.5 font-semibold text-white hover:bg-terracotta-500 disabled:opacity-60"
        >
          {loading ? "Saving…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
