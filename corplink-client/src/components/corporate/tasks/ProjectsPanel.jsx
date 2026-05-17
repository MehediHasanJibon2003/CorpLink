import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { logAdminActivity } from "../../../utils/logger";
import {
  FolderKanban,
  Plus,
  Trash2,
  Building,
  Layout,
  ChevronRight,
  Activity,
  CheckCircle2,
  Edit3,
  X,
  Users,
  ChevronDown,
} from "lucide-react";
import { useConfirm } from "../../../context/ConfirmContext";

function ProjectsPanel({ profile, user, onSelectProject }) {
  const { showConfirm } = useConfirm();
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projectStats, setProjectStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showMemberSelect, setShowMemberSelect] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    department_id: "",
    team_lead_id: "",
    team_member_ids: [],
  });

  const fetchProjectsData = async () => {
    const role = profile?.role?.toLowerCase();

    let projQuery = supabase
      .from("projects")
      .select("*")
      .eq("company_id", profile.company_id);

    // Apply Hierarchy Filter
    if (role !== "admin" && profile.department_id) {
      projQuery = projQuery.eq("department_id", profile.department_id);
    }

    const [projRes, deptRes, tasksRes, empsRes] = await Promise.all([
      projQuery.order("created_at", { ascending: false }),
      supabase
        .from("departments")
        .select("id, name")
        .eq("company_id", profile.company_id),
      supabase
        .from("tasks")
        .select("project_id, status")
        .eq("company_id", profile.company_id),
      supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("company_id", profile.company_id)
        .order("full_name"),
    ]);

    if (!deptRes.error && deptRes.data) setDepartments(deptRes.data);
    if (!empsRes.error && empsRes.data) setEmployees(empsRes.data);

    const stats = {};
    tasksRes.data?.forEach((t) => {
      const pid = t.project_id || "inbox";
      if (!stats[pid]) stats[pid] = { total: 0, completed: 0 };
      stats[pid].total++;
      if (t.status === "finished") stats[pid].completed++;
    });
    setProjectStats(stats);

    if (!projRes.error && projRes.data) {
      const projectIds = projRes.data.map((p) => p.id);
      let membersRes = { data: [] };
      if (projectIds.length > 0) {
        membersRes = await supabase
          .from("project_members")
          .select("project_id, employee_id, role_in_project")
          .in("project_id", projectIds);
      }

      const mapped = projRes.data.map((p) => {
        const d = deptRes.data?.find((dept) => dept.id === p.department_id);
        const pMembers = (membersRes.data || []).filter(
          (m) => m.project_id === p.id,
        );
        const leadObj = pMembers.find((m) => m.role_in_project === "lead");
        const memberObjs = pMembers.filter(
          (m) => m.role_in_project === "member",
        );

        const leadEmp = leadObj
          ? empsRes.data?.find((e) => e.id === leadObj.employee_id)
          : null;
        const memberEmps = memberObjs
          .map((m) => empsRes.data?.find((e) => e.id === m.employee_id))
          .filter(Boolean);

        return {
          ...p,
          department_name: d ? d.name : "Company-wide",
          lead: leadEmp,
          members: memberEmps,
          lead_id: leadObj ? leadObj.employee_id : "",
          member_ids: memberObjs.map((m) => m.employee_id),
        };
      });
      setProjects(mapped);
    }
  };

  useEffect(() => {
    if (profile) fetchProjectsData();
  }, [profile]);

  const handleEdit = (proj) => {
    setForm({
      name: proj.name,
      description: proj.description || "",
      department_id: proj.department_id || "",
      team_lead_id: proj.lead_id || "",
      team_member_ids: proj.member_ids || [],
    });
    setEditingId(proj.id);
    setShowMemberSelect(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      department_id: "",
      team_lead_id: "",
      team_member_ids: [],
    });
    setEditingId(null);
    setShowMemberSelect(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    setError("");

    try {
      let targetProjectId = editingId;

      if (editingId) {
        // Update Existing Project
        const { error } = await supabase
          .from("projects")
          .update({
            name: form.name.trim(),
            description: form.description.trim(),
            department_id: form.department_id || null,
          })
          .eq("id", editingId);

        if (error) throw error;

        // Remove existing members to re-assign clean
        await supabase
          .from("project_members")
          .delete()
          .eq("project_id", editingId);

        await logAdminActivity({
          company_id: profile.company_id,
          user_id: user.id,
          action: `Updated Project: ${form.name.trim()}`,
          entity: "project",
        });
      } else {
        // Create New Project
        const { data: insertData, error: insertError } = await supabase
          .from("projects")
          .insert([
            {
              name: form.name.trim(),
              description: form.description.trim(),
              department_id: form.department_id || null,
              company_id: profile.company_id,
            },
          ])
          .select();

        if (insertError) throw insertError;
        targetProjectId = insertData[0].id;

        // --- AUTO CHAT GROUP CREATION ---
        if (insertData && insertData.length > 0) {
          await supabase.from("chat_groups").insert([
            {
              name: `${form.name.trim()} Workspace`,
              company_id: profile.company_id,
              type: "project",
              reference_id: insertData[0].id,
            },
          ]);
        }
        // --------------------------------

        await logAdminActivity({
          company_id: profile.company_id,
          user_id: user.id,
          action: `Established Project: ${form.name.trim()}`,
          entity: "project",
        });
      }

      // Re-insert Lead and Team Members
      if (targetProjectId) {
        const memberInserts = [];
        if (form.team_lead_id) {
          memberInserts.push({
            project_id: targetProjectId,
            employee_id: form.team_lead_id,
            role_in_project: "lead",
          });
        }
        form.team_member_ids.forEach((mId) => {
          if (mId !== form.team_lead_id) {
            memberInserts.push({
              project_id: targetProjectId,
              employee_id: mId,
              role_in_project: "member",
            });
          }
        });

        if (memberInserts.length > 0) {
          await supabase.from("project_members").insert(memberInserts);
        }
      }

      resetForm();
      fetchProjectsData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id, name) => {
    showConfirm({
      title: "Delete Project",
      message: `Are you sure you want to permanently delete project "${name}"?`,
      onConfirm: async () => {
        await supabase.from("projects").delete().eq("id", id);
        fetchProjectsData();
        await logAdminActivity({
          company_id: profile.company_id,
          user_id: user.id,
          action: `Deleted Project: ${name}`,
          entity: "project",
          severity: "warning",
        });
      },
    });
  };

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-500">
      {/* Creation/Edit HUD */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-[2.5rem] shadow-sm border-2 border-slate-100 dark:border-white/5 p-6 md:p-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h3 className="text-heading-3 md:text-heading-1 font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
            {editingId ? (
              <Edit3 className="h-5 w-5 md:h-6 md:w-6 text-amber-500" />
            ) : (
              <Plus className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
            )}
            <span className="truncate">
              {editingId ? "Update Parameters" : "Launch Project"}
            </span>
          </h3>
          {editingId && (
            <button
              onClick={resetForm}
              className="text-slate-400 hover:text-red-500 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest bg-slate-50 dark:bg-white/5 px-3 py-1.5 rounded-lg md:bg-transparent md:p-0"
            >
              <X className="h-4 w-4" /> Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">
                Project Title *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Strategic Title"
                className="bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-white/5 rounded-2xl px-6 py-4 text-body font-bold focus:border-blue-500 outline-none transition-all w-full text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">
                Objective
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Objective"
                className="bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-white/5 rounded-2xl px-6 py-4 text-body font-bold focus:border-blue-500 outline-none transition-all w-full text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">
                Department Hub
              </label>
              <select
                value={form.department_id}
                onChange={(e) =>
                  setForm({ ...form, department_id: e.target.value })
                }
                className="bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-white/5 rounded-2xl px-4 py-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500 w-full text-slate-800 dark:text-white"
              >
                <option value="">Global Unit</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">
                Assign Team Leader
              </label>
              <select
                value={form.team_lead_id}
                onChange={(e) =>
                  setForm({ ...form, team_lead_id: e.target.value })
                }
                className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-white/5 rounded-2xl px-4 py-4 text-[12px] font-bold outline-none focus:border-blue-500 text-slate-800 dark:text-white"
              >
                <option value="">-- Unassigned Leader --</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.full_name} ({e.role.replace("_", " ")})
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                Assign Team Members ({form.team_member_ids.length} selected)
              </label>
              <button
                type="button"
                onClick={() => setShowMemberSelect(!showMemberSelect)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-white/5 rounded-2xl px-5 py-4 text-left text-[12px] font-bold text-slate-800 dark:text-white flex items-center justify-between shadow-inner"
              >
                <span className="truncate">
                  {form.team_member_ids.length === 0
                    ? "Select Team Members..."
                    : form.team_member_ids
                        .map(
                          (id) => employees.find((e) => e.id === id)?.full_name,
                        )
                        .filter(Boolean)
                        .join(", ")}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${showMemberSelect ? "rotate-180" : ""}`}
                />
              </button>

              {showMemberSelect && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2 mb-2">
                    <span className="text-[10px] font-black uppercase text-slate-400">
                      Available Personnel
                    </span>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            team_member_ids: employees.map((e) => e.id),
                          })
                        }
                        className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setForm({ ...form, team_member_ids: [] })
                        }
                        className="text-[10px] text-slate-400 hover:text-red-500 font-bold hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  {employees.map((e) => {
                    const isSelected = form.team_member_ids.includes(e.id);
                    return (
                      <div
                        key={e.id}
                        onClick={() => {
                          const newIds = isSelected
                            ? form.team_member_ids.filter((id) => id !== e.id)
                            : [...form.team_member_ids, e.id];
                          setForm({ ...form, team_member_ids: newIds });
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${isSelected ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold" : "hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 dark:border-slate-600"}`}
                          >
                            {isSelected && (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <span className="text-[13px] font-medium">
                            {e.full_name}
                          </span>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900">
                          {e.role.replace("_", " ")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full ${editingId ? "bg-amber-500" : "bg-blue-600"} text-white py-4 rounded-2xl font-black uppercase text-[12px] md:text-label tracking-widest shadow-xl transition-all active:scale-95`}
            >
              {loading
                ? "Processing..."
                : editingId
                  ? "Save Parameter Changes"
                  : "Deploy Project Asset"}
            </button>
          </div>
        </form>
        {error && (
          <p className="text-red-500 text-[10px] font-bold mt-4 bg-red-50 p-3 rounded-xl">
            {error}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Inbox / Default Card */}
        <div className="bg-slate-100 dark:bg-white/5 rounded-[2.5rem] p-10 flex flex-col justify-between border-2 border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all">
          <div>
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <Activity className="h-8 w-8 text-slate-400" />
            </div>
            <h4 className="text-heading-1 font-black text-slate-800 dark:text-white uppercase tracking-tight">
              Global Inbox
            </h4>
            <p className="text-label font-black text-slate-400 uppercase tracking-widest mt-1 mb-6">
              Unassigned Workflow
            </p>

            {projectStats["inbox"] && (
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase">
                  <span className="text-slate-400">Activity Level</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {Math.round(
                      (projectStats["inbox"].completed /
                        projectStats["inbox"].total) *
                        100,
                    )}
                    %
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-400"
                    style={{
                      width: `${(projectStats["inbox"].completed / projectStats["inbox"].total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => onSelectProject(null)}
            className="mt-12 w-full py-4 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-2xl font-black uppercase text-label tracking-widest shadow-md hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            Explore Workflow <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {projects.map((proj) => {
          const stats = projectStats[proj.id] || { total: 0, completed: 0 };
          const progress =
            stats.total > 0
              ? Math.round((stats.completed / stats.total) * 100)
              : 0;

          return (
            <div
              key={proj.id}
              className="group bg-white dark:bg-slate-800 rounded-[2.5rem] border-2 border-slate-100 dark:border-white/5 p-10 shadow-sm hover:border-blue-500/30 transition-all flex flex-col justify-between hover:-translate-y-1"
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                    <Layout className="h-8 w-8" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(proj)}
                      className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Edit3 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(proj.id, proj.name)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <h4 className="text-heading-1 font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">
                  {proj.name}
                </h4>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Building className="h-3 w-3" /> {proj.department_name}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {proj.lead && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 border border-amber-200/50 dark:border-amber-800/50">
                      ⭐ Lead: {proj.lead.full_name}
                    </span>
                  )}
                  {proj.members && proj.members.length > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 border border-slate-200 dark:border-slate-600/50">
                      <Users className="w-3 h-3 text-blue-500" />{" "}
                      {proj.members.length} Member
                      {proj.members.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase">
                    <span className="text-slate-400">Project Velocity</span>
                    <span className="text-blue-600">{progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-50 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)] transition-all duration-1000"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex gap-4 mt-2">
                    <div className="text-[10px] font-black text-slate-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />{" "}
                      {stats.completed} Done
                    </div>
                    <div className="text-[10px] font-black text-slate-400 flex items-center gap-1">
                      <Activity className="h-3 w-3 text-blue-500" />{" "}
                      {stats.total} Total
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => onSelectProject(proj)}
                className="mt-12 w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-label tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                Launch Board <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProjectsPanel;
