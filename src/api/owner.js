import { api } from "./client";
import { mapPlace } from "./places";

export async function fetchMyPlaces() {
  const data = await api("/api/owner/places", { auth: true });
  return (data || []).map(mapPlace);
}

export async function fetchMyPlace(id) {
  const data = await api(`/api/owner/places/${id}`, { auth: true });
  return mapPlace(data);
}

export async function createPlace(body) {
  const data = await api("/api/owner/places", {
    method: "POST",
    auth: true,
    body,
  });
  return mapPlace(data);
}

export async function updatePlace(id, body) {
  const data = await api(`/api/owner/places/${id}`, {
    method: "PUT",
    auth: true,
    body,
  });
  return mapPlace(data);
}

export async function startListingPhoneOtp(placeId, phone) {
  return api(`/api/owner/places/${placeId}/phone/otp`, {
    method: "POST",
    auth: true,
    body: phone ? { phone } : {},
  });
}

export async function verifyListingPhoneOtp(placeId, code) {
  return api(`/api/owner/places/${placeId}/phone/verify`, {
    method: "POST",
    auth: true,
    body: { code },
  });
}
