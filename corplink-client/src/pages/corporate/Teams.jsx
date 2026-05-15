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
        "*, departments(name), team_lead:profiles!teams_team_lead_id_fkey(name)",
      )
      .eq("company_id", profile.company_id);

    // Fetch Departments
    const { data: deptData } = await supabase
      .from("departments")
      .select("*")
      .eq("company_id", profile.company_id);

    // Fetch potential Team Leads (Profiles)
    const { data: empData } = await supabase
      .from("profiles")
      .select("id, name, email")
      .eq("company_id", profile.company_id);

    setTeams(teamData || []);
    setDepartments(deptData || []);
    setEmployees(empData || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.department_id) return;

    setLoading(true);
    const { error } = await supabase.from("teams").insert([
      {
        name: form.name.trim(),
        department_id: form.department_id,
        team_lead_id: form.team_lead_id || null,
        company_id: profile.company_id,
      },
    ]);

    if (!error) {
      setForm({ name: "", department_id: "", team_lead_id: "" });
      fetchData();
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
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6"
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
              >
                <option value="">Team Leader</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-4 md:py-0 rounded-2xl font-black uppercase text-label tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {loading ? "Syncing..." : "Add Team Asset"}
              </button>
            </form>
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
                           Lead: {team.team_lead?.name || "Unassigned"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <RoleGate
                    allowedRoles={["admin", "manager", "hr", "corporate_admin"]}
                  >
                    <button
                      onClick={() => handleDelete(team.id, team.name)}
                      className="w-full md:w-auto bg-red-50 text-red-500 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest border-2 border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95"
                    >
                      Deactivate Unit
                    </button>
                  </RoleGate>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
