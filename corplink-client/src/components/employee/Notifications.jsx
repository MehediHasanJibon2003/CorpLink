import { useEffect, useState, useCallback } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
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
} from "lucide-react"

// ─── Skeleton ──────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg ${className}`} />
}

// ─── Time Ago ──────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

// ─── Notification Type Config ──────────────────────────────────────
const notifTypes = {
  task_assigned: { icon: CheckSquare, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
  task_update: { icon: RefreshCw, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
  project_update: { icon: FolderKanban, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  announcement: { icon: Megaphone, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
  collaboration: { icon: Users2, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
  approval: { icon: Check, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
  general: { icon: Info, color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-700" },
}

// ─── Main Component ────────────────────────────────────────────────
function Notifications() {
  const { user, profile } = useAuth()

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [markingAll, setMarkingAll] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)

    try {
      const { data, error: err } = await supabase
        .from("notifications")
        .select("id, message, type, is_read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)

      if (err) throw err
      setNotifications(data || [])
    } catch (err) {
      // Table might not exist yet
      if (err.code === "42P01") {
        setError("Notifications table not configured yet.")
      } else {
        console.error("Notifications error:", err)
        setError("Failed to load notifications.")
      }
    } finally {
      setLoading(false)
    }
  }, [user, refreshKey])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // ── Realtime subscription for live updates ──────────────────────
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        setNotifications(prev => [payload.new, ...prev])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const markAsRead = async (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    )
    await supabase.from("notifications").update({ is_read: true }).eq("id", id)
  }

  const markAllAsRead = async () => {
    if (markingAll) return
    setMarkingAll(true)
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length > 0) {
      await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    }
    setMarkingAll(false)
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="h-6 w-6 text-orange-500" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={markingAll}
              className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
            >
              <CheckCheck className="h-4 w-4" />
              {markingAll ? "Marking..." : "Mark All Read"}
            </button>
          )}
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-amber-500 text-center px-6">
            <AlertCircle className="h-10 w-10 mb-3 opacity-70" />
            <p className="font-semibold text-sm text-amber-700 dark:text-amber-400">{error}</p>
            <p className="text-xs text-slate-400 mt-2">
              Ask your admin to set up the notifications table in Supabase.
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center px-6">
            <Bell className="h-14 w-14 mb-4 opacity-20" />
            <h3 className="font-bold text-slate-600 dark:text-slate-300 text-lg">No Notifications</h3>
            <p className="text-sm mt-2 max-w-xs">
              When you receive notifications about tasks, projects, or announcements, they'll appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {notifications.map(notif => {
              const tConf = notifTypes[notif.type] || notifTypes.general
              const Icon = tConf.icon
              return (
                <div
                  key={notif.id}
                  className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-default ${
                    !notif.is_read ? "bg-blue-50/40 dark:bg-blue-900/10" : ""
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tConf.bg}`}>
                    <Icon className={`h-4.5 w-4.5 ${tConf.color}`} style={{ width: 18, height: 18 }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${
                      notif.is_read
                        ? "text-slate-600 dark:text-slate-400 font-normal"
                        : "text-slate-800 dark:text-slate-100 font-semibold"
                    }`}>
                      {notif.message}
                    </p>
                    <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo(notif.created_at)}
                    </p>
                  </div>

                  {/* Mark as read */}
                  {!notif.is_read && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      title="Mark as read"
                      className="shrink-0 p-1.5 rounded-lg text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Notifications
