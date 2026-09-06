import { api } from "./client";

export async function fetchNotifications() {
  return api("/api/notifications", { auth: true });
}

export async function fetchUnreadCount() {
  return api("/api/notifications/unread-count", { auth: true });
}

export async function markNotificationRead(id) {
  return api(`/api/notifications/${id}/read`, { method: "POST", auth: true });
}

export async function markAllNotificationsRead() {
  return api("/api/notifications/read-all", { method: "POST", auth: true });
}
