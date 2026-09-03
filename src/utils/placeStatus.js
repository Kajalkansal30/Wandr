export function hoursAgoLabel(iso) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const days = Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Info checked today";
  if (days === 1) return "Info checked 1 day ago";
  return `Info checked ${days} days ago`;
}

/** Heuristic open/closed from hours string + operating flags. */
export function operatingLabel(place) {
  if (!place) return null;
  if (place.operatingStatus === "PERMANENTLY_CLOSED" || place.status === "closed") {
    return { kind: "closed", label: "Permanently closed", tone: "bad" };
  }
  if (place.operatingStatus === "TEMPORARILY_CLOSED" || place.temporarilyClosed) {
    return { kind: "temp", label: "Temporarily closed", tone: "warn" };
  }
  if (place.operatingStatus === "MOVED") {
    return { kind: "moved", label: "Moved", tone: "warn" };
  }
  if (place.locationType === "POP_UP") {
    return { kind: "popup", label: "Pop-up · check schedule", tone: "info" };
  }
  if (place.locationType === "FOOD_TRUCK") {
    return { kind: "truck", label: "Food truck · usually found here", tone: "info" };
  }

  const hours = (place.hours || "").toLowerCase();
  if (!hours) return { kind: "unknown", label: "Hours not listed", tone: "muted" };

  // Very light heuristic — structured hours come in P1
  const now = new Date();
  const h = now.getHours();
  if (/closed today/i.test(place.hours || "")) {
    return { kind: "closed_today", label: "Closed today", tone: "bad" };
  }
  if (h >= 10 && h < 22) {
    return { kind: "open", label: "Likely open now", tone: "good" };
  }
  if (/12 am|1 am|2 am|3 am|midnight|late/i.test(hours) && h >= 20) {
    return { kind: "open", label: "Late night · likely open", tone: "good" };
  }
  return { kind: "closed_now", label: "May be closed now", tone: "warn" };
}

export function addressLabel(place) {
  if (!place) return "";
  if (place.locationType === "FOOD_TRUCK" || place.locationType === "POP_UP" || place.locationType === "STREET_FOOD") {
    return place.serviceArea || place.address
      ? `Usually found: ${place.serviceArea || place.address}`
      : place.city || "";
  }
  return [place.address, place.city].filter(Boolean).join(", ");
}
