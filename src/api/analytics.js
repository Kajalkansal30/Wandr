import { api } from "./client";
import { getOrCreateSessionId } from "../utils/preferences";

const QUEUE_KEY = "wandr_analytics_queue";
const MAX_QUEUE = 100;
const BATCH_SIZE = 10;
let flushing = false;
let backoffMs = 0;

function readQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeQueue(items) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(-MAX_QUEUE)));
}

/**
 * Fire-and-forget analytics. Queues locally if the API is down.
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
      auth: true,
      timeoutMs: 5000,
    });
    backoffMs = 0;
    flushQueue();
  } catch {
    const q = readQueue();
    q.push({ ...payload, queuedAt: Date.now() });
    writeQueue(q);
  }
}

export async function flushQueue() {
  if (flushing) return;
  const q = readQueue();
  if (!q.length) return;
  if (backoffMs > 0) {
    await new Promise((r) => setTimeout(r, backoffMs));
  }
  flushing = true;
  const remaining = [];
  const batch = q.slice(0, BATCH_SIZE);
  const rest = q.slice(BATCH_SIZE);
  try {
    for (const item of batch) {
      try {
        await api("/api/analytics/events", {
          method: "POST",
          body: item,
          auth: true,
          timeoutMs: 5000,
        });
      } catch {
        remaining.push(item);
      }
    }
    writeQueue([...remaining, ...rest]);
    if (remaining.length) {
      backoffMs = Math.min(30_000, Math.max(1000, (backoffMs || 500) * 2));
    } else {
      backoffMs = 0;
      if (rest.length) {
        flushing = false;
        return flushQueue();
      }
    }
  } finally {
    flushing = false;
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => flushQueue());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") flushQueue();
  });
  setTimeout(() => flushQueue(), 2000);
}
