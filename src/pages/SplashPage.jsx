import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";

const PHOTOS = [
  "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80",
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80",
  "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=600&q=80",
  "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=600&q=80",
];

export default function SplashPage() {
  const navigate = useNavigate();
  const [requesting, setRequesting] = useState(false);

  function finish() {
    localStorage.setItem("wandr_onboarded", "1");
    navigate("/", { replace: true });
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      finish();
      return;
    }
    setRequesting(true);
    navigator.geolocation.getCurrentPosition(
      () => finish(),
      () => finish(),
      { timeout: 10000 }
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-cream lg:grid lg:grid-cols-2">
      {/* Photo mosaic — flex grid, not absolute fixed positions */}
      <div className="grid min-h-[42vh] flex-1 grid-cols-2 gap-2 p-3 sm:min-h-[48vh] lg:min-h-dvh lg:p-4">
        <div className="flex min-h-0 flex-col gap-2">
          <div className="min-h-0 flex-[1.25] overflow-hidden rounded-2xl">
            <img src={PHOTOS[0]} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="min-h-0 flex-1 overflow-hidden rounded-2xl">
            <img src={PHOTOS[1]} alt="" className="h-full w-full object-cover" />
          </div>
        </div>
        <div className="flex min-h-0 flex-col gap-2">
          <div className="min-h-0 flex-1 overflow-hidden rounded-2xl">
            <img src={PHOTOS[2]} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="min-h-0 flex-[1.25] overflow-hidden rounded-2xl">
            <img src={PHOTOS[3]} alt="" className="h-full w-full object-cover" />
          </div>
        </div>
      </div>

      {/* CTA panel — flows with screen */}
      <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md text-center lg:text-left">
          <h1
            className="text-4xl font-bold leading-[1.05] tracking-tight text-warm-700 sm:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            wandr
          </h1>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-terracotta-400">
            Out&amp;About
          </p>
          <p className="mx-auto mt-5 max-w-sm text-base leading-relaxed text-warm-500 lg:mx-0">
            Discover new cafés, hidden gems, and local food spots before everyone else.
          </p>

          <div className="mt-8 space-y-3">
            <button
              onClick={requestLocation}
              disabled={requesting}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-warm-600 py-4 font-bold text-white shadow-sm transition hover:bg-warm-700 disabled:opacity-60"
            >
              {requesting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <MapPin size={18} />
                  Find places near me
                </>
              )}
            </button>
            <button
              onClick={finish}
              className="group flex w-full items-center justify-center gap-1.5 py-3 text-sm font-medium text-warm-400 transition hover:text-warm-600"
            >
              Explore without location
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
