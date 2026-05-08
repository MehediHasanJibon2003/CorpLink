import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
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
  Paperclip,
} from "lucide-react";
import TaskUpdateModal from "./TaskUpdateModal";

// ─── Skeleton ──────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg ${className}`}
    />
  );
}

// ─── Priority Badge ────────────────────────────────────────────────
const priorityConfig = {
  high: {
    label: "High",
    class: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  },
  medium: {
    label: "Medium",
    class:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  },
  low: {
    label: "Low",
    class:
      "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
  },
};

// ─── Status Badge ──────────────────────────────────────────────────
const statusConfig = {
  pending: {
    label: "Pending",
    class: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
    icon: Clock,
  },
  in_progress: {
    label: "In Progress",
    class: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    icon: RefreshCw,
  },
  needs_review: {
    label: "Needs Review",
    class:
      "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
    icon: AlertCircle,
  },
  finished: {
    label: "Completed",
    class:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  completed: {
    label: "Completed",
    class:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    class: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    icon: XCircle,
  },
};

// ─── Main Component ────────────────────────────────────────────────
function MyTasks() {
  const { user, profile } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchTasks = useCallback(async () => {
    if (!user?.id || !profile?.company_id) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch tasks
      const { data: tasksData, error: err } = await supabase
        .from("tasks")
        .select("*")
        .eq("assigned_to", profile?.employee_id || user.id)
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false });

      if (err) throw err;

      // 2. Fetch attachment counts
      const taskIds = (tasksData || []).map((t) => t.id);
      let countsMap = {};

      if (taskIds.length > 0) {
        const { data: attData } = await supabase
          .from("task_attachments")
          .select("id, task_id")
          .in("task_id", taskIds);

        attData?.forEach((a) => {
          countsMap[a.task_id] = (countsMap[a.task_id] || 0) + 1;
        });
      }

      const enrichedTasks = (tasksData || []).map((t) => ({
        ...t,
        attachmentCount: countsMap[t.id] || 0,
      }));

      setTasks(enrichedTasks);
    } catch (err) {
      console.error("MyTasks fetch error:", err);
      setError("Failed to load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user, profile, refreshKey]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Computed filtered list
  const filteredTasks = tasks.filter((task) => {
    const matchSearch = task.title
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || task.status === statusFilter;
    const matchPriority =
      priorityFilter === "all" || task.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const statusGroups = [
    "all",
    "pending",
    "in_progress",
    "needs_review",
    "finished",
    "rejected",
  ];
  const priorityGroups = ["all", "high", "medium", "low"];

  const isOverdue = (task) => {
    if (!task.deadline || ["finished", "completed"].includes(task.status))
      return false;
    return new Date(task.deadline) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 md:gap-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white flex items-center gap-4 tracking-tight">
            <CheckSquare className="h-8 w-8 text-blue-500" />
            My Tasks
          </h1>
          <p className="text-base md:text-xl text-slate-500 dark:text-slate-400 mt-2 font-bold uppercase tracking-widest">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} assigned to you
          </p>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="flex items-center gap-3 text-sm md:text-lg font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-full border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition"
        >
          <RefreshCw className="h-5 w-5 md:h-6 md:w-6" />
          Refresh
        </button>
      </div>

      {/* Filters Bar */}
      <div className="border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl md:rounded-[2.5rem] shadow-sm p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by task name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 md:py-5 text-lg bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:ring-4 focus:ring-blue-500/20 font-bold transition"
            />
          </div>

          {/* Status Filter */}
          <div className="relative flex-1 md:flex-initial">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 md:h-6 md:w-6 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-auto pl-14 pr-10 py-4 md:py-5 text-base md:text-lg font-bold bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/20 appearance-none cursor-pointer"
            >
              {statusGroups.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All Statuses" : statusConfig[s]?.label || s}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] shadow-sm overflow-hidden">
        {loading && tasks.length === 0 ? (
          <div className="p-8 space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-red-500 text-center px-4">
            <AlertCircle className="h-16 w-16 mb-4 opacity-70" />
            <p className="font-bold text-lg md:text-xl">{error}</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <CheckSquare className="h-20 w-20 mb-6 opacity-30" />
            <h3 className="font-black text-2xl text-slate-600 dark:text-slate-300">
              No tasks found
            </h3>
          </div>
        ) : (
          <div className="divide-y-2 divide-slate-100 dark:divide-slate-700/50">
            {filteredTasks.map((task) => {
              const pConf = priorityConfig[task.priority] || priorityConfig.low;
              const sConf = statusConfig[task.status] || statusConfig.pending;
              const StatusIcon = sConf.icon;
              const overdue = isOverdue(task);

              return (
                <div
                  key={task.id}
                  className="flex flex-col md:flex-row md:items-center justify-between px-8 md:px-12 py-8 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group gap-6"
                >
                  <div className="flex items-start gap-6 min-w-0">
                    <div
                      className={`w-2 h-16 md:h-20 rounded-full shrink-0 mt-1 ${
                        task.priority === "high"
                          ? "bg-red-500"
                          : task.priority === "medium"
                            ? "bg-amber-500"
                            : "bg-green-500"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="font-black text-slate-800 dark:text-slate-100 text-lg md:text-2xl group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {task.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 mt-4">
                        <span
                          className={`flex items-center gap-1.5 text-[10px] md:text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest ${pConf.class}`}
                        >
                          {pConf.label}
                        </span>
                        <span
                          className={`flex items-center gap-1.5 text-[10px] md:text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest ${sConf.class}`}
                        >
                          <StatusIcon className="h-4 w-4" />
                          {sConf.label}
                        </span>
                        {task.attachmentCount > 0 && (
                          <span className="flex items-center gap-1 text-[10px] md:text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full uppercase tracking-widest">
                            <Paperclip className="h-3.5 w-3.5" />
                            {task.attachmentCount}
                          </span>
                        )}
                        {task.deadline && (
                          <span
                            className={`flex items-center gap-2 text-[10px] md:text-xs font-black border-l-2 border-slate-200 dark:border-slate-700 pl-4 uppercase tracking-widest ${overdue ? "text-red-500" : "text-slate-400"}`}
                          >
                            <Clock className="h-4 w-4" />
                            {new Date(task.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedTask(task)}
                    className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-black uppercase tracking-widest px-6 py-4 rounded-xl md:rounded-full transition shadow-md shadow-blue-500/20"
                  >
                    Manage Workspace
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskUpdateModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSuccess={() => {
            setSelectedTask(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

export default MyTasks;
