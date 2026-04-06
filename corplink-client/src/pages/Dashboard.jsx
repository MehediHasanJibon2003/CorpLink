import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import AppLayout from "../components/layout/AppLayout"
import EmployeeDashboard from "./EmployeeDashboard"
import StatCard from "../components/dashboard/StatCard"
import TaskOverview from "../components/dashboard/TaskOverview"
import RecentActivity from "../components/dashboard/RecentActivity"

import { Users, Building2, FolderKanban, ListTodo, Clock, AlertCircle, CheckCircle2, XCircle, Plus, Activity } from "lucide-react"

function Dashboard() {
  const { profile } = useAuth()

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
    const { data: employees } = await supabase.from("employees").select("*")
    const { data: departments } = await supabase.from("departments").select("*")
    const { data: projects } = await supabase.from("projects").select("*")
    const { data: tasks } = await supabase.from("tasks").select("*")
    const { data: logs } = await supabase
      .from("activity_logs")
      .select("*")
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
    fetchDashboardData()
  }, [])

  // Basic Employees and restricted users get the EmployeeDashboard
  const isAdminView = ["admin", "corporate_admin", "manager", "hr"].includes(profile?.role);
  
  if (profile && !isAdminView) {
    return <EmployeeDashboard />
  }

  return (
    <AppLayout
      title="Corporate Command Center"
      subtitle="Overview of your workspace performance and active metrics."
    >
      
      {/* Quick Actions Row */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shrink-0 transition shadow-sm shadow-blue-500/20">
          <Plus className="h-4 w-4" /> Add Task
        </button>
        <button className="flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl font-medium shrink-0 transition">
          <Users className="h-4 w-4 text-slate-400" /> Invite Employee
        </button>
        <button className="flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl font-medium shrink-0 transition">
          <Building2 className="h-4 w-4 text-slate-400" /> New Department
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Employees" value={stats.employees} icon={Users} colorClass="bg-blue-50 text-blue-600" />
        <StatCard title="Active Departments" value={stats.departments} icon={Building2} colorClass="bg-indigo-50 text-indigo-600" />
        <StatCard title="Active Projects" value={stats.projects} icon={FolderKanban} colorClass="bg-purple-50 text-purple-600" />
        <StatCard title="Total Tasks" value={stats.tasks} icon={ListTodo} colorClass="bg-emerald-50 text-emerald-600" />
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 px-1">Task Sub-Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard title="Pending" value={stats.pending} icon={Clock} colorClass="bg-amber-50 text-amber-600" />
          <StatCard title="In Progress" value={stats.inProgress} icon={Activity} colorClass="bg-blue-50 text-blue-600" />
          <StatCard title="Needs Review" value={stats.needsReview} icon={AlertCircle} colorClass="bg-orange-50 text-orange-600" />
          <StatCard title="Finished" value={stats.finished} icon={CheckCircle2} colorClass="bg-emerald-50 text-emerald-600" />
          <StatCard title="Rejected" value={stats.rejected} icon={XCircle} colorClass="bg-red-50 text-red-600" />
        </div>
      </div>

      <div className="grid xl:grid-cols-3 gap-6 mt-8">
        <div className="xl:col-span-2">
          <TaskOverview
            pending={stats.pending}
            inProgress={stats.inProgress}
            finished={stats.finished}
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