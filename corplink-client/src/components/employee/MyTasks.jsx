import { useEffect, useState, useCallback } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import {
  CheckSquare,
  Search,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Filter,
  ChevronDown,
  RefreshCw,
} from "lucide-react"
import TaskUpdateModal from "./TaskUpdateModal"

// ─── Skeleton ──────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg ${className}`} />
}

// ─── Priority Badge ────────────────────────────────────────────────
const priorityConfig = {
  high: { label: "High", class: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" },
  medium: { label: "Medium", class: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" },
  low: { label: "Low", class: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" },
}

// ─── Status Badge ──────────────────────────────────────────────────
const statusConfig = {
  pending: { label: "Pending", class: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300", icon: Clock },
  in_progress: { label: "In Progress", class: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400", icon: RefreshCw },
  needs_review: { label: "Needs Review", class: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400", icon: AlertCircle },
  finished: { label: "Completed", class: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400", icon: CheckCircle2 },
  completed: { label: "Completed", class: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400", icon: CheckCircle2 },
  rejected: { label: "Rejected", class: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400", icon: XCircle },
}

// ─── Main Component ────────────────────────────────────────────────
function MyTasks() {
  const { user, profile } = useAuth()

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

  // Modal
  const [selectedTask, setSelectedTask] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchTasks = useCallback(async () => {
    if (!user?.id || !profile?.company_id) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from("tasks")
        .select("*")
        .eq("assigned_to", user.id)
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false })

      if (err) throw err
      setTasks(data || [])
    } catch (err) {
      console.error("MyTasks fetch error:", err)
      setError("Failed to load tasks. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [user, profile, refreshKey])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Computed filtered list
  const filteredTasks = tasks.filter(task => {
    const matchSearch = task.title?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === "all" || task.status === statusFilter
    const matchPriority = priorityFilter === "all" || task.priority === priorityFilter
    return matchSearch && matchStatus && matchPriority
  })

  const statusGroups = ["all", "pending", "in_progress", "needs_review", "finished", "rejected"]
  const priorityGroups = ["all", "high", "medium", "low"]

  const isOverdue = (task) => {
    if (!task.deadline || ["finished", "completed"].includes(task.status)) return false
    return new Date(task.deadline) < new Date()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-blue-500" />
            My Tasks
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} assigned to you
          </p>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by task name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer min-w-[140px]"
            >
              {statusGroups.map(s => (
                <option key={s} value={s}>{s === "all" ? "All Statuses" : statusConfig[s]?.label || s}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="pl-4 pr-9 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer min-w-[140px]"
            >
              {priorityGroups.map(p => (
                <option key={p} value={p}>{p === "all" ? "All Priorities" : priorityConfig[p]?.label || p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-red-500">
            <AlertCircle className="h-10 w-10 mb-2 opacity-70" />
            <p className="font-medium text-sm">{error}</p>
            <button onClick={fetchTasks} className="mt-3 text-xs text-blue-600 hover:underline">Try again</button>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <CheckSquare className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No tasks found</p>
            <p className="text-sm mt-1">
              {tasks.length === 0
                ? "You have no tasks assigned yet."
                : "Try adjusting your filters."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {filteredTasks.map(task => {
              const pConf = priorityConfig[task.priority] || priorityConfig.low
              const sConf = statusConfig[task.status] || statusConfig.pending
              const StatusIcon = sConf.icon
              const overdue = isOverdue(task)

              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group"
                >
                  {/* Left: Task info */}
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Priority indicator bar */}
                    <div className={`w-1 h-10 rounded-full shrink-0 mt-0.5 ${
                      task.priority === "high" ? "bg-red-500" :
                      task.priority === "medium" ? "bg-amber-500" :
                      "bg-green-500"
                    }`} />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${pConf.class}`}>
                          {pConf.label}
                        </span>
                        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${sConf.class}`}>
                          <StatusIcon className="h-2.5 w-2.5" />
                          {sConf.label}
                        </span>
                        {task.deadline && (
                          <span className={`flex items-center gap-1 text-[10px] font-medium ${overdue ? "text-red-500" : "text-slate-400"}`}>
                            <Clock className="h-3 w-3" />
                            {overdue ? "Overdue — " : "Due: "}
                            {new Date(task.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Update button */}
                  {!["finished", "completed", "rejected"].includes(task.status) && (
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="ml-4 shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-sm shadow-blue-500/20"
                    >
                      Update
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Task Update Modal */}
      {selectedTask && (
        <TaskUpdateModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSuccess={() => {
            setSelectedTask(null)
            setRefreshKey(k => k + 1)
          }}
        />
      )}
    </div>
  )
}

export default MyTasks
