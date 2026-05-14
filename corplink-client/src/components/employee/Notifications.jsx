import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import {
  Bell,
  CheckCheck,
  Check,
  RefreshCw,
  AlertCircle,
  Info,
  CheckSquare,
  FolderKanban,
  Megaphone,
  Users2,
  Clock,
} from "lucide-react";

// ─── Skeleton ──────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg ${className}`}
    />
  );
}

// ─── Time Ago ──────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Notification Type Config ──────────────────────────────────────
const notifTypes = {
  task_assigned: {
    icon: CheckSquare,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-900/20",
  },
  task_update: {
    icon: RefreshCw,
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-900/20",
  },
  project_update: {
    icon: FolderKanban,
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  announcement: {
    icon: Megaphone,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-900/20",
  },
  collaboration: {
    icon: Users2,
    color: "text-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
  },
  approval: {
    icon: Check,
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-900/20",
  },
  general: {
    icon: Info,
    color: "text-slate-500",
    bg: "bg-slate-50 dark:bg-slate-700",
  },
};

// ─── Main Component ────────────────────────────────────────────────
function Notifications() {
  const { user, profile } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: err } = await supabase
        .from("notifications")
        .select("id, message, type, is_read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (err) throw err;
      setNotifications(data || []);
    } catch (err) {
      // Table might not exist yet
      if (err.code === "42P01") {
        setError("Notifications table not configured yet.");
      } else {
        console.error("Notifications error:", err);
        setError("Failed to load notifications.");
      }
    } finally {
      setLoading(false);
    }
  }, [user, refreshKey]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Realtime subscription for live updates ──────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  };

  const markAllAsRead = async () => {
    if (markingAll) return;
    setMarkingAll(true);
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length > 0) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", unreadIds);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
    setMarkingAll(false);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 md:gap-8">
        <div>
          <h1 className="text-heading-1 md:text-5xl font-black text-slate-900 dark:text-white flex items-center gap-4 tracking-tight">
            <Bell className="h-8 w-8 text-orange-500" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-body md:text-heading-3 font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-body md:text-heading-2 text-slate-500 dark:text-slate-400 mt-2 font-bold">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "All caught up!"}
          </p>
        </div>
        <div className="flex gap-4">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={markingAll}
              className="flex items-center gap-3 text-body md:text-heading-3 font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-full border-2 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
            >
              <CheckCheck className="h-5 w-5 md:h-6 md:w-6" />
              {markingAll ? "Marking..." : "Mark All Read"}
            </button>
          )}
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="flex items-center gap-3 text-body md:text-heading-3 font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-full border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw className="h-5 w-5 md:h-6 md:w-6" />
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-amber-500 text-center px-6">
            <AlertCircle className="h-16 w-16 mb-4 opacity-70" />
            <p className="font-black text-heading-2 md:text-heading-1 text-amber-700 dark:text-amber-400">
              {error}
            </p>
            <p className="text-body md:text-heading-3 font-medium text-slate-400 mt-4">
              Ask your admin to set up the notifications table in Supabase.
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400 text-center px-6">
            <Bell className="h-20 w-20 mb-6 opacity-20" />
            <h3 className="font-black text-slate-600 dark:text-slate-300 text-heading-1 md:text-heading-1">
              No Notifications
            </h3>
            <p className="text-heading-3 mt-4 max-w-md font-medium">
              When you receive notifications about tasks, projects, or
              announcements, they'll appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y-2 divide-slate-100 dark:divide-slate-700/50">
            {notifications.map((notif) => {
              const tConf = notifTypes[notif.type] || notifTypes.general;
              const Icon = tConf.icon;
              return (
                <div
                  key={notif.id}
                  className={`flex flex-col md:flex-row md:items-center gap-6 px-8 md:px-12 py-8 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-default ${
                    !notif.is_read ? "bg-blue-50/40 dark:bg-blue-900/10" : ""
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-[1.2rem] flex items-center justify-center shrink-0 ${tConf.bg}`}
                  >
                    <Icon className={`h-7 w-7 md:h-8 md:w-8 ${tConf.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-body md:text-heading-2 leading-relaxed ${
                        notif.is_read
                          ? "text-slate-600 dark:text-slate-400 font-medium"
                          : "text-slate-800 dark:text-slate-100 font-black"
                      }`}
                    >
                      {notif.message}
                    </p>
                    <p className="flex items-center gap-2 text-label md:text-body font-bold uppercase tracking-widest text-slate-400 mt-3 border-l-2 border-slate-200 dark:border-slate-700 pl-4">
                      <Clock className="h-4 w-4" />
                      {timeAgo(notif.created_at)}
                    </p>
                  </div>

                  {/* Mark as read */}
                  {!notif.is_read && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      title="Mark as read"
                      className="shrink-0 p-3 md:p-4 rounded-xl text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition hover:scale-110"
                    >
                      <Check className="h-5 w-5 md:h-6 md:w-6" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;

