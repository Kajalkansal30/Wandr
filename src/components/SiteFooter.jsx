import { Link } from "react-router-dom";

const EXPLORE = [
  { to: "/", label: "Discover" },
  { to: "/spotted", label: "Spotted" },
  { to: "/map", label: "Explore Map" },
  { to: "/lists", label: "Guides" },
];

const COMPANY = [
  { to: "/signup", label: "List a place" },
  { to: "/submit", label: "Suggest a spot" },
  { href: "mailto:hello@wandr.app", label: "Contact" },
];

export default function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-warm-100 bg-warm-50/80 md:mt-14">
      <div className="page-shell py-10 md:py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr] md:gap-12">
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5">
              <img src="/logo.png" alt="Wandr" className="h-9 w-auto object-contain" />
            </Link>
            <p
              className="mt-3 text-base font-semibold text-warm-700"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Out and about
            </p>
            <p className="mt-1 max-w-xs text-sm leading-relaxed text-warm-400">
              New cafés, hidden gems, and local spots — before everyone else finds them.
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-warm-400">
              Explore
            </p>
            <ul className="space-y-2">
              {EXPLORE.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm font-medium text-warm-700 transition hover:text-terracotta-500"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-warm-400">
              Company
            </p>
            <ul className="space-y-2">
              {COMPANY.map((item) => (
                <li key={item.label}>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-sm font-medium text-warm-700 transition hover:text-terracotta-500"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      to={item.to}
                      className="text-sm font-medium text-warm-700 transition hover:text-terracotta-500"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-warm-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-warm-400">© {new Date().getFullYear()} Wandr</p>
          <p className="text-xs text-warm-400">Made for people who wander locally</p>
        </div>
      </div>
    </footer>
  );
}
