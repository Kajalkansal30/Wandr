import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePlaces } from "../contexts/PlacesContext";
import CafeCard from "../components/CafeCard";
import { newPlaces, risingPlaces, hiddenPlaces } from "../utils/discovery";
import { filterByArea } from "../utils/exploreArea";

export default function WhatsNewPage() {
  const { area } = useParams();
  const navigate = useNavigate();
  const { places } = usePlaces();
  const areaName = decodeURIComponent(area || "Delhi");

  const scoped = useMemo(
    () => filterByArea(places, { id: "custom", city: areaName, label: areaName }),
    [places, areaName]
  );

  const news = useMemo(() => newPlaces(scoped), [scoped]);
  const rising = useMemo(() => risingPlaces(scoped, 8), [scoped]);
  const gems = useMemo(() => hiddenPlaces(scoped), [scoped]);

  return (
    <div className="page-shell page-with-nav pt-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm text-warm-500 transition hover:text-warm-600"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1
        className="text-2xl font-bold text-warm-700 md:text-3xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        What&apos;s new in {areaName}?
      </h1>
      <p className="mt-2 text-sm text-warm-400">This week&apos;s discovery snapshot</p>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-warm-100 bg-white p-3 text-center">
          <p className="text-lg font-bold text-warm-700">{news.length}</p>
          <p className="text-xs text-warm-400">New</p>
        </div>
        <div className="rounded-xl border border-warm-100 bg-white p-3 text-center">
          <p className="text-lg font-bold text-warm-700">{rising.length}</p>
          <p className="text-xs text-warm-400">Rising</p>
        </div>
        <div className="rounded-xl border border-warm-100 bg-white p-3 text-center">
          <p className="text-lg font-bold text-warm-700">{gems.length}</p>
          <p className="text-xs text-warm-400">Hidden</p>
        </div>
      </div>

      {news.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold text-warm-700">New</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((c, i) => (
              <CafeCard key={c.id} cafe={c} index={i} />
            ))}
          </div>
        </section>
      )}

      {rising.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold text-warm-700">Rising</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rising.map((c, i) => (
              <CafeCard key={c.id} cafe={c} index={i} />
            ))}
          </div>
        </section>
      )}

      {gems.length > 0 && (
        <section className="mt-10 mb-8">
          <h2 className="mb-4 text-lg font-bold text-warm-700">Hidden gems</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {gems.slice(0, 6).map((c, i) => (
              <CafeCard key={c.id} cafe={c} index={i} />
            ))}
          </div>
        </section>
      )}

      {news.length === 0 && rising.length === 0 && gems.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-warm-400">No discovery signals for this area yet.</p>
          <Link to="/" className="mt-3 inline-block text-sm font-semibold text-warm-600 underline">
            Back to discover
          </Link>
        </div>
      )}
    </div>
  );
}
