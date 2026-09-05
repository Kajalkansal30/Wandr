const DEFAULTS = [
  { id: "want-to-visit", name: "Want to Visit", placeIds: [] },
  { id: "visited", name: "Visited", placeIds: [] },
  { id: "date-ideas", name: "Date Ideas", placeIds: [] },
  { id: "study-spots", name: "Study Spots", placeIds: [] },
];

function storageKey(uid) {
  return `wandr_collections:${uid || "guest"}`;
}

export function loadCollections(uid) {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (!raw) return DEFAULTS.map((d) => ({ ...d, placeIds: [] }));
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULTS.map((d) => ({ ...d, placeIds: [] }));
    }
    return parsed.map((c) => ({
      id: String(c.id),
      name: String(c.name || "Collection"),
      placeIds: Array.isArray(c.placeIds) ? c.placeIds.map(String) : [],
    }));
  } catch {
    return DEFAULTS.map((d) => ({ ...d, placeIds: [] }));
  }
}

export function saveCollections(uid, collections) {
  localStorage.setItem(storageKey(uid), JSON.stringify(collections));
}

export function createCollection(uid, name) {
  const list = loadCollections(uid);
  const next = [
    { id: `custom-${Date.now()}`, name: name.trim(), placeIds: [] },
    ...list,
  ];
  saveCollections(uid, next);
  return next;
}

export function renameCollection(uid, id, name) {
  const next = loadCollections(uid).map((c) =>
    c.id === id ? { ...c, name: name.trim() } : c
  );
  saveCollections(uid, next);
  return next;
}

export function deleteCollection(uid, id) {
  const next = loadCollections(uid).filter((c) => c.id !== id);
  saveCollections(uid, next);
  return next;
}

export function togglePlaceInCollection(uid, collectionId, placeId) {
  const pid = String(placeId);
  const next = loadCollections(uid).map((c) => {
    if (c.id !== collectionId) return c;
    const has = c.placeIds.includes(pid);
    return {
      ...c,
      placeIds: has ? c.placeIds.filter((x) => x !== pid) : [...c.placeIds, pid],
    };
  });
  saveCollections(uid, next);
  return next;
}

export function removePlaceFromAllCollections(uid, placeId) {
  const pid = String(placeId);
  const next = loadCollections(uid).map((c) => ({
    ...c,
    placeIds: c.placeIds.filter((x) => x !== pid),
  }));
  saveCollections(uid, next);
  return next;
}
