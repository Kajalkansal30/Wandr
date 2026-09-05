/** Demo Spotted videos when API/DB is unavailable (URL-first, no Firebase). */
import mockCafes from "./cafes";

const SAMPLE_VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
];

function placeCard(cafe, distance) {
  if (!cafe) return null;
  return {
    id: String(cafe.id),
    name: cafe.name,
    address: cafe.address,
    city: cafe.city,
    lat: cafe.lat,
    lng: cafe.lng,
    rating: cafe.rating,
    priceLevel: cafe.priceLevel,
    avgCostForTwo: cafe.avgCostForTwo,
    operatingStatus: cafe.operatingStatus || "OPEN",
    openedDaysAgo: cafe.openedDaysAgo,
    image: cafe.image,
    distance: distance ?? cafe.distance ?? null,
  };
}

const SEED = [
  {
    id: "demo-spot-1",
    placeId: "1",
    url: SAMPLE_VIDEOS[0],
    spotKind: "AMBIENCE",
    caption: "Quiet pour-overs and soft light — worth discovering in Hauz Khas.",
    likeCount: 42,
    likedByMe: false,
    status: "APPROVED",
    mediaType: "VIDEO",
  },
  {
    id: "demo-spot-2",
    placeId: "2",
    url: SAMPLE_VIDEOS[1],
    spotKind: "HIDDEN_GEM",
    caption: "A tiny garden café that still feels under the radar.",
    likeCount: 88,
    likedByMe: false,
    status: "APPROVED",
    mediaType: "VIDEO",
  },
  {
    id: "demo-spot-3",
    placeId: "3",
    url: SAMPLE_VIDEOS[2],
    spotKind: "FOOD",
    caption: "Single-origin flat whites and a work-friendly corner.",
    likeCount: 31,
    likedByMe: false,
    status: "APPROVED",
    mediaType: "VIDEO",
  },
  {
    id: "demo-spot-4",
    placeId: "4",
    url: SAMPLE_VIDEOS[3],
    spotKind: "NEW_MENU",
    caption: "New pistachio tiramisu just landed.",
    likeCount: 56,
    likedByMe: false,
    status: "APPROVED",
    mediaType: "VIDEO",
  },
  {
    id: "demo-spot-5",
    placeId: "1",
    url: SAMPLE_VIDEOS[4],
    spotKind: "NEW_CAFE",
    caption: "Freshly opened — still finding its rhythm.",
    likeCount: 19,
    likedByMe: false,
    status: "APPROVED",
    mediaType: "VIDEO",
  },
].map((s) => {
  const cafe = mockCafes.find((c) => String(c.id) === String(s.placeId));
  return {
    ...s,
    userId: null,
    thumbnailUrl: null,
    durationSec: 15,
    source: "COMMUNITY",
    createdAt: new Date().toISOString(),
    place: placeCard(cafe),
  };
});

const LOCAL_KEY = "wandr_demo_spots";

function loadLocalSpots() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalSpots(list) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
}

export function getDemoSpots({ filter = "all", lat, lng } = {}) {
  const local = loadLocalSpots();
  let list = [...local, ...SEED.filter((s) => !local.some((l) => l.id === s.id))];

  if (filter === "new") {
    list = list.filter(
      (s) =>
        s.spotKind === "NEW_CAFE" ||
        (s.place?.openedDaysAgo != null && s.place.openedDaysAgo <= 14)
    );
  }
  if (filter === "nearby" && lat != null && lng != null) {
    list = list
      .map((s) => {
        const dist = haversine(lat, lng, s.place?.lat, s.place?.lng);
        return {
          ...s,
          place: s.place ? { ...s.place, distance: dist } : s.place,
        };
      })
      .filter((s) => s.place?.distance != null && s.place.distance <= 5)
      .sort((a, b) => (a.place.distance || 99) - (b.place.distance || 99));
  }

  return list;
}

export function getDemoSpotsForPlace(placeId) {
  return getDemoSpots().filter((s) => String(s.placeId) === String(placeId));
}

export function addDemoSpot({ placeId, url, caption, spotKind, place }) {
  const spot = {
    id: `demo-spot-${Date.now()}`,
    placeId: String(placeId),
    userId: null,
    url,
    thumbnailUrl: null,
    mediaType: "VIDEO",
    spotKind,
    caption,
    durationSec: null,
    likeCount: 0,
    likedByMe: false,
    source: "COMMUNITY",
    status: "APPROVED",
    createdAt: new Date().toISOString(),
    place: placeCard(place) || placeCard(mockCafes.find((c) => String(c.id) === String(placeId))),
  };
  const next = [spot, ...loadLocalSpots()];
  saveLocalSpots(next);
  return spot;
}

export function toggleDemoLike(id) {
  const update = (list) =>
    list.map((s) => {
      if (String(s.id) !== String(id)) return s;
      const liked = !s.likedByMe;
      return {
        ...s,
        likedByMe: liked,
        likeCount: Math.max(0, (s.likeCount || 0) + (liked ? 1 : -1)),
      };
    });
  const local = update(loadLocalSpots());
  saveLocalSpots(local);
  const all = getDemoSpots();
  const hit = all.find((s) => String(s.id) === String(id));
  return { liked: Boolean(hit?.likedByMe), likeCount: hit?.likeCount ?? 0 };
}

function haversine(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const r = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
