import { api } from "./client";
import { getOrCreateSessionId } from "../utils/preferences";

const QUEUE_KEY = "wandr_analytics_queue";

function readQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeQueue(items) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(-100)));
}

/**
 * Fire-and-forget analytics. Queues locally if the API is down.
 * eventType: place_view | menu_view | save_place | share_place | direction_click
 *   | call_click | search | filter_used | review_submit | taste_pref
 */
export async function trackEvent(eventType, { placeId = null, source = null, metadata = {} } = {}) {
  const payload = {
    eventType,
    placeId: placeId != null ? Number(placeId) || null : null,
    source,
    sessionId: getOrCreateSessionId(),
    device: typeof navigator !== "undefined" ? navigator.userAgent?.slice(0, 180) : null,
    metadata: typeof metadata === "string" ? metadata : JSON.stringify(metadata || {}),
  };

  try {
    await api("/api/analytics/events", {
      method: "POST",
      body: payload,
      auth: true, // token sent if present; endpoint also allows anonymous
    });
    flushQueue();
  } catch {
    const q = readQueue();
    q.push({ ...payload, queuedAt: Date.now() });
    writeQueue(q);
  }
}

async function flushQueue() {
  const q = readQueue();
  if (!q.length) return;
  const remaining = [];
  for (const item of q) {
    try {
      await api("/api/analytics/events", { method: "POST", body: item, auth: true });
    } catch {
      remaining.push(item);
    }
  }
  writeQueue(remaining);
}
