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
  Compass,
  Zap,
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
function ProjectCard({ project, onJoin }) {
  const sConf =
    projectStatusConfig[project.status] || projectStatusConfig.active;
  const isJoined = !!project.myRole;
  
  const progress =
    project.taskCount > 0
      ? Math.round((project.completedTasks / project.taskCount) * 100)
      : 0;

  return (
    <div className="border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl md:rounded-[2.5rem] shadow-sm p-8 md:p-10 hover:shadow-xl transition-all hover:-translate-y-1 hover:border-blue-200 dark:hover:border-blue-800 group relative flex flex-col">
      {/* Top row */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-[1.2rem] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <FolderKanban className="h-7 w-7 md:h-8 md:w-8" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-black text-slate-800 dark:text-white text-heading-3 md:text-heading-2 truncate">
              {project.name}
            </h3>
            {project.teamName && (
              <p className="text-label md:text-body font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1 uppercase tracking-widest">
                <Users className="h-4 w-4" />
                {project.teamName}
              </p>
            )}
          </div>
        </div>
        <span
          className={`text-label md:text-body font-black px-4 py-1.5 rounded-full shrink-0 ml-4 uppercase tracking-widest ${sConf.class}`}
        >
          {sConf.label}
        </span>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-body md:text-body text-slate-500 dark:text-slate-400 mb-6 line-clamp-2 leading-relaxed font-medium">
          {project.description}
        </p>
      )}

      {/* Meta/Role */}
      <div className="flex items-center gap-3 mb-6 mt-auto">
        {isJoined ? (
          <>
            <span
              className={`text-label md:text-body font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${
                project.myRole === "lead"
                  ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              {project.myRole === "lead" ? "⭐ Lead" : "Member"}
            </span>
            <span className="text-label md:text-body font-bold text-slate-400 uppercase tracking-widest border-l-2 border-slate-200 dark:border-slate-700 pl-3">
              {project.taskCount} task{project.taskCount !== 1 ? "s" : ""}
            </span>
          </>
        ) : (
          <button
            onClick={() => onJoin(project.id)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-body uppercase tracking-widest transition-colors shadow-lg shadow-blue-500/20"
          >
            <Zap className="h-4 w-4" />
            Join Project
          </button>
        )}
      </div>

      {/* Progress Bar (only if joined) */}
      {isJoined && (
        <div>
          <div className="flex justify-between text-label md:text-body font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
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
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────
function MyProjects() {
  const { user, profile } = useAuth();

  const [activeTab, setActiveTab] = useState("my"); // "my" or "discover"
  const [projects, setProjects] = useState([]);
  const [discoverProjects, setDiscoverProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchProjects = useCallback(async () => {
    if (!user?.id || !profile?.company_id) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch joined projects
      const { data: memberships, error: mErr } = await supabase
        .from("project_members")
        .select("project_id, role_in_project")
        .eq("employee_id", profile?.employee_id || user.id);

      if (mErr && mErr.code !== "42P01") throw mErr;

      const projectIds = (memberships || []).map((m) => m.project_id);

      let joinedEnriched = [];
      if (projectIds.length > 0) {
        const { data: projectsData, error: pErr } = await supabase
          .from("projects")
          .select("id, name, description, status, team_id, created_at")
          .in("id", projectIds)
          .eq("company_id", profile.company_id);

        if (pErr) throw pErr;

        // Fetch teams
        const teamIds = [
          ...new Set((projectsData || []).map((p) => p.team_id).filter(Boolean)),
        ];
        let teamsMap = {};
        if (teamIds.length > 0) {
          const { data: teamsData } = await supabase
            .from("teams")
            .select("id, name")
            .in("id", teamIds);
          teamsData?.forEach((t) => (teamsMap[t.id] = t.name));
        }

        // Fetch task counts
        const taskCounts = {};
        const completedCounts = {};
        const { data: tasksData } = await supabase
          .from("tasks")
          .select("id, project_id, status")
          .in("project_id", projectIds)
          .eq("company_id", profile.company_id);

        tasksData?.forEach((t) => {
          taskCounts[t.project_id] = (taskCounts[t.project_id] || 0) + 1;
          if (["finished", "completed"].includes(t.status)) {
            completedCounts[t.project_id] = (completedCounts[t.project_id] || 0) + 1;
          }
        });

        joinedEnriched = (projectsData || []).map((p) => ({
          ...p,
          teamName: teamsMap[p.team_id] || null,
          myRole: memberships.find((m) => m.project_id === p.id)?.role_in_project || "member",
          taskCount: taskCounts[p.id] || 0,
          completedTasks: completedCounts[p.id] || 0,
        }));
      }
      setProjects(joinedEnriched);

      // 2. Fetch discoverable projects (in same company, not joined)
      let discoverQuery = supabase
        .from("projects")
        .select("id, name, description, status, team_id, created_at")
        .eq("company_id", profile.company_id);
      
      if (projectIds.length > 0) {
        discoverQuery = discoverQuery.not("id", "in", `(${projectIds.join(",")})`);
      }

      const { data: discoverData } = await discoverQuery.limit(10);
      setDiscoverProjects(discoverData || []);

    } catch (err) {
      console.error("MyProjects fetch error:", err);
      setError("Failed to load projects. Ensure database tables are ready.");
    } finally {
      setLoading(false);
    }
  }, [user, profile, refreshKey]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleJoinProject = async (projectId) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("project_members")
        .insert([
          {
            project_id: projectId,
            employee_id: user.id,
            role_in_project: "member",
          },
        ]);

      if (error) throw error;
      setRefreshKey((k) => k + 1);
      setActiveTab("my");
    } catch (err) {
      console.error("Join error:", err);
      alert("Failed to join project: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
        <div>
          <h1 className="text-heading-1 md:text-5xl font-black text-slate-900 dark:text-white flex items-center gap-4 tracking-tight">
            <FolderKanban className="h-8 w-8 text-purple-500" />
            Project Hub
          </h1>
          <p className="text-body md:text-heading-2 text-slate-500 dark:text-slate-400 mt-2 font-bold uppercase tracking-widest">
            Manage your teams & collaborations
          </p>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="flex items-center justify-center gap-3 text-body md:text-heading-3 font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-6 py-4 rounded-xl md:rounded-full border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition"
        >
          <RefreshCw className={`h-5 w-5 md:h-6 md:w-6 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 bg-slate-100/50 dark:bg-slate-900/50 p-2 rounded-2xl w-fit border-2 border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab("my")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-body font-black uppercase tracking-widest transition-all ${
            activeTab === "my"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <FolderKanban className="h-4 w-4" />
          My Projects ({projects.length})
        </button>
        <button
          onClick={() => setActiveTab("discover")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-body font-black uppercase tracking-widest transition-all ${
            activeTab === "discover"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <Compass className="h-4 w-4" />
          Discover ({discoverProjects.length})
        </button>
      </div>

      {/* Content */}
      {loading && projects.length === 0 && discoverProjects.length === 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : activeTab === "my" ? (
        projects.length === 0 ? (
          <div className="border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] shadow-sm flex flex-col items-center justify-center py-24 text-center px-6">
            <FolderKanban className="h-20 w-20 text-slate-300 dark:text-slate-600 mb-6" />
            <h3 className="font-black text-slate-600 dark:text-slate-300 text-heading-1 uppercase tracking-tighter">
              No Projects Yet
            </h3>
            <p className="text-slate-400 dark:text-slate-500 text-heading-3 mt-2 font-medium max-w-md leading-relaxed">
              You haven't joined any projects yet. Browse the discover tab to find opportunities!
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )
      ) : (
        discoverProjects.length === 0 ? (
          <div className="border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] shadow-sm flex flex-col items-center justify-center py-24 text-center px-6">
            <Compass className="h-20 w-20 text-slate-300 dark:text-slate-600 mb-6" />
            <h3 className="font-black text-slate-600 dark:text-slate-300 text-heading-1 uppercase tracking-tighter">
              All Caught Up
            </h3>
            <p className="text-slate-400 dark:text-slate-500 text-heading-3 mt-2 font-medium max-w-md leading-relaxed">
              There are no more public projects available for you to join right now.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {discoverProjects.map((p) => (
              <ProjectCard key={p.id} project={p} onJoin={handleJoinProject} />
            ))}
          </div>
        )
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-3xl md:rounded-[2rem] p-6 text-red-600 dark:text-red-400 font-bold flex items-center gap-3">
          <AlertCircle className="h-6 w-6" />
          {error}
        </div>
      )}
    </div>
  );
}

export default MyProjects;

