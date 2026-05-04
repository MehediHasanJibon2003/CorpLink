import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import {
  FolderKanban,
  Users,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronRight,
} from "lucide-react";

// ─── Skeleton ──────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg ${className}`}
    />
  );
}

// ─── Status Config ─────────────────────────────────────────────────
const projectStatusConfig = {
  active: {
    label: "Active",
    class:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  },
  completed: {
    label: "Completed",
    class: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  },
  on_hold: {
    label: "On Hold",
    class:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  },
  cancelled: {
    label: "Cancelled",
    class: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  },
  planning: {
    label: "Planning",
    class:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  },
};

// ─── Project Card ──────────────────────────────────────────────────
function ProjectCard({ project }) {
  const sConf =
    projectStatusConfig[project.status] || projectStatusConfig.active;
  const progress =
    project.taskCount > 0
      ? Math.round((project.completedTasks / project.taskCount) * 100)
      : 0;

  return (
    <div className="border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl md:rounded-[2.5rem] shadow-sm p-8 md:p-10 hover:shadow-xl transition-shadow hover:border-blue-200 dark:hover:border-blue-800 group">
      {/* Top row */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-[1.2rem] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <FolderKanban className="h-7 w-7 md:h-8 md:w-8" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-black text-slate-800 dark:text-white text-lg md:text-xl truncate">
              {project.name}
            </h3>
            {project.teamName && (
              <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1 uppercase tracking-widest">
                <Users className="h-4 w-4" />
                {project.teamName}
              </p>
            )}
          </div>
        </div>
        <span
          className={`text-xs md:text-sm font-black px-4 py-1.5 rounded-full shrink-0 ml-4 uppercase tracking-widest ${sConf.class}`}
        >
          {sConf.label}
        </span>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mb-6 line-clamp-3 leading-relaxed font-medium">
          {project.description}
        </p>
      )}

      {/* Role Badge */}
      <div className="flex items-center gap-3 mb-6">
        <span
          className={`text-xs md:text-sm font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${
            project.myRole === "lead"
              ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
              : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
          }`}
        >
          {project.myRole === "lead" ? "⭐ Lead" : "Member"}
        </span>
        <span className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest border-l-2 border-slate-200 dark:border-slate-700 pl-3">
          {project.taskCount} task{project.taskCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mt-auto">
        <div className="flex justify-between text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
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
  );
}

// ─── Main Component ────────────────────────────────────────────────
function MyProjects() {
  const { user, profile } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchProjects = useCallback(async () => {
    if (!user?.id || !profile?.company_id) return;
    setLoading(true);
    setError(null);

    try {
      // First, get all project memberships for this user
      const { data: memberships, error: mErr } = await supabase
        .from("project_members")
        .select("project_id, role_in_project")
        .eq("employee_id", profile?.employee_id || user.id);

      if (mErr) throw mErr;

      if (!memberships || memberships.length === 0) {
        setProjects([]);
        setLoading(false);
        return;
      }

      const projectIds = memberships.map((m) => m.project_id);

      // Fetch the actual projects (filtered by company + member IDs)
      const { data: projectsData, error: pErr } = await supabase
        .from("projects")
        .select("id, name, description, status, team_id, created_at")
        .in("id", projectIds)
        .eq("company_id", profile.company_id);

      if (pErr) throw pErr;

      // Fetch teams (for team names)
      const teamIds = [
        ...new Set((projectsData || []).map((p) => p.team_id).filter(Boolean)),
      ];
      let teamsMap = {};
      if (teamIds.length > 0) {
        const { data: teamsData } = await supabase
          .from("teams")
          .select("id, name")
          .in("id", teamIds);
        teamsData?.forEach((t) => {
          teamsMap[t.id] = t.name;
        });
      }

      // Fetch task counts per project
      const taskCounts = {};
      const completedCounts = {};
      if (projectIds.length > 0) {
        const { data: tasksData } = await supabase
          .from("tasks")
          .select("id, project_id, status")
          .in("project_id", projectIds)
          .eq("company_id", profile.company_id);

        tasksData?.forEach((t) => {
          taskCounts[t.project_id] = (taskCounts[t.project_id] || 0) + 1;
          if (["finished", "completed"].includes(t.status)) {
            completedCounts[t.project_id] =
              (completedCounts[t.project_id] || 0) + 1;
          }
        });
      }

      // Combine everything
      const enriched = (projectsData || []).map((p) => {
        const membership = memberships.find((m) => m.project_id === p.id);
        return {
          ...p,
          teamName: teamsMap[p.team_id] || null,
          myRole: membership?.role_in_project || "member",
          taskCount: taskCounts[p.id] || 0,
          completedTasks: completedCounts[p.id] || 0,
        };
      });

      setProjects(enriched);
    } catch (err) {
      console.error("MyProjects fetch error:", err);
      setError(
        "Failed to load projects. This feature requires the project_members table.",
      );
    } finally {
      setLoading(false);
    }
  }, [user, profile, refreshKey]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 md:gap-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white flex items-center gap-4 tracking-tight">
            <FolderKanban className="h-8 w-8 text-purple-500" />
            My Projects
          </h1>
          <p className="text-base md:text-xl text-slate-500 dark:text-slate-400 mt-2 font-bold">
            {projects.length} project{projects.length !== 1 ? "s" : ""} you're
            part of
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

      {/* Content */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-200 dark:border-amber-800 rounded-3xl md:rounded-[3rem] p-10 md:p-16 text-center">
          <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <p className="font-bold text-amber-800 dark:text-amber-300 text-lg md:text-xl">
            {error}
          </p>
          <p className="text-sm md:text-base font-bold text-amber-600 dark:text-amber-400 mt-2">
            The project_members table may not be set up yet. Contact your admin.
          </p>
          <button
            onClick={fetchProjects}
            className="mt-6 text-sm md:text-base text-blue-600 dark:text-blue-400 hover:underline font-black uppercase tracking-widest"
          >
            Try again
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] shadow-sm flex flex-col items-center justify-center py-24 text-center px-6">
          <FolderKanban className="h-20 w-20 text-slate-300 dark:text-slate-600 mb-6" />
          <h3 className="font-black text-slate-600 dark:text-slate-300 text-2xl">
            No Projects Yet
          </h3>
          <p className="text-slate-400 dark:text-slate-500 text-lg mt-2 font-medium max-w-md">
            You haven't been added to any projects yet. Your manager will assign
            you to projects.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

export default MyProjects;
