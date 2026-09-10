import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, ArrowLeft, MapPin } from "lucide-react";

function safeNextPath(raw) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const nextPath = safeNextPath(params.get("next"));
  const intentOwner = nextPath?.startsWith("/owner") || params.get("as") === "owner";
  const [accountType, setAccountType] = useState(intentOwner ? "OWNER" : "USER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationHint, setLocationHint] = useState("");

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationHint("Location isn’t available on this device — you can still explore.");
      return;
    }
    setLocating(true);
    setLocationHint("");
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationHint("We’ll use your area to show nearby places.");
        setLocating(false);
      },
      () => {
        setLocationHint("Skipped — you can explore without location.");
        setLocating(false);
      },
      { timeout: 10000 }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      localStorage.setItem("wandr_onboarded", "1");
      await signup(email, password, name, accountType);
      if (accountType === "OWNER") {
        navigate(nextPath?.startsWith("/owner") ? nextPath : "/owner/dashboard");
      } else {
        navigate(nextPath && !nextPath.startsWith("/owner") ? nextPath : "/");
      }
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout bg-cream">
      <div className="relative min-h-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=900&q=80"
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
            <img src="/logo.png" alt="Wandr" className="h-14 w-auto object-contain drop-shadow-md sm:h-16" />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">
              Create an Explorer account for free, or a Café owner account with Business Hub.
            </p>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-warm-700 sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
              Join Wandr
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-warm-500">
              Pick your account type. Accounts are separate — Explorer and Café owner cannot convert in-app.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-terracotta-100 bg-terracotta-50 px-4 py-3 text-sm text-terracotta-500">
                {error}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-warm-600">I am…</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAccountType("USER")}
                  className={`rounded-xl border px-3 py-3 text-left transition ${
                    accountType === "USER"
                      ? "border-warm-700 bg-warm-700 text-cream"
                      : "border-warm-200 bg-white text-warm-700 hover:border-warm-400"
                  }`}
                >
                  <p className="text-sm font-semibold">Explorer</p>
                  <p className={`mt-1 text-xs ${accountType === "USER" ? "text-cream/80" : "text-warm-400"}`}>
                    Save places, Spotted, reviews. Free.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType("OWNER")}
                  className={`rounded-xl border px-3 py-3 text-left transition ${
                    accountType === "OWNER"
                      ? "border-warm-700 bg-warm-700 text-cream"
                      : "border-warm-200 bg-white text-warm-700 hover:border-warm-400"
                  }`}
                >
                  <p className="text-sm font-semibold">Café owner</p>
                  <p className={`mt-1 text-xs ${accountType === "OWNER" ? "text-cream/80" : "text-warm-400"}`}>
                    Same app + Business Hub for listings.
                  </p>
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-warm-600">Display name</label>
              <div className="relative">
                <User size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-warm-200 bg-white py-3.5 pl-11 pr-4 text-warm-700 focus:border-warm-300 focus:outline-none focus:ring-2 focus:ring-warm-400/40"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-warm-600">Email</label>
              <div className="relative">
                <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-warm-200 bg-white py-3.5 pl-11 pr-4 text-warm-700 focus:border-warm-300 focus:outline-none focus:ring-2 focus:ring-warm-400/40"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-warm-600">Password</label>
              <div className="relative">
                <Lock size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-warm-200 bg-white py-3.5 pl-11 pr-12 text-warm-700 focus:border-warm-300 focus:outline-none focus:ring-2 focus:ring-warm-400/40"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-warm-400">
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={requestLocation}
              className="inline-flex items-center gap-2 text-sm text-warm-500 hover:text-warm-700"
            >
              <MapPin size={14} />
              {locating ? "Locating…" : "Share approximate location (optional)"}
            </button>
            {locationHint && <p className="text-xs text-warm-400">{locationHint}</p>}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-warm-600 py-3.5 font-semibold text-white shadow-sm transition hover:bg-terracotta-500 disabled:opacity-60"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Create {accountType === "OWNER" ? "owner" : "explorer"} account <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-xs text-warm-400">
            We&apos;ll send a verification link to your email. Café owners finish listing setup in Business Hub after signup.
          </p>

          <p className="mt-8 text-center text-sm text-warm-500">
            Already have an account?{" "}
            <Link to={accountType === "OWNER" ? "/login?next=/owner/dashboard" : "/login"} className="font-semibold text-warm-700 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
