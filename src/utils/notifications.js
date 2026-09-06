/** Resolve in-app deep link from notification type + entity fields. */
export function notificationHref(n) {
  const type = String(n?.type || "");
  const entityId = n?.entityId ?? (n?.data && /^\d+$/.test(String(n.data)) ? Number(n.data) : null);

  switch (type) {
    case "NEW_REVIEW":
      return entityId ? `/cafe/${entityId}#reviews` : "/notifications";
    case "LISTING_APPROVED":
    case "CAFE_APPROVED":
      return entityId ? `/owner/edit-cafe/${entityId}` : "/owner/dashboard";
    case "LISTING_REJECTED":
    case "CAFE_REJECTED":
      return entityId ? `/owner/edit-cafe/${entityId}` : "/owner/dashboard";
    case "CLAIM_APPROVED":
    case "CLAIM_REJECTED":
      return entityId ? `/cafe/${entityId}` : "/owner/dashboard";
    case "PASSWORD_CHANGED":
    case "NEW_LOGIN":
    case "EMAIL_CHANGED":
      return "/profile";
    default:
      return entityId ? `/cafe/${entityId}` : "/notifications";
  }
}

export function formatNotificationTime(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function notificationTypeLabel(type) {
  switch (String(type || "")) {
    case "NEW_REVIEW":
      return "New review";
    case "CLAIM_APPROVED":
      return "Claim approved";
    case "CLAIM_REJECTED":
      return "Claim rejected";
    case "LISTING_APPROVED":
    case "CAFE_APPROVED":
      return "Listing approved";
    case "LISTING_REJECTED":
    case "CAFE_REJECTED":
      return "Listing rejected";
    case "PASSWORD_CHANGED":
      return "Password changed";
    case "NEW_LOGIN":
      return "New sign-in";
    case "EMAIL_CHANGED":
      return "Email changed";
    default:
      return "Update";
  }
}
