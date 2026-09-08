import { api } from "./client";

export async function fetchNotifications(page = 0, size = 50) {
  return api(`/api/notifications?page=${page}&size=${size}`, { auth: true });
}

export async function fetchUnreadCount() {
  return api("/api/notifications/unread-count", { auth: true });
}

export async function markNotificationRead(id: number) {
  return api(`/api/notifications/${id}/read`, { method: "POST", auth: true });
}

export async function markAllNotificationsRead() {
  return api("/api/notifications/read-all", { method: "POST", auth: true });
}

export async function registerPushToken(token: string, platform?: string) {
  return api("/api/notifications/push-token", {
    method: "POST",
    auth: true,
    body: { token, platform: platform || null },
  });
}

export async function unregisterPushToken(token: string) {
  return api("/api/notifications/push-token", {
    method: "DELETE",
    auth: true,
    body: { token },
  });
}
