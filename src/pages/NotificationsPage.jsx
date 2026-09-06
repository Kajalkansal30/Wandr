import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications";
import {
  formatNotificationTime,
  notificationHref,
  notificationTypeLabel,
} from "../utils/notifications";

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchNotifications()
      .then((list) => {
        if (!cancelled) {
          setItems(list || []);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Could not load notifications");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const visible = useMemo(() => {
    if (filter === "unread") return items.filter((n) => !n.readAt);
    return items;
  }, [items, filter]);

  async function onOpen(n) {
    try {
      if (!n.readAt) {
        await markNotificationRead(n.id);
        setItems((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x))
        );
      }
    } catch {
      /* still navigate */
    }
    navigate(notificationHref(n));
  }

  async function onReadAll() {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    } catch {
      /* ignore */
    }
  }

  if (!user) {
    return (
      <div className="page-shell page-with-nav pt-20 text-center">
        <Bell size={28} className="mx-auto mb-3 text-warm-300" />
        <h2 className="mb-2 text-xl font-bold text-warm-700">Notifications</h2>
        <p className="mb-6 text-sm text-warm-400">Sign in to see updates about your places and account.</p>
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="rounded-xl bg-warm-600 px-6 py-3 font-semibold text-white"
        >
          Sign In
        </button>
      </div>
    );
  }

  const unreadCount = items.filter((n) => !n.readAt).length;

  return (
    <div className="page-shell page-with-nav pt-6 md:pt-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm text-warm-500 transition hover:text-warm-600"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-warm-700" style={{ fontFamily: "var(--font-display)" }}>
          Notifications
        </h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onReadAll}
            className="text-xs font-medium text-warm-500 hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="mb-6 flex gap-2">
        {[
          { id: "all", label: "All" },
          { id: "unread", label: "Unread" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === tab.id
                ? "bg-warm-700 text-white"
                : "bg-warm-100 text-warm-500 hover:bg-warm-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-warm-400">Loading…</p>}
      {error && <p className="text-sm text-terracotta-500">{error}</p>}

      {!loading && !error && visible.length === 0 && (
        <p className="rounded-xl border border-dashed border-warm-200 bg-white p-6 text-center text-sm text-warm-400">
          {filter === "unread" ? "You're all caught up." : "No notifications yet."}
        </p>
      )}

      <ul className="divide-y divide-warm-100 border-y border-warm-100">
        {visible.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => onOpen(n)}
              className={`flex w-full gap-3 px-1 py-4 text-left transition hover:bg-warm-50 ${
                n.readAt ? "opacity-70" : ""
              }`}
            >
              <span
                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                  n.readAt ? "bg-transparent" : "bg-terracotta-500"
                }`}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold uppercase tracking-wide text-warm-400">
                  {notificationTypeLabel(n.type)}
                </span>
                <span className="mt-0.5 block text-sm font-medium text-warm-700">{n.title}</span>
                <span className="mt-0.5 block text-sm text-warm-500">{n.message}</span>
                <span className="mt-1 block text-xs text-warm-400">
                  {formatNotificationTime(n.createdAt)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
