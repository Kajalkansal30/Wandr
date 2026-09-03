import { useState, useMemo, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_CENTER = [28.6139, 77.209];

function ClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function DraggableMarker({ position, onDragEnd }) {
  const eventHandlers = useMemo(
    () => ({
      dragend(e) {
        const { lat, lng } = e.target.getLatLng();
        onDragEnd({ lat, lng });
      },
    }),
    [onDragEnd]
  );

  return (
    <Marker
      position={[position.lat, position.lng]}
      icon={markerIcon}
      draggable
      eventHandlers={eventHandlers}
    />
  );
}

export default function MapPinPicker({ value, onChange }) {
  const [position, setPosition] = useState(
    value?.lat ? { lat: value.lat, lng: value.lng } : null
  );

  const handlePlace = useCallback(
    (coords) => {
      setPosition(coords);
      onChange(coords);
    },
    [onChange]
  );

  const center = position
    ? [position.lat, position.lng]
    : DEFAULT_CENTER;

  return (
    <div>
      <div className="rounded-xl overflow-hidden border border-warm-100" style={{ height: 250 }}>
        <MapContainer
          center={center}
          zoom={14}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onClick={handlePlace} />
          {position && (
            <DraggableMarker position={position} onDragEnd={handlePlace} />
          )}
        </MapContainer>
      </div>
      <p className="text-xs text-warm-400 mt-2 text-center">
        {position
          ? `Selected: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`
          : "Tap the map to place your cafe pin"}
      </p>
    </div>
  );
}
