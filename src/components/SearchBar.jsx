import { useState, useRef, useEffect } from "react";
import { Search, X, Clock, Sparkles, TrendingUp, Leaf } from "lucide-react";
import { SEARCH_SUGGESTIONS } from "../utils/searchParser";

const SHORTCUTS = [
  { id: "new", label: "New around me", icon: Sparkles, query: "new cafés near me" },
  { id: "rising", label: "Rising nearby", icon: TrendingUp, query: "rising places near me" },
  { id: "hidden", label: "Hidden gems nearby", icon: Leaf, query: "hidden gems near me" },
];

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Try "quiet café for a date" or "new places nearby"',
  onShortcutCategory,
  compact = false,
}) {
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState([]);
  const wrapRef = useRef(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("wandr_recent_searches") || "[]");
      setRecent(stored.slice(0, 4));
    } catch {
      setRecent([]);
    }
  }, []);

  function commitSearch(text) {
    onChange(text);
    setFocused(false);
    const updated = [text, ...recent.filter((r) => r !== text)].slice(0, 5);
    setRecent(updated);
    localStorage.setItem("wandr_recent_searches", JSON.stringify(updated));
  }

  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setFocused(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const showDropdown = focused && !value;

  return (
    <div ref={wrapRef} className={`relative ${compact ? "max-w-[46rem]" : ""}`}>
      <Search
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-warm-300"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-warm-100 bg-white py-3.5 pl-11 pr-11 text-sm text-warm-700 shadow-sm transition-all placeholder:text-warm-300 focus:border-warm-200 focus:outline-none focus:ring-2 focus:ring-[#EF6F61]/25"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-warm-100 transition hover:bg-warm-200"
        >
          <X size={12} className="text-warm-500" />
        </button>
      ) : (
        <Sparkles
          size={15}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#EF6F61]/70"
        />
      )}

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 animate-fade-in overflow-hidden rounded-xl border border-warm-100 bg-white shadow-lg">
          <div className="border-b border-warm-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-warm-400">Discover</p>
            <div className="flex flex-wrap gap-2">
              {SHORTCUTS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      if (onShortcutCategory) onShortcutCategory(s.id === "hidden" ? "hidden-gem" : s.id);
                      else commitSearch(s.query);
                      setFocused(false);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-warm-50 px-3 py-1.5 text-xs font-semibold text-warm-700 transition hover:bg-warm-100"
                  >
                    <Icon size={12} /> {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {recent.length > 0 && (
            <div className="p-3 pb-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-warm-400">Recent</p>
              {recent.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => commitSearch(r)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm text-warm-600 transition hover:bg-warm-50"
                >
                  <Clock size={14} className="shrink-0 text-warm-300" />
                  {r}
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-warm-50 p-3 pt-2">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-warm-400">Try</p>
            {SEARCH_SUGGESTIONS.map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => commitSearch(text)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm text-warm-600 transition hover:bg-warm-50"
              >
                <Search size={14} className="shrink-0 text-warm-300" />
                {text}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
