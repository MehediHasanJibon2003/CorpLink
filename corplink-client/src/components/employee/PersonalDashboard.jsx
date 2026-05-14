import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";

// ─── Skeleton Loader ───────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg ${className}`}
    />
  );
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
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <p className="text-heading-1 font-extrabold text-slate-900 dark:text-white">
            {value}
          </p>
          <p className="text-body text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            {title}
          </p>
        </>
      )}
    </div>
  );
}

// ─── Quick Link Card ───────────────────────────────────────────────
function QuickLink({ label, icon: Icon, path, color, navigate }) {
  return (
    <button
      onClick={() => navigate(path)}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border font-semibold text-body transition-all hover:scale-[1.02] active:scale-100 ${color}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
      <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-60" />
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────
function PersonalDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [taskStats, setTaskStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });
  const [notifications, setNotifications] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.id && profile?.company_id) {
      fetchDashboardData();
    }
  }, [user, profile]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch task stats for this employee (filtered by company + user)
      const { data: tasks, error: taskErr } = await supabase
        .from("tasks")
        .select("id, status, title, priority, deadline, created_at")
        .eq("assigned_to", profile.employee_id || user.id)
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false });

      if (taskErr) throw taskErr;

      const total = tasks?.length || 0;
      const pending = tasks?.filter((t) => t.status === "pending").length || 0;
      const inProgress =
        tasks?.filter((t) => ["in_progress", "needs_review"].includes(t.status))
          .length || 0;
      const completed =
        tasks?.filter((t) => ["finished", "completed"].includes(t.status))
          .length || 0;

      setTaskStats({ total, pending, inProgress, completed });
      setRecentTasks((tasks || []).slice(0, 4));

      // Fetch user's own activity
      const { data: ownActivities } = await supabase
        .from("activity_logs")
        .select("id, action, entity, created_at")
        .eq("user_id", user.id)
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false })
        .limit(5);
      
      setActivities(ownActivities || []);

      // Fetch notifications (graceful — table may not exist)
      const { data: notifs } = await supabase
        .from("notifications")
        .select("id, message, type, is_read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      setNotifications(notifs || []);
    } catch (err) {
      console.error("PersonalDashboard fetch error:", err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const priorityColor = {
    high: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    medium:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    low: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
  };

  const statusColor = {
    pending:
      "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
    in_progress:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    needs_review:
      "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
    finished:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    completed:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    rejected: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="space-y-8">
      {/* ── Welcome Banner & Profile Quick View ── */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 md:p-8 text-white shadow-lg shadow-blue-500/20 flex flex-col justify-center">
          {/* Decorative blobs */}
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute -bottom-6 -left-4 w-28 h-28 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-blue-200" />
              <span className="text-blue-200 text-body font-medium uppercase tracking-widest">
                Personal Dashboard
              </span>
            </div>
            <h1 className="text-heading-1 md:text-heading-1 font-extrabold tracking-tight">
              Welcome back, {profile?.full_name?.split(" ")[0] || "Employee"}! 👋
            </h1>
            <p className="text-blue-100 text-body md:text-heading-3 mt-2 max-w-md font-medium leading-relaxed">
              You have <span className="font-black text-white">{taskStats.pending} pending tasks</span> that need your attention today.
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-heading-1 font-black text-white shadow-lg mb-4">
            {(profile?.full_name || "E").charAt(0).toUpperCase()}
          </div>
          <h3 className="text-heading-2 font-black text-slate-800 dark:text-white truncate w-full px-2">
            {profile?.full_name}
          </h3>
          <p className="text-label font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1">
            {profile?.role}
          </p>
          <button 
            onClick={() => navigate("/employee/profile")}
            className="mt-4 w-full py-3 bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 hover:text-white text-slate-600 dark:text-slate-300 rounded-xl font-black text-label uppercase tracking-widest transition-all"
          >
            Manage Profile
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        <StatCard
          title="Total Tasks"
          value={taskStats.total}
          icon={CheckSquare}
          color="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          loading={loading}
        />
        <StatCard
          title="Pending"
          value={taskStats.pending}
          icon={Clock}
          color="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
          loading={loading}
        />
        <StatCard
          title="In Progress"
          value={taskStats.inProgress}
          icon={TrendingUp}
          color="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
          loading={loading}
        />
        <StatCard
          title="Completed"
          value={taskStats.completed}
          icon={CheckCircle2}
          color="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
          loading={loading}
        />
      </div>

      {/* Performance Brief */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border-2 border-slate-100 dark:border-white/5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-blue-500/30 transition-all">
         <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-3xl bg-blue-600 text-white flex items-center justify-center shadow-2xl shadow-blue-500/20">
               <TrendingUp className="h-10 w-10" />
            </div>
            <div>
               <h3 className="text-heading-1 font-black text-slate-900 dark:text-white uppercase tracking-tight">Mission Performance</h3>
               <p className="text-body font-bold text-slate-400 uppercase tracking-widest mt-1">Operational Efficiency Overview</p>
            </div>
         </div>

         <div className="flex-1 max-w-md w-full px-4">
            <div className="flex justify-between items-end mb-3">
               <span className="text-label font-black text-slate-400 uppercase tracking-widest">Global Success Rate</span>
               <span className="text-heading-1 font-black text-blue-600">{taskStats.total > 0 ? Math.round((taskStats.completed/taskStats.total)*100) : 0}%</span>
            </div>
            <div className="h-4 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
               <div 
                 className="h-full bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)] transition-all duration-1000"
                 style={{ width: `${taskStats.total > 0 ? Math.round((taskStats.completed/taskStats.total)*100) : 0}%` }}
               />
            </div>
         </div>

         <button 
           onClick={() => navigate("/employee/performance")}
           className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-label hover:scale-105 active:scale-95 transition-all shadow-xl"
         >
           Detailed Intelligence
         </button>
      </div>

      {/* ── Main Layout ── */}
      <div className="grid lg:grid-cols-3 gap-8 md:gap-12">
        {/* Left Column: Recent Tasks & Activity */}
        <div className="lg:col-span-2 space-y-8 md:space-y-12">
          {/* Recent Tasks */}
          <div className="border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-8 md:px-12 py-6 border-b-2 border-slate-100 dark:border-slate-700">
              <h2 className="font-black text-heading-2 md:text-heading-1 text-slate-800 dark:text-white flex items-center gap-3">
                <CheckSquare className="h-6 w-6 text-blue-500" />
                Assigned Tasks
              </h2>
              <button
                onClick={() => navigate("/employee/tasks")}
                className="text-body md:text-heading-3 font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
              >
                View all <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {loading ? (
              <div className="p-8 space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : recentTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <AlertCircle className="h-16 w-16 mb-4 opacity-40" />
                <p className="text-heading-2 font-bold">No tasks assigned yet</p>
                <p className="text-body mt-2">
                  Tasks assigned to you will appear here
                </p>
              </div>
            ) : (
              <div className="divide-y-2 divide-slate-100 dark:divide-slate-700/50">
                {recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between px-8 md:px-12 py-6 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                    onClick={() => navigate("/employee/tasks")}
                  >
                    <div className="min-w-0">
                      <p className="text-heading-3 md:text-heading-2 font-bold text-slate-800 dark:text-slate-200 truncate">
                        {task.title}
                      </p>
                      <p className="text-body text-slate-500 dark:text-slate-400 mt-1 font-bold">
                        {task.deadline
                          ? `Due: ${new Date(task.deadline).toLocaleDateString()}`
                          : "No deadline"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-6 shrink-0">
                      <span
                        className={`text-[10px] md:text-label font-black px-3 py-1 rounded-full uppercase tracking-widest ${priorityColor[task.priority] || priorityColor.low}`}
                      >
                        {task.priority || "low"}
                      </span>
                      <span
                        className={`text-[10px] md:text-label font-black px-3 py-1 rounded-full capitalize tracking-widest ${statusColor[task.status] || statusColor.pending}`}
                      >
                        {task.status?.replace("_", " ") || "pending"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity History */}
          <div className="border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-8 md:px-12 py-6 border-b-2 border-slate-100 dark:border-slate-700">
              <h2 className="font-black text-heading-2 md:text-heading-1 text-slate-800 dark:text-white flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
                My Activity History
              </h2>
            </div>

            {loading ? (
              <div className="p-8 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Clock className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-heading-3 font-bold">No recent activity</p>
              </div>
            ) : (
              <div className="divide-y-2 divide-slate-100 dark:divide-slate-700/50">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center gap-6 px-8 md:px-12 py-6 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                      <Clock className="h-6 w-6 text-slate-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-body md:text-heading-3 font-bold text-slate-700 dark:text-slate-200 leading-tight">
                        {act.action}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                          {act.entity}
                        </span>
                        <span className="text-label font-bold text-slate-400">
                          {timeAgo(act.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Notifications & Quick Access */}
        <div className="space-y-8 md:space-y-12">
          {/* Notifications */}
          <div className="border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-8 py-6 border-b-2 border-slate-100 dark:border-slate-700">
              <h2 className="font-black text-heading-2 md:text-heading-1 text-slate-800 dark:text-white flex items-center gap-3">
                <Bell className="h-6 w-6 text-orange-500" />
                Notifications
              </h2>
              <button
                onClick={() => navigate("/employee/notifications")}
                className="text-body md:text-body font-black text-blue-600 dark:text-blue-400 hover:underline"
              >
                See all
              </button>
            </div>

            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center px-4">
                <Bell className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-body font-bold">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y-2 divide-slate-100 dark:divide-slate-700/50">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-8 py-5 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors ${!n.is_read ? "bg-blue-50/30 dark:bg-blue-900/10 border-l-4 border-blue-500" : ""}`}
                  >
                    <p className="text-body md:text-body font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                      {n.message}
                    </p>
                    <p className="text-label font-bold text-slate-400 mt-2 uppercase tracking-wider">
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Access */}
          <div className="border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] shadow-sm p-8 md:p-10">
            <h2 className="font-black text-heading-2 md:text-heading-1 text-slate-800 dark:text-white mb-6 flex items-center gap-3">
              <Zap className="h-6 w-6 text-yellow-500" />
              Quick Access
            </h2>
            <div className="space-y-4">
              <QuickLink
                label="Assigned Tasks"
                icon={CheckSquare}
                path="/employee/tasks"
                color="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                navigate={navigate}
              />
              <QuickLink
                label="My Projects"
                icon={FolderKanban}
                path="/employee/projects"
                color="bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40"
                navigate={navigate}
              />
              <QuickLink
                label="Company Feed"
                icon={Radio}
                path="/employee/feed"
                color="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                navigate={navigate}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-6 mt-8 bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-3xl md:rounded-[3rem] text-red-600 dark:text-red-400 text-heading-3 font-bold">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

export default PersonalDashboard;

