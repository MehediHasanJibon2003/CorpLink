import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import {
  MoreHorizontal,
  Plus,
  Clock,
  MessageSquare,
  Paperclip,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  User,
  Users,
  FolderKanban,
} from "lucide-react";

const COLUMNS = [
  {
    id: "pending",
    label: "Backlog / Pending",
    color: "text-slate-400 bg-slate-100/50",
  },
  {
    id: "in_progress",
    label: "Active Execution",
    color: "text-blue-500 bg-blue-50",
  },
  {
    id: "needs_review",
    label: "Quality Audit",
    color: "text-amber-600 bg-amber-50",
  },
  {
    id: "finished",
    label: "Finalized",
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    id: "rejected",
    label: "Rejected / Blocked",
    color: "text-red-600 bg-red-50",
  },
];

function TaskKanban({ activeProject, profile, onTaskClick, triggerRefetch, onCreateTask }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectDetails, setProjectDetails] = useState(null);
  const [companyEmployees, setCompanyEmployees] = useState([]);

  const fetchProjectMeta = async () => {
    if (!activeProject?.id || !profile?.company_id) {
      setProjectDetails(null);
      return;
    }

    const [deptRes, membersRes, empsRes] = await Promise.all([
      activeProject.department_id
        ? supabase
            .from("departments")
            .select("id, name")
            .eq("id", activeProject.department_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("project_members")
        .select("employee_id, role_in_project")
        .eq("project_id", activeProject.id),
      supabase
        .from("employees")
        .select("id, user_id, name, email, role, designation")
        .eq("company_id", profile.company_id),
    ]);

    if (empsRes.data) setCompanyEmployees(empsRes.data);

    const pMembers = membersRes.data || [];
    const leadObj = pMembers.find((m) => m.role_in_project === "lead");
    const memberObjs = pMembers.filter((m) => m.role_in_project === "member");

    const leadEmp = leadObj
      ? empsRes.data?.find((e) => e.id === leadObj.employee_id || (e.user_id && e.user_id === leadObj.employee_id))
      : null;
    const memberEmps = memberObjs
      .map((m) => empsRes.data?.find((e) => e.id === m.employee_id || (e.user_id && e.user_id === m.employee_id)))
      .filter(Boolean);

    setProjectDetails({
      ...activeProject,
      department_name: deptRes.data
        ? deptRes.data.name
        : activeProject.department_name || "Company-wide",
      lead: leadEmp || activeProject.lead,
      members: memberEmps.length > 0 ? memberEmps : activeProject.members || [],
    });
  };

  const fetchTasks = async () => {
    setLoading(true);
    const role = profile?.role?.toLowerCase();

    let query = supabase
      .from("tasks")
      .select("*, employees(name)")
      .eq("company_id", profile.company_id);

    // Apply Hierarchy Filters
    if (role !== "admin") {
      // Dept Head, Manager, Employee, Restricted all filtered by Department
      if (profile.department_id) {
        // Most roles see everything in their department
        query = query.eq("department_id", profile.department_id);
      } else if (role === "employee" || role === "restricted") {
        // If no department, just see assigned tasks
        query = query.eq("assigned_to", profile.id);
      }
    }

    if (activeProject) {
      query = query.eq("project_id", activeProject.id);
    } else if (activeProject === null) {
      // Show Global Inbox only if no project is selected
      query = query.is("project_id", null);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });
    if (error) console.error("Kanban Fetch Error:", error);
    setTasks(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (profile) {
      fetchTasks();
      fetchProjectMeta();
    }
  }, [activeProject, triggerRefetch, profile]);

  if (loading)
    return (
      <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">
        Mapping Workspace Workflow...
      </div>
    );

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "finished").length;
  const progressPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Project Details HUD */}
      {activeProject && projectDetails && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] border-2 border-slate-100 dark:border-white/5 p-6 md:p-10 shadow-sm flex flex-col gap-6 md:gap-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4 md:gap-6 min-w-0 flex-1">
              <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-heading-2 md:text-heading-1 shadow-xl shadow-blue-500/20 shrink-0">
                {projectDetails.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                    {projectDetails.name}
                  </h2>
                  <span className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    {projectDetails.department_name}
                  </span>
                </div>
                {projectDetails.description ? (
                  <p className="text-[13px] md:text-body text-slate-500 dark:text-slate-400 font-medium max-w-2xl mt-2 line-clamp-2">
                    {projectDetails.description}
                  </p>
                ) : (
                  <p className="text-[13px] md:text-body text-slate-400 italic mt-2">
                    No description provided
                  </p>
                )}
              </div>
            </div>

            {/* Progress Metric tracking */}
            <div className="lg:min-w-[320px] bg-slate-50 dark:bg-slate-900/50 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-inner">
              <div className="flex justify-between items-center mb-2 font-black uppercase text-[10px] md:text-label">
                <span className="text-slate-400">
                  Project Velocity Tracking
                </span>
                <span className="text-blue-600 text-body font-black">
                  {progressPercent}%
                </span>
              </div>
              <div className="h-3 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mb-3 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)] transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                <span className="flex items-center gap-1 text-emerald-500">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {completedTasks}{" "}
                  Finalized
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {totalTasks} Allocated Tasks
                </span>
              </div>
            </div>
          </div>

          {/* Roster list */}
          <div className="pt-6 md:pt-8 border-t-2 border-slate-50 dark:border-white/5">
            <h3 className="text-[10px] md:text-label font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" /> Operational Team
              Roster ({(projectDetails.lead ? 1 : 0) + (projectDetails.members?.length || 0)} Total)
            </h3>
            <div className="flex flex-wrap gap-4">
              {projectDetails.lead ? (
                <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200/60 dark:border-amber-800/50 px-4 py-2.5 md:px-5 md:py-3 rounded-2xl shadow-sm hover:scale-[1.02] transition-transform">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-[12px] md:text-body shadow-md shrink-0">
                    {(projectDetails.lead.name || projectDetails.lead.full_name || "L").charAt(0)}
                  </div>
                  <div>
                    <p className="text-[12px] md:text-body font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      {projectDetails.lead.name || projectDetails.lead.full_name}
                    </p>
                    <span className="text-[8px] md:text-[9px] font-black text-amber-600 uppercase tracking-widest">
                      ⭐ Project Lead ({projectDetails.lead.designation || "Lead"})
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-2xl text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  No Leader Assigned
                </div>
              )}

              {projectDetails.members?.length > 0 ? (
                projectDetails.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-white/5 px-4 py-2.5 md:px-5 md:py-3 rounded-2xl hover:border-blue-500/30 transition-all shadow-sm hover:scale-[1.02]"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-[12px] md:text-body shadow-md shrink-0">
                      {(member.name || member.full_name || "M").charAt(0)}
                    </div>
                    <div>
                      <p className="text-[12px] md:text-body font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        {member.name || member.full_name}
                      </p>
                      <span className="text-[8px] md:text-[9px] font-black text-blue-500 uppercase tracking-widest">
                        {member.designation || member.role?.replace("_", " ") || "Member"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-2xl text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  No Team Members Assigned
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 pb-10 custom-scrollbar md:overflow-x-auto md:snap-x -mx-4 px-4 md:mx-0 md:px-0">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className="w-full md:min-w-[400px] md:max-w-[400px] flex flex-col md:snap-start"
            >
              <div
                className={`p-4 md:p-5 rounded-2xl mb-4 md:mb-6 flex justify-between items-center border-2 border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-10`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${col.id === "finished" ? "bg-emerald-500" : col.id === "rejected" ? "bg-red-500" : "bg-blue-500"}`}
                  />
                  <h3 className="text-[12px] md:text-body font-black text-slate-800 dark:text-white uppercase tracking-widest">
                    {col.label}
                  </h3>
                </div>
                <span className="bg-slate-100 dark:bg-white/10 text-slate-500 px-2.5 py-1 rounded-lg text-[10px] font-black">
                  {colTasks.length}
                </span>
              </div>

              <div className="flex-1 space-y-4 md:space-y-6">
                {colTasks.length === 0 ? (
                  <div className="py-16 md:py-20 text-center bg-slate-50/50 dark:bg-white/5 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                      No Active Missions
                    </p>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className="group bg-white dark:bg-slate-800 p-5 md:p-8 rounded-[2rem] border-2 border-slate-100 dark:border-white/5 shadow-sm hover:border-blue-500/30 hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1 active:scale-[0.98]"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] ${
                            task.priority === "high"
                              ? "bg-red-100 text-red-600"
                              : task.priority === "medium"
                                ? "bg-blue-100 text-blue-600"
                                : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {task.priority}
                        </span>
                        <MoreHorizontal className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                      </div>

                      <h4 className="text-body md:text-heading-2 font-black text-slate-800 dark:text-white uppercase tracking-tight mb-4 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                        {task.title}
                      </h4>

                      <div className="flex flex-wrap gap-4 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-50 dark:border-white/5">
                        <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <User className="h-3 w-3 md:h-3.5 md:w-3.5 text-blue-500" />{" "}
                          {companyEmployees.find(e => e.id === task.assigned_to || (e.user_id && e.user_id === task.assigned_to))?.name?.split(" ")[0] || task.employees?.name?.split(" ")[0] || "No Agent"}
                        </div>
                        <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <Clock className="h-3 w-3 md:h-3.5 md:w-3.5 text-amber-500" />{" "}
                          {task.deadline
                            ? new Date(task.deadline).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })
                            : "TBD"}
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end gap-3 opacity-60 md:opacity-40 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskClick(task, "comments");
                          }}
                          className="flex items-center gap-1 text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase transition-colors p-1"
                        >
                          <MessageSquare className="h-3 w-3" /> Update
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskClick(task, "attachments");
                          }}
                          className="flex items-center gap-1 text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase transition-colors p-1"
                        >
                          <Paperclip className="h-3 w-3" /> Asset
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {col.id === "pending" && (
                  <button
                    onClick={() => onCreateTask?.()}
                    className="w-full py-6 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[2rem] text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-all flex flex-col items-center gap-2 group active:scale-95"
                  >
                    <div className="w-10 h-10 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center group-hover:bg-blue-50 transition-all">
                      <Plus className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Initiate Task
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TaskKanban;
