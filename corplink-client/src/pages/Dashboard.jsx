import { useEffect, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import AppLayout from "../components/layout/AppLayout"
import StatCard from "../components/dashboard/StatCard"
import TaskOverview from "../components/dashboard/TaskOverview"
import RecentActivity from "../components/dashboard/RecentActivity"

import { Users, Building2, FolderKanban, ListTodo, Clock, AlertCircle, CheckCircle2, XCircle, Plus, Activity } from "lucide-react"

function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    employees: 0,
    departments: 0,
    projects: 0,
    tasks: 0,
    pending: 0,
    inProgress: 0,
    needsReview: 0,
    finished: 0,
    rejected: 0,
  })

  const [activities, setActivities] = useState([])

  const fetchDashboardData = async () => {
    if (!profile?.company_id) return
    const cid = profile.company_id

    const { data: employees } = await supabase.from("employees").select("*").eq("company_id", cid)
    const { data: departments } = await supabase.from("departments").select("*").eq("company_id", cid)
    const { data: projects } = await supabase.from("projects").select("*").eq("company_id", cid)
    const { data: tasks } = await supabase.from("tasks").select("*").eq("company_id", cid)
    const { data: logs } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("company_id", cid)
      .order("created_at", { ascending: false })
      .limit(6)

    const pendingCount = tasks?.filter((t) => t.status === "pending").length || 0
    const inProgressCount = tasks?.filter((t) => t.status === "in_progress").length || 0
    const reviewCount = tasks?.filter((t) => t.status === "needs_review").length || 0
    const finishedCount = tasks?.filter((t) => t.status === "finished").length || 0
    const rejectedCount = tasks?.filter((t) => t.status === "rejected").length || 0

    setStats({
      employees: employees?.length || 0,
      departments: departments?.length || 0,
      projects: projects?.length || 0,
      tasks: tasks?.length || 0,
      pending: pendingCount,
      inProgress: inProgressCount,
      needsReview: reviewCount,
      finished: finishedCount,
      rejected: rejectedCount,
    })

    setActivities(logs || [])
  }

  useEffect(() => {
    if (profile?.company_id) fetchDashboardData()
  }, [profile?.company_id])

  // Only plain employees & restricted/interns go to the Employee Module
  const CORPORATE_ROLES = ["admin", "corporate_admin", "manager", "hr", "dept_head", "team_lead", "super_admin"]
  
  if (profile && !CORPORATE_ROLES.includes(profile.role)) {
    return <Navigate to="/employee/dashboard" replace />
  }

  return (
    <AppLayout
      title="Corporate Command Center"
      subtitle="Overview of your workspace performance and active metrics."
    >
      
      {/* Quick Actions Row */}
      <div className="flex gap-4 md:gap-6 mb-8 md:mb-12 overflow-x-auto pb-4 custom-scrollbar">
        <button className="flex items-center gap-2 md:gap-3 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-semibold md:font-bold text-sm md:text-lg shrink-0 transition shadow-lg shadow-blue-500/20 hover:-translate-y-0.5">
          <Plus className="h-5 w-5 md:h-6 md:w-6" /> Add Task
        </button>
        <button className="flex items-center gap-2 md:gap-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border md:border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-5 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-semibold md:font-bold text-sm md:text-lg shrink-0 transition hover:-translate-y-0.5">
          <Users className="h-5 w-5 md:h-6 md:w-6 text-slate-400" /> Invite Employee
        </button>
        <button className="flex items-center gap-2 md:gap-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border md:border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-5 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-semibold md:font-bold text-sm md:text-lg shrink-0 transition hover:-translate-y-0.5">
          <Building2 className="h-5 w-5 md:h-6 md:w-6 text-slate-400" /> New Department
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-10">
        <StatCard title="Total Employees" value={stats.employees} icon={Users} colorClass="bg-blue-50 text-blue-600" />
        <StatCard title="Active Departments" value={stats.departments} icon={Building2} colorClass="bg-indigo-50 text-indigo-600" />
        <StatCard title="Active Projects" value={stats.projects} icon={FolderKanban} colorClass="bg-purple-50 text-purple-600" />
        <StatCard title="Total Tasks" value={stats.tasks} icon={ListTodo} colorClass="bg-emerald-50 text-emerald-600" />
      </div>

      <div className="mt-8 md:mt-12">
        <h3 className="text-sm md:text-lg font-bold text-slate-500 uppercase tracking-wider mb-4 md:mb-6 px-1">Task Sub-Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
          <StatCard title="Pending" value={stats.pending} icon={Clock} colorClass="bg-amber-50 text-amber-600" />
          <StatCard title="In Progress" value={stats.inProgress} icon={Activity} colorClass="bg-blue-50 text-blue-600" />
          <StatCard title="Needs Review" value={stats.needsReview} icon={AlertCircle} colorClass="bg-orange-50 text-orange-600" />
          <StatCard title="Finished" value={stats.finished} icon={CheckCircle2} colorClass="bg-emerald-50 text-emerald-600" />
          <StatCard title="Rejected" value={stats.rejected} icon={XCircle} colorClass="bg-red-50 text-red-600" />
        </div>
      </div>

      <div className="grid xl:grid-cols-3 gap-6 lg:gap-10 mt-8 lg:mt-12">
        <div className="xl:col-span-2">
          <TaskOverview
            pending={stats.pending}
            inProgress={stats.inProgress}
            needsReview={stats.needsReview}
            finished={stats.finished}
            rejected={stats.rejected}
          />
        </div>

        <div>
          <RecentActivity activities={activities} />
        </div>
      </div>

    </AppLayout>
  )
}

export default Dashboard