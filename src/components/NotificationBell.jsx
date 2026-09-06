import { useEffect, useState, useRef } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../api/notifications";
import { useAuth } from "../contexts/AuthContext";
import { formatNotificationTime, notificationHref } from "../utils/notifications";

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchUnreadCount()
      .then((res) => {
        if (!cancelled) setUnread(Number(res?.unread || 0));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, open]);

  useEffect(() => {
    if (!user || !open) return;
    let cancelled = false;
    fetchNotifications()
      .then((list) => {
        if (cancelled) return;
        setItems((list || []).slice(0, 8));
        setUnread((list || []).filter((n) => !n.readAt).length);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, open]);

  useEffect(() => {
    function onDoc(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!user) return null;

  async function onOpenItem(n) {
    try {
      if (!n.readAt) {
        await markNotificationRead(n.id);
        setItems((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x))
        );
        setUnread((u) => Math.max(0, u - 1));
      }
    } catch {
      /* ignore */
    }
    setOpen(false);
    navigate(notificationHref(n));
  }

  async function onReadAll() {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
      setUnread(0);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-warm-500 transition hover:bg-warm-50 hover:text-warm-700"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-terracotta-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-warm-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-warm-100 px-3 py-2">
            <p className="text-sm font-semibold text-warm-700">Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={onReadAll} className="text-xs font-medium text-warm-500 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-warm-400">No notifications yet</li>
            )}
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => onOpenItem(n)}
                  className={`block w-full px-3 py-2.5 text-left transition hover:bg-warm-50 ${n.readAt ? "opacity-70" : ""}`}
                >
                  <p className="text-sm font-medium text-warm-700">{n.title}</p>
                  <p className="mt-0.5 text-xs text-warm-400">{n.message}</p>
                  <p className="mt-1 text-[11px] text-warm-300">{formatNotificationTime(n.createdAt)}</p>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/notifications");
            }}
            className="block w-full border-t border-warm-100 px-3 py-2.5 text-center text-xs font-semibold text-warm-600 hover:bg-warm-50"
          >
            View all
          </button>
        </div>
      )}
    </div>
  );
}
