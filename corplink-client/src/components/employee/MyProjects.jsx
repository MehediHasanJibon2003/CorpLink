import { useEffect, useState, useCallback } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import {
  FolderKanban,
  Users,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronRight,
} from "lucide-react"

// ─── Skeleton ──────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg ${className}`} />
}

// ─── Status Config ─────────────────────────────────────────────────
const projectStatusConfig = {
  active: { label: "Active", class: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" },
  completed: { label: "Completed", class: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
  on_hold: { label: "On Hold", class: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" },
  cancelled: { label: "Cancelled", class: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" },
  planning: { label: "Planning", class: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" },
}

// ─── Project Card ──────────────────────────────────────────────────
function ProjectCard({ project }) {
  const sConf = projectStatusConfig[project.status] || projectStatusConfig.active
  const progress = project.taskCount > 0
    ? Math.round((project.completedTasks / project.taskCount) * 100)
    : 0

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 hover:shadow-md transition-shadow hover:border-blue-200 dark:hover:border-blue-800">
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm truncate">{project.name}</h3>
            {project.teamName && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <Users className="h-3 w-3" />
                {project.teamName}
              </p>
            )}
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ml-2 ${sConf.class}`}>
          {sConf.label}
        </span>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed">{project.description}</p>
      )}

      {/* Role Badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          project.myRole === "lead"
            ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
        }`}>
          {project.myRole === "lead" ? "⭐ Lead" : "Member"}
        </span>
        <span className="text-[10px] text-slate-400">
          {project.taskCount} task{project.taskCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────
function MyProjects() {
  const { user, profile } = useAuth()

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchProjects = useCallback(async () => {
    if (!user?.id || !profile?.company_id) return
    setLoading(true)
    setError(null)

    try {
      // First, get all project memberships for this user
      const { data: memberships, error: mErr } = await supabase
        .from("project_members")
        .select("project_id, role_in_project")
        .eq("employee_id", profile?.employee_id || user.id)

      if (mErr) throw mErr

      if (!memberships || memberships.length === 0) {
        setProjects([])
        setLoading(false)
        return
      }

      const projectIds = memberships.map(m => m.project_id)

      // Fetch the actual projects (filtered by company + member IDs)
      const { data: projectsData, error: pErr } = await supabase
        .from("projects")
        .select("id, name, description, status, team_id, created_at")
        .in("id", projectIds)
        .eq("company_id", profile.company_id)

      if (pErr) throw pErr

      // Fetch teams (for team names)
      const teamIds = [...new Set((projectsData || []).map(p => p.team_id).filter(Boolean))]
      let teamsMap = {}
      if (teamIds.length > 0) {
        const { data: teamsData } = await supabase
          .from("teams")
          .select("id, name")
          .in("id", teamIds)
        teamsData?.forEach(t => { teamsMap[t.id] = t.name })
      }

      // Fetch task counts per project
      const taskCounts = {}
      const completedCounts = {}
      if (projectIds.length > 0) {
        const { data: tasksData } = await supabase
          .from("tasks")
          .select("id, project_id, status")
          .in("project_id", projectIds)
          .eq("company_id", profile.company_id)

        tasksData?.forEach(t => {
          taskCounts[t.project_id] = (taskCounts[t.project_id] || 0) + 1
          if (["finished", "completed"].includes(t.status)) {
            completedCounts[t.project_id] = (completedCounts[t.project_id] || 0) + 1
          }
        })
      }

      // Combine everything
      const enriched = (projectsData || []).map(p => {
        const membership = memberships.find(m => m.project_id === p.id)
        return {
          ...p,
          teamName: teamsMap[p.team_id] || null,
          myRole: membership?.role_in_project || "member",
          taskCount: taskCounts[p.id] || 0,
          completedTasks: completedCounts[p.id] || 0,
        }
      })

      setProjects(enriched)
    } catch (err) {
      console.error("MyProjects fetch error:", err)
      setError("Failed to load projects. This feature requires the project_members table.")
    } finally {
      setLoading(false)
    }
  }, [user, profile, refreshKey])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderKanban className="h-6 w-6 text-purple-500" />
            My Projects
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {projects.length} project{projects.length !== 1 ? "s" : ""} you're part of
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

      {/* Content */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-52" />)}
        </div>
      ) : error ? (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 text-center">
          <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">{error}</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            The project_members table may not be set up yet. Contact your admin.
          </p>
          <button onClick={fetchProjects} className="mt-4 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold">
            Try again
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center py-20 text-center px-6">
          <FolderKanban className="h-14 w-14 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="font-bold text-slate-600 dark:text-slate-300 text-lg">No Projects Yet</h3>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-2 max-w-xs">
            You haven't been added to any projects yet. Your manager will assign you to projects.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}

export default MyProjects
