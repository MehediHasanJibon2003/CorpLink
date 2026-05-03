import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import { useNavigate } from "react-router-dom"
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  FolderKanban,
  Bell,
  ArrowRight,
  AlertCircle,
  TrendingUp,
  Zap,
  Users2,
  UserCircle,
  Radio,
} from "lucide-react"

// ─── Skeleton Loader ───────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg ${className}`} />
}

// ─── Stat Card ─────────────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, color, loading }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      ) : (
        <>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{title}</p>
        </>
      )}
    </div>
  )
}

// ─── Quick Link Card ───────────────────────────────────────────────
function QuickLink({ label, icon: Icon, path, color, navigate }) {
  return (
    <button
      onClick={() => navigate(path)}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border font-semibold text-sm transition-all hover:scale-[1.02] active:scale-100 ${color}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
      <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-60" />
    </button>
  )
}

// ─── Main Component ────────────────────────────────────────────────
function PersonalDashboard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [taskStats, setTaskStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 })
  const [notifications, setNotifications] = useState([])
  const [recentTasks, setRecentTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user?.id && profile?.company_id) {
      fetchDashboardData()
    }
  }, [user, profile])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch task stats for this employee (filtered by company + user)
      const { data: tasks, error: taskErr } = await supabase
        .from("tasks")
        .select("id, status, title, priority, deadline, created_at")
        .eq("assigned_to", user.id)
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false })

      if (taskErr) throw taskErr

      const total = tasks?.length || 0
      const pending = tasks?.filter(t => t.status === "pending").length || 0
      const inProgress = tasks?.filter(t => ["in_progress", "needs_review"].includes(t.status)).length || 0
      const completed = tasks?.filter(t => ["finished", "completed"].includes(t.status)).length || 0

      setTaskStats({ total, pending, inProgress, completed })
      setRecentTasks((tasks || []).slice(0, 4))

      // Fetch notifications (graceful — table may not exist)
      const { data: notifs } = await supabase
        .from("notifications")
        .select("id, message, type, is_read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3)

      setNotifications(notifs || [])
    } catch (err) {
      console.error("PersonalDashboard fetch error:", err)
      setError("Failed to load dashboard data.")
    } finally {
      setLoading(false)
    }
  }

  const priorityColor = {
    high: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    medium: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    low: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
  }

  const statusColor = {
    pending: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
    in_progress: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    needs_review: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
    finished: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    completed: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    rejected: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  }

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "Just now"
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="space-y-8">

      {/* ── Welcome Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20">
        {/* Decorative blobs */}
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-6 -left-4 w-28 h-28 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-4 w-4 text-blue-200" />
            <span className="text-blue-200 text-sm font-medium">Your Workspace</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Welcome back, {profile?.full_name || profile?.name || "Team Member"}! 👋
          </h1>
          <p className="text-blue-200 text-sm mt-1 max-w-md">
            Here's your productivity snapshot for today. Stay focused and keep crushing your goals.
          </p>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Tasks" value={taskStats.total} icon={CheckSquare} color="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" loading={loading} />
        <StatCard title="Pending" value={taskStats.pending} icon={Clock} color="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" loading={loading} />
        <StatCard title="In Progress" value={taskStats.inProgress} icon={TrendingUp} color="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" loading={loading} />
        <StatCard title="Completed" value={taskStats.completed} icon={CheckCircle2} color="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" loading={loading} />
      </div>

      {/* ── Two Column Layout ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Recent Tasks */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-blue-500" />
              Recent Tasks
            </h2>
            <button
              onClick={() => navigate("/employee/tasks")}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : recentTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <AlertCircle className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm font-medium">No tasks assigned yet</p>
              <p className="text-xs mt-1">Tasks assigned to you will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {recentTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{task.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {task.deadline ? `Due: ${new Date(task.deadline).toLocaleDateString()}` : "No deadline"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${priorityColor[task.priority] || priorityColor.low}`}>
                      {task.priority || "low"}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusColor[task.status] || statusColor.pending}`}>
                      {task.status?.replace("_", " ") || "pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Preview + Quick Links */}
        <div className="space-y-5">
          {/* Notifications */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm">
                <Bell className="h-4 w-4 text-orange-500" />
                Notifications
              </h2>
              <button
                onClick={() => navigate("/employee/notifications")}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                See all
              </button>
            </div>

            {loading ? (
              <div className="p-3 space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <Bell className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-xs text-center">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {notifications.map(n => (
                  <div key={n.id} className={`px-4 py-3 ${!n.is_read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
            <h2 className="font-bold text-slate-800 dark:text-white text-sm mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Quick Access
            </h2>
            <div className="space-y-2">
              <QuickLink label="My Tasks" icon={CheckSquare} path="/employee/tasks" color="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40" navigate={navigate} />
              <QuickLink label="My Projects" icon={FolderKanban} path="/employee/projects" color="bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40" navigate={navigate} />
              <QuickLink label="Company Feed" icon={Radio} path="/employee/feed" color="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40" navigate={navigate} />
              <QuickLink label="My Profile" icon={UserCircle} path="/employee/profile" color="bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700" navigate={navigate} />
            </div>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}
    </div>
  )
}

export default PersonalDashboard
