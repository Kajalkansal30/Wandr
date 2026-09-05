import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, ArrowLeft, Store, MapPin } from "lucide-react";

const roles = [
  { id: "user", label: "I'm exploring", desc: "Discover, save & review", icon: User },
  { id: "owner", label: "I'm a business", desc: "Register & manage listing", icon: Store },
];

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("user");
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
      await signup(email, password, name, selectedRole);
      navigate(selectedRole === "owner" ? "/owner/dashboard" : "/");
    } catch (err) {
      const messages = {
        "auth/email-already-in-use": "An account with this email already exists",
        "auth/weak-password": "Password is too weak",
      };
      setError(messages[err.code] || err.message || "Signup failed. Please try again.");
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
            <img
              src="/logo.png"
              alt="Wandr"
              className="h-14 w-auto object-contain drop-shadow-md sm:h-16"
            />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">
              Discover new cafés, hidden gems, and local food spots before everyone else.
            </p>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="mb-6">
            <h1
              className="text-2xl font-bold tracking-tight text-warm-700 sm:text-3xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Join wandr
            </h1>
            <p className="mt-2 text-sm text-warm-500">Create your account to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-terracotta-100 bg-terracotta-50 px-4 py-3 text-sm text-terracotta-500">
                {error}
              </div>
            )}

            <div className="rounded-xl border border-warm-100 bg-white p-3">
              <button
                type="button"
                onClick={requestLocation}
                disabled={locating}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-warm-50 py-2.5 text-sm font-semibold text-warm-700 transition hover:bg-warm-100 disabled:opacity-60"
              >
                {locating ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-warm-300 border-t-warm-600" />
                ) : (
                  <MapPin size={16} className="text-warm-600" />
                )}
                Use my location
              </button>
              {locationHint && <p className="mt-2 text-center text-xs text-warm-400">{locationHint}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {roles.map((r) => {
                const Icon = r.icon;
                const active = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRole(r.id)}
                    className={`rounded-xl border-2 p-3.5 text-left transition-all ${
                      active
                        ? "border-warm-500 bg-warm-50 shadow-sm"
                        : "border-warm-100 bg-white hover:border-warm-200"
                    }`}
                  >
                    <Icon size={20} className={active ? "text-warm-600" : "text-warm-300"} />
                    <p className={`mt-2 text-sm font-semibold ${active ? "text-warm-700" : "text-warm-500"}`}>
                      {r.label}
                    </p>
                    <p className="mt-0.5 text-xs text-warm-400">{r.desc}</p>
                  </button>
                );
              })}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-warm-600">Full name</label>
              <div className="relative">
                <User size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-warm-200 bg-white py-3.5 pl-11 pr-4 text-warm-700 placeholder:text-warm-400 focus:border-warm-300 focus:outline-none focus:ring-2 focus:ring-warm-400/40"
                />
              </div>
            </div>

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
                  placeholder="Min 6 characters"
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
                  Create Account <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-warm-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-warm-700 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
