import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import AppLayout from "../../components/layout/AppLayout";
import RoleGate from "../../components/shared/RoleGate";
import { useConfirm } from "../../context/ConfirmContext";

export default function Teams() {
  const { user, profile } = useAuth();
  const { showConfirm } = useConfirm();
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const [form, setForm] = useState({
    name: "",
    department_id: "",
    team_lead_id: "",
  });

  useEffect(() => {
    if (profile?.company_id) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    // Fetch Teams
    const { data: teamData } = await supabase
      .from("teams")
      .select(
        "*, departments(name), team_lead:profiles!teams_team_lead_id_fkey(full_name)",
      )
      .eq("company_id", profile.company_id);

    // Fetch Departments
    const { data: deptData } = await supabase
      .from("departments")
      .select("*")
      .eq("company_id", profile.company_id);

    // Fetch Employees
    const { data: empData } = await supabase
      .from("employees")
      .select("id, user_id, name, department_id, team_id, profile_photo")
      .eq("company_id", profile.company_id);

    const teamsWithMembers = (teamData || []).map((t) => ({
      ...t,
      members: (empData || []).filter((e) => e.team_id === t.id),
    }));

    setTeams(teamsWithMembers);
    setDepartments(deptData || []);
    setEmployees(empData || []);
  };

  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setError("");
    setLoading(true);

    const { data: insertedTeam, error: insertError } = await supabase.from("teams").insert([
      {
        name: form.name.trim(),
        department_id: form.department_id || null,
        team_lead_id: form.team_lead_id || null,
        company_id: profile.company_id,
      },
    ]).select();

    if (!insertError && insertedTeam && insertedTeam.length > 0) {
      const newTeamId = insertedTeam[0].id;
      if (selectedMembers.length > 0) {
        await supabase
          .from("employees")
          .update({ team_id: newTeamId })
          .in("id", selectedMembers);
      }
      setForm({ name: "", department_id: "", team_lead_id: "" });
      setSelectedMembers([]);
      fetchData();
    } else {
      setError(insertError?.message || "Failed to create team.");
    }
    setLoading(false);
  };

  const handleDelete = (id, name) => {
    showConfirm({
      title: "Delete Team",
      message: `Are you sure you want to delete the ${name} team?`,
      onConfirm: async () => {
        await supabase.from("teams").delete().eq("id", id);
        fetchData();
      },
    });
  };

  const filteredEmployees = form.department_id
    ? employees.filter((e) => e.department_id === form.department_id)
    : [];

  return (
    <AppLayout
      title="Team Management"
      subtitle="Create and organize internal teams"
    >
      <div className="space-y-8 md:space-y-12">
        {/* Only Admin/Manager can create teams */}
        <RoleGate allowedRoles={["admin", "manager", "hr", "corporate_admin"]}>
          <div className="bg-white dark:bg-slate-800 p-8 md:p-10 rounded-[2.5rem] shadow-xl border-2 border-slate-100 dark:border-violet-500/15">
            <h3 className="text-heading-1 font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8">
              Initialize New Team
            </h3>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 md:gap-6"
            >
              <input
                type="text"
                placeholder="Team Designation"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-violet-500/10 rounded-2xl px-6 py-4 text-body font-bold focus:border-blue-500 outline-none transition-all shadow-inner"
              />
              <select
                value={form.department_id}
                onChange={(e) =>
                  setForm({ ...form, department_id: e.target.value })
                }
                className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-violet-500/10 rounded-2xl px-6 py-4 text-label font-black uppercase outline-none focus:border-blue-500 transition-all"
              >
                <option value="">Department Hub</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                value={form.team_lead_id}
                onChange={(e) =>
                  setForm({ ...form, team_lead_id: e.target.value })
                }
                className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-violet-500/10 rounded-2xl px-6 py-4 text-label font-black uppercase outline-none focus:border-blue-500 transition-all"
                disabled={!form.department_id}
              >
                <option value="">Team Leader</option>
                {filteredEmployees.filter(e => e.user_id).map((e) => (
                  <option key={e.id} value={e.user_id}>
                    {e.name}
                  </option>
                ))}
              </select>
              <div className="w-full relative">
                <select
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && !selectedMembers.includes(val)) {
                      setSelectedMembers([...selectedMembers, val]);
                    }
                    e.target.value = "";
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-violet-500/10 rounded-2xl px-6 py-4 text-label font-black uppercase outline-none focus:border-blue-500 transition-all"
                  disabled={!form.department_id}
                >
                  <option value="">Assign Members...</option>
                  {filteredEmployees
                    .filter((e) => !selectedMembers.includes(e.id))
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                </select>
                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedMembers.map((mId) => {
                      const emp = employees.find((e) => e.id === mId);
                      if (!emp) return null;
                      return (
                        <span
                          key={mId}
                          className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1"
                        >
                          {emp.name}
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedMembers(
                                selectedMembers.filter((id) => id !== mId)
                              )
                            }
                            className="text-blue-500 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 ml-1"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-4 md:py-0 rounded-2xl font-black uppercase text-label tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {loading ? "Syncing..." : "Add Team Asset"}
              </button>
            </form>
            {error && (
              <p className="mt-4 text-red-500 text-[11px] font-bold bg-red-50 dark:bg-red-950/30 px-4 py-3 rounded-xl border border-red-200 dark:border-red-800">
                ⚠️ {error}
              </p>
            )}
          </div>
        </RoleGate>

        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl border-2 border-slate-100 dark:border-white/5 overflow-hidden">
          <div className="px-8 py-6 border-b-2 border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30">
            <h3 className="text-heading-2 font-black text-slate-400 uppercase tracking-[0.2em]">
              Operational Directory
            </h3>
          </div>
          {teams.length === 0 ? (
            <div className="py-20 text-center opacity-30">
              <p className="text-heading-2 font-black uppercase tracking-widest text-slate-300 italic">
                Strategic Units Offline
              </p>
            </div>
          ) : (
            <div className="divide-y-2 divide-slate-50 dark:divide-white/5">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="p-6 md:p-10 flex flex-col md:flex-row md:justify-between md:items-center gap-6 hover:bg-slate-50 dark:hover:bg-white/5 transition-all group"
                >
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-heading-1 shadow-lg">
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-heading-2 font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        {team.name}
                      </h4>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-1">
                        <p className="text-[10px] md:text-label font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                           <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                           {team.departments?.name || "N/A"}
                        </p>
                        <p className="text-[10px] md:text-label font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                           Lead: {team.team_lead?.full_name || "Unassigned"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                    <button
                      onClick={() => setSelectedTeam(team)}
                      className="w-full md:w-auto bg-blue-50 text-blue-600 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest border-2 border-blue-100 hover:bg-blue-500 hover:text-white transition-all shadow-sm active:scale-95 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white"
                    >
                      Team Details
                    </button>
                    <RoleGate
                      allowedRoles={["admin", "manager", "hr", "corporate_admin"]}
                    >
                      <button
                        onClick={() => handleDelete(team.id, team.name)}
                        className="w-full md:w-auto bg-red-50 text-red-500 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest border-2 border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white"
                      >
                        Deactivate Unit
                      </button>
                    </RoleGate>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedTeam && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border-2 border-slate-100 dark:border-slate-700">
            <div className="p-6 md:p-8 border-b-2 border-slate-50 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
              <h3 className="text-heading-2 font-black text-slate-800 dark:text-white uppercase tracking-tight">
                Team Details
              </h3>
              <button
                onClick={() => setSelectedTeam(null)}
                className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:bg-red-500 hover:text-white transition-all font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-6 md:p-8 space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Team Name
                </label>
                <p className="text-body font-bold text-slate-900 dark:text-white">
                  {selectedTeam.name}
                </p>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Department
                </label>
                <p className="text-body font-bold text-slate-900 dark:text-white">
                  {selectedTeam.departments?.name || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Team Leader
                </label>
                <p className="text-body font-bold text-slate-900 dark:text-white">
                  {selectedTeam.team_lead?.full_name || "Unassigned"}
                </p>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">
                  Assigned Members ({selectedTeam.members?.length || 0})
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {selectedTeam.members && selectedTeam.members.length > 0 ? (
                    selectedTeam.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-white/5"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-black text-[12px]">
                          {member.name.charAt(0)}
                        </div>
                        <p className="text-[14px] font-bold text-slate-800 dark:text-white">
                          {member.name}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[12px] text-slate-500 italic">
                      No members assigned.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
