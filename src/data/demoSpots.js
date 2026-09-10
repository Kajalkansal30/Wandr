/** Demo Spotted videos — real playable MP4s (Mixkit café clips) for empty feeds / API fallback. */
import mockCafes from "./cafes";

/** Café-themed stock clips + posters (public HTTPS MP4s). */
const DEMO_CLIPS = [
  {
    url: "https://assets.mixkit.co/videos/5590/5590-720.mp4",
    thumbnailUrl: "https://assets.mixkit.co/videos/5590/5590-thumb-720-0.jpg",
  },
  {
    url: "https://assets.mixkit.co/videos/5569/5569-720.mp4",
    thumbnailUrl: "https://assets.mixkit.co/videos/5569/5569-thumb-720-0.jpg",
  },
  {
    url: "https://assets.mixkit.co/videos/3577/3577-720.mp4",
    thumbnailUrl: "https://assets.mixkit.co/videos/3577/3577-thumb-720-0.jpg",
  },
  {
    url: "https://assets.mixkit.co/videos/46567/46567-720.mp4",
    thumbnailUrl: "https://assets.mixkit.co/videos/46567/46567-thumb-720-0.jpg",
  },
  {
    url: "https://assets.mixkit.co/videos/43372/43372-720.mp4",
    thumbnailUrl: "https://assets.mixkit.co/videos/43372/43372-thumb-720-0.jpg",
  },
  {
    url: "https://assets.mixkit.co/videos/5590/5590-720.mp4",
    thumbnailUrl: "https://assets.mixkit.co/videos/5590/5590-thumb-720-0.jpg",
  },
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
    tags: cafe.tags || [],
    bestFor: cafe.bestFor || [],
    category: cafe.category,
    distance: distance ?? cafe.distance ?? null,
  };
}

const SEED = [
  {
    id: "demo-spot-1",
    placeId: "1",
    ...DEMO_CLIPS[0],
    spotKind: "AMBIENCE",
    caption: "Quiet pour-overs and soft light — worth discovering in Hauz Khas.",
    likeCount: 42,
  },
  {
    id: "demo-spot-2",
    placeId: "2",
    ...DEMO_CLIPS[1],
    spotKind: "HIDDEN_GEM",
    caption: "A tiny garden café that still feels under the radar.",
    likeCount: 88,
  },
  {
    id: "demo-spot-3",
    placeId: "3",
    ...DEMO_CLIPS[2],
    spotKind: "FOOD",
    caption: "Espresso machine steam and single-origin flat whites.",
    likeCount: 31,
  },
  {
    id: "demo-spot-4",
    placeId: "4",
    ...DEMO_CLIPS[3],
    spotKind: "NEW_MENU",
    caption: "New pistachio tiramisu just landed — dessert hour.",
    likeCount: 56,
  },
  {
    id: "demo-spot-5",
    placeId: "1",
    ...DEMO_CLIPS[4],
    spotKind: "NEW_CAFE",
    caption: "Morning coffee ritual — freshly opened spot finding its rhythm.",
    likeCount: 19,
  },
  {
    id: "demo-spot-6",
    placeId: "3",
    ...DEMO_CLIPS[5],
    spotKind: "EXPERIENCE",
    caption: "Laptop-friendly corner with a proper barista pour.",
    likeCount: 27,
  },
].map((s) => {
  const cafe = mockCafes.find((c) => String(c.id) === String(s.placeId));
  return {
    ...s,
    likedByMe: false,
    status: "APPROVED",
    mediaType: "VIDEO",
    userId: null,
    durationSec: 12,
    source: "COMMUNITY",
    createdAt: new Date(Date.now() - Math.random() * 3 * 86400000).toISOString(),
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

export function addDemoSpot({ placeId, url, thumbnailUrl, caption, spotKind, place }) {
  const spot = {
    id: `demo-spot-${Date.now()}`,
    placeId: String(placeId),
    userId: null,
    url,
    thumbnailUrl: thumbnailUrl || null,
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
