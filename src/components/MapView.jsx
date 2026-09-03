import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { discoveryLabel } from "../utils/discovery";

function pinIcon(kind) {
  const colors = {
    new: "#C45C26",
    rising: "#B45309",
    hidden: "#5B8C5A",
    early: "#D4A017",
    default: "#6B4F3A",
  };
  const fill = colors[kind] || colors.default;
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
      <path fill="${fill}" stroke="#fff" stroke-width="2" d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z"/>
      <circle cx="14" cy="14" r="5" fill="#fff"/>
    </svg>`
  );
  return L.icon({
    iconUrl: `data:image/svg+xml,${svg}`,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -36],
  });
}

const DEFAULT_CENTER = [28.6139, 77.209];
const DEFAULT_ZOOM = 13;

export default function MapView({ cafes }) {
  const navigate = useNavigate();
  const positions = cafes.filter((c) => c.lat && c.lng);

  const center =
    positions.length > 0 ? [positions[0].lat, positions[0].lng] : DEFAULT_CENTER;

  return (
    <div className="h-full min-h-0 w-full overflow-hidden rounded-2xl border border-warm-100 shadow-md">
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        className="h-full w-full"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {positions.map((cafe) => {
          const label = discoveryLabel(cafe);
          const kind = label?.kind || "default";
          return (
            <Marker key={cafe.id} position={[cafe.lat, cafe.lng]} icon={pinIcon(kind)}>
              <Popup>
                <div className="min-w-[200px]">
                  {cafe.image && (
                    <img
                      src={cafe.image}
                      alt={cafe.name}
                      className="mb-2 h-24 w-full rounded-lg object-cover"
                    />
                  )}
                  {label && (
                    <span className="mb-1 inline-block rounded-full bg-warm-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warm-700">
                      {label.short}
                    </span>
                  )}
                  <h3 className="text-sm font-bold text-warm-700">{cafe.name}</h3>
                  <div className="mt-1 flex items-center gap-1">
                    <Star size={11} className="fill-gold-400 text-gold-400" />
                    <span className="text-xs font-semibold text-warm-600">{cafe.rating}</span>
                    <span className="text-xs text-warm-300">· {cafe.distance} km</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/cafe/${cafe.id}`)}
                    className="mt-2 w-full rounded-lg bg-warm-600 py-1.5 text-xs font-semibold text-white"
                  >
                    View place →
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
