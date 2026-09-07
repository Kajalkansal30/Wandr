import { lazy, Suspense } from "react";

const MapViewInner = lazy(() => import("./MapViewInner"));

/** Leaflet stays out of the main bundle until a map is actually shown. */
export default function MapView(props) {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center rounded-xl bg-warm-100 text-sm text-warm-500">
          Loading map…
        </div>
      }
    >
      <MapViewInner {...props} />
    </Suspense>
  );
}
