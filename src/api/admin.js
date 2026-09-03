import { api } from "./client";
import { mapPlace } from "./places";

export async function fetchAdminPlaces(status = "PENDING_REVIEW") {
  const data = await api(`/api/admin/places?status=${encodeURIComponent(String(status).toUpperCase())}`, {
    auth: true,
  });
  return (data || []).map(mapPlace);
}

export async function fetchAdminPlace(id) {
  const data = await api(`/api/admin/places/${id}`, { auth: true });
  return mapPlace(data);
}

export async function fetchAdminStats() {
  return api("/api/admin/stats", { auth: true });
}

export async function fetchAuditLog() {
  return api("/api/admin/audit", { auth: true });
}

export async function approvePlace(id, body = {}) {
  const data = await api(`/api/admin/places/${id}/approve`, {
    method: "POST",
    auth: true,
    body,
  });
  return mapPlace(data);
}

export async function rejectPlace(id, body = {}) {
  const data = await api(`/api/admin/places/${id}/reject`, {
    method: "POST",
    auth: true,
    body,
  });
  return mapPlace(data);
}

export async function requestPlaceInfo(id, body = {}) {
  const data = await api(`/api/admin/places/${id}/request-info`, {
    method: "POST",
    auth: true,
    body,
  });
  return mapPlace(data);
}

export async function suspendPlace(id, body = {}) {
  const data = await api(`/api/admin/places/${id}/suspend`, {
    method: "POST",
    auth: true,
    body,
  });
  return mapPlace(data);
}

export async function closePlace(id, body = {}) {
  const data = await api(`/api/admin/places/${id}/close`, {
    method: "POST",
    auth: true,
    body,
  });
  return mapPlace(data);
}

export async function fetchAdminClaims() {
  return api("/api/admin/claims", { auth: true });
}

export async function approveClaim(id, body = {}) {
  return api(`/api/admin/claims/${id}/approve`, { method: "POST", auth: true, body });
}

export async function rejectClaim(id, body = {}) {
  return api(`/api/admin/claims/${id}/reject`, { method: "POST", auth: true, body });
}

export async function fetchPendingMedia() {
  return api("/api/admin/media", { auth: true });
}

export async function approveMedia(id, body = {}) {
  return api(`/api/admin/media/${id}/approve`, { method: "POST", auth: true, body });
}

export async function rejectMedia(id, body = {}) {
  return api(`/api/admin/media/${id}/reject`, { method: "POST", auth: true, body });
}
