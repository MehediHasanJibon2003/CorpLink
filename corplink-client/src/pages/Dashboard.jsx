import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import AppLayout from "../components/layout/AppLayout"
import StatCard from "../components/dashboard/StatCard"
import TaskOverview from "../components/dashboard/TaskOverview"
import RecentActivity from "../components/dashboard/RecentActivity"

function Dashboard() {
  const { profile } = useAuth()

  const [stats, setStats] = useState({
    employees: 0,
    departments: 0,
    tasks: 0,
    pending: 0,
    inProgress: 0,
    finished: 0,
  })

  const [activities, setActivities] = useState([])

  const fetchDashboardData = async () => {
    const { data: employees } = await supabase.from("employees").select("*")
    const { data: departments } = await supabase.from("departments").select("*")
    const { data: tasks } = await supabase.from("tasks").select("*")
    const { data: logs } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6)

    const pendingCount = tasks?.filter((t) => t.status === "pending").length || 0
    const inProgressCount =
      tasks?.filter((t) => t.status === "in_progress").length || 0
    const finishedCount =
      tasks?.filter((t) => t.status === "finished").length || 0

    setStats({
      employees: employees?.length || 0,
      departments: departments?.length || 0,
      tasks: tasks?.length || 0,
      pending: pendingCount,
      inProgress: inProgressCount,
      finished: finishedCount,
    })

    setActivities(logs || [])
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  return (
    <AppLayout
      title="Admin Dashboard"
      subtitle={`Welcome back, ${profile?.full_name || "Admin"}!`}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard title="Total Employees" value={stats.employees} />
        <StatCard title="Total Departments" value={stats.departments} />
        <StatCard title="Total Tasks" value={stats.tasks} />
        <StatCard title="Pending Tasks" value={stats.pending} />
        <StatCard title="In Progress Tasks" value={stats.inProgress} />
        <StatCard title="Finished Tasks" value={stats.finished} />
      </div>

      <div className="grid xl:grid-cols-3 gap-6 mt-6">
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

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">
            Company Info
          </h3>

          <div className="space-y-3 text-slate-700">
            <p>
              <span className="font-semibold">Company:</span>{" "}
              {profile?.companies?.name || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Admin Name:</span>{" "}
              {profile?.full_name || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Email:</span>{" "}
              {profile?.email || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Role:</span>{" "}
              {profile?.role || "N/A"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">
            Quick Summary
          </h3>

          <div className="space-y-3 text-slate-700">
            <p>
              Your workspace currently has{" "}
              <span className="font-semibold">{stats.employees}</span> employees.
            </p>
            <p>
              There are <span className="font-semibold">{stats.tasks}</span> total
              tasks in the system.
            </p>
            <p>
              <span className="font-semibold">{stats.pending}</span> task pending,
              <span className="font-semibold"> {stats.inProgress}</span> in progress,
              and
              <span className="font-semibold"> {stats.finished}</span> finished.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default Dashboard