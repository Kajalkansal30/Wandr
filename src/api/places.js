import { api } from "./client";

/** Map API place → shape used by CafeCard / detail / map. */
export function mapPlace(p) {
  if (!p) return null;
  const ownershipStatus = p.ownershipStatus ? String(p.ownershipStatus).toUpperCase() : "UNCLAIMED";
  const verified = p.verified != null
    ? Boolean(p.verified)
    : ownershipStatus === "OWNER_VERIFIED";
  const verifiedDetails = Array.isArray(p.verifiedDetails)
    ? p.verifiedDetails
    : buildTrustDetails(p, verified, ownershipStatus);

  return {
    id: String(p.id),
    name: p.name,
    category: p.category || "",
    type: p.type || "cafe",
    locationType: p.locationType ? String(p.locationType).toUpperCase() : "CAFE",
    description: p.description || "",
    address: p.address || "",
    city: p.city || "",
    serviceArea: p.serviceArea || null,
    image: p.image || "",
    photos: p.image ? [p.image] : [],
    phone: p.phone || null,
    whatsapp: p.whatsapp || null,
    website: p.website || null,
    instagram: p.instagram || null,
    hours: p.hours || "",
    lat: p.lat,
    lng: p.lng,
    rating: p.rating ?? 0,
    reviewCount: p.reviewCount ?? 0,
    savedCount: p.savedCount ?? 0,
    priceLevel: p.priceLevel ?? 1,
    avgCostForTwo: p.avgCostForTwo ?? 0,
    badge: p.badge || null,
    openedDaysAgo: p.openedDaysAgo ?? null,
    tags: p.tags || [],
    bestFor: p.bestFor || [],
    distance: p.distance != null ? Number(p.distance.toFixed(1)) : 0,
    status: p.status ? String(p.status).toLowerCase() : null,
    ownershipStatus,
    operatingStatus: p.operatingStatus ? String(p.operatingStatus).toUpperCase() : "OPEN",
    temporarilyClosed: Boolean(p.temporarilyClosed),
    wifi: p.wifi || null,
    powerOutlets: Boolean(p.powerOutlets),
    noiseLevel:
      p.noiseLevel ||
      ((p.tags || []).some((t) => /quiet/i.test(t)) ? "quiet" : (p.tags || []).some((t) => /lively/i.test(t)) ? "lively" : null),
    seating: p.seating || ((p.tags || []).some((t) => /garden|outdoor|rooftop/i.test(t)) ? ["Outdoor"] : []),
    petFriendly: Boolean(p.petFriendly),
    lateNight:
      Boolean(p.lateNight) ||
      /late|midnight|12 am|1 am|2 am|3 am/i.test(p.hours || "") ||
      (p.tags || []).some((t) => /late/i.test(t)),
    instagramWorthy: Boolean(p.instagramWorthy ?? p.photoSpot) || (p.tags || []).some((t) => /aesthetic|photo/i.test(t)),
    photoSpot: Boolean(p.photoSpot ?? p.instagramWorthy) || (p.tags || []).some((t) => /aesthetic|photo/i.test(t)),
    parking: p.parking || null,
    verified,
    verifiedDetails,
    phoneVerified: Boolean(p.phoneVerified),
    locationVerified: Boolean(p.locationVerified),
    businessDocVerified: Boolean(p.businessDocVerified),
    fssaiVerified: Boolean(p.fssaiVerified),
    socialVerified: Boolean(p.socialVerified),
    communityConfirmed: Boolean(p.communityConfirmed),
    communityConfirmCount: p.communityConfirmCount ?? 0,
    claimedAt: p.claimedAt || null,
    verifiedAt: p.verifiedAt || null,
    lastInformationCheck: p.lastInformationCheck || null,
    openingDate: p.openingDate || null,
    needsInfoReasons: p.needsInfoReasons || null,
    adminNote: p.adminNote || null,
    ownerDisplayName: p.ownerDisplayName || null,
    menu: p.menu || [],
    savesThisWeek: p.savesThisWeek ?? 0,
    savesLastWeek: p.savesLastWeek ?? 0,
    addedByDisplayName: p.addedByDisplayName || null,
    foundByCount: p.foundByCount ?? p.savedCount ?? 0,
    sponsored: Boolean(p.sponsored),
    sponsoredHeadline: p.sponsoredHeadline || null,
    boostCampaignId: p.boostCampaignId != null ? String(p.boostCampaignId) : null,
    boostEndsAt: p.boostEndsAt || null,
  };
}

function buildTrustDetails(p, verified, ownershipStatus) {
  const list = [];
  if (verified) list.push("Owner verified");
  if (p.phoneVerified) list.push("Phone verified");
  if (p.locationVerified) list.push("Location confirmed");
  if (p.businessDocVerified) list.push("Business credentials");
  if (p.fssaiVerified) list.push("FSSAI on file");
  if (p.socialVerified) list.push("Social matched");
  if (p.communityConfirmed) list.push("Community confirmed");
  if (ownershipStatus === "UNCLAIMED") list.push("Community listing · unclaimed");
  return list;
}

export async function fetchPlaces(lat, lng) {
  const params = new URLSearchParams();
  if (lat != null) params.set("lat", lat);
  if (lng != null) params.set("lng", lng);
  const q = params.toString();
  const data = await api(`/api/places${q ? `?${q}` : ""}`);
  return (data || []).map(mapPlace);
}

export async function fetchPlace(id, lat, lng) {
  const params = new URLSearchParams();
  if (lat != null) params.set("lat", lat);
  if (lng != null) params.set("lng", lng);
  const q = params.toString();
  const data = await api(`/api/places/${id}${q ? `?${q}` : ""}`);
  return mapPlace(data);
}

export async function submitCommunityPlace(body) {
  const data = await api("/api/places/community", { method: "POST", auth: true, body });
  return mapPlace(data);
}

export async function claimPlace(id, body) {
  return api(`/api/places/${id}/claim`, { method: "POST", auth: true, body: body || {} });
}

export async function confirmPlaceInfo(id, checks) {
  const data = await api(`/api/places/${id}/confirm`, {
    method: "POST",
    auth: true,
    body: { checks },
  });
  return mapPlace(data);
}

export async function reportPlace(id, reason, note) {
  return api(`/api/places/${id}/report`, {
    method: "POST",
    auth: true,
    body: { reason, note },
  });
}

export async function fetchReviews(id) {
  return api(`/api/places/${id}/reviews`);
}

export async function submitReview(id, body) {
  return api(`/api/places/${id}/reviews`, { method: "POST", auth: true, body });
}

export async function fetchPlaceMedia(id) {
  return api(`/api/places/${id}/media`);
}

export async function submitPlaceMedia(id, url) {
  return api(`/api/places/${id}/media`, { method: "POST", auth: true, body: { url } });
}
