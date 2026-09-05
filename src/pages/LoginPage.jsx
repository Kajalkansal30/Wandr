import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Eye, EyeOff, Mail, Lock, ArrowRight, ArrowLeft } from "lucide-react";
import { DEMO_ACCOUNTS } from "../data/demoAccounts";

function safeNextPath(raw) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export default function LoginPage() {
  const { login, user, role, signOut, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const nextPath = safeNextPath(params.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Already signed in — never force a second login
    if (role === "owner") {
      navigate(nextPath || "/owner/dashboard", { replace: true });
    } else if (role === "admin") {
      navigate(nextPath?.startsWith("/admin") ? nextPath : "/admin", { replace: true });
    } else if (!nextPath?.startsWith("/owner")) {
      navigate(nextPath || "/", { replace: true });
    }
    // If explorer hit For Businesses while logged in, stay on login to switch to owner account
  }, [user, role, nextPath, navigate]);

  function redirectAfterLogin(nextRole) {
    if (nextPath) {
      if (nextPath.startsWith("/owner") && nextRole !== "owner" && nextRole !== "admin") {
        setError("That account isn’t a business account. Use an owner login or sign up as a business.");
        return;
      }
      navigate(nextPath);
      return;
    }
    if (nextRole === "admin") navigate("/admin");
    else if (nextRole === "owner") navigate("/owner/dashboard");
    else navigate("/");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (user) await signOut();
      const { role: nextRole } = await login(email, password);
      redirectAfterLogin(nextRole);
    } catch (err) {
      const messages = {
        "auth/invalid-credential": "Invalid email or password",
        "auth/user-not-found": "No account found with this email",
        "auth/too-many-requests": "Too many attempts. Try again later",
      };
      setError(messages[err.code] || err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(account) {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
  }

  const businessIntent = nextPath?.startsWith("/owner");


  return (
    <div className="auth-layout bg-cream">
      <div className="relative min-h-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=900&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
        <div className="relative z-10 flex h-full flex-col justify-between p-5 sm:p-8 lg:p-12">
          <Link
            to="/"
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-white/85 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to explore
          </Link>
          <div>
            <img
              src="/logo.png"
              alt="Wandr"
              className="h-14 w-auto object-contain drop-shadow-md sm:h-16"
            />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">
              Discover new cafés and local spots before everyone else does.
            </p>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="mb-8">
            <h1
              className="text-2xl font-bold tracking-tight text-warm-700 sm:text-3xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {businessIntent ? "Business sign in" : "Welcome back"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-warm-500">
              {businessIntent
                ? "Sign in with your owner account to manage listings"
                : "Sign in to save places and get personal picks"}
            </p>
            {user && role === "user" && businessIntent && (
              <p className="mt-3 rounded-xl border border-warm-200 bg-warm-50 px-3 py-2 text-xs text-warm-600">
                You&apos;re signed in as an explorer. Sign in with an{" "}
                <strong>owner</strong> account (e.g. owner@wandr.test) to open the business dashboard.
              </p>
            )}
          </div>

          {isDemoMode && (
            <div className="mb-5 rounded-xl border border-warm-200 bg-warm-50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-warm-500">
                API test accounts — tap to fill
              </p>
              <div className="flex flex-col gap-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => fillDemo(account)}
                    className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-left text-sm transition hover:bg-warm-100"
                  >
                    <span className="font-medium capitalize text-warm-700">{account.role}</span>
                    <span className="text-xs text-warm-400">{account.email}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-warm-400">Demo accounts · password wandr123</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-terracotta-100 bg-terracotta-50 px-4 py-3 text-sm text-terracotta-500">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-warm-600">Email</label>
              <div className="relative">
                <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-warm-200 bg-white py-3.5 pl-11 pr-4 text-warm-700 placeholder:text-warm-400 focus:border-warm-300 focus:outline-none focus:ring-2 focus:ring-warm-400/40"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-warm-600">Password</label>
              <div className="relative">
                <Lock size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-warm-200 bg-white py-3.5 pl-11 pr-12 text-warm-700 placeholder:text-warm-400 focus:border-warm-300 focus:outline-none focus:ring-2 focus:ring-warm-400/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-warm-400 transition hover:text-warm-600"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-warm-600 py-3.5 font-semibold text-white shadow-sm transition hover:bg-terracotta-500 disabled:opacity-60"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-warm-500">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-semibold text-warm-700 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
