import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import AppLayout from "../components/layout/AppLayout"
import RoleGate from "../components/roles/RoleGate"
import { useConfirm } from "../context/ConfirmContext"

export default function Teams() {
  const { user, profile } = useAuth()
  const { showConfirm } = useConfirm()
  const [teams, setTeams] = useState([])
  const [departments, setDepartments] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  
  const [form, setForm] = useState({ name: "", department_id: "", team_lead_id: "" })

  useEffect(() => {
    if (profile?.company_id) {
      fetchData()
    }
  }, [profile])

  const fetchData = async () => {
    // Fetch Teams
    const { data: teamData } = await supabase
      .from("teams")
      .select("*, departments(name), team_lead:profiles!teams_team_lead_id_fkey(name)")
      .eq("company_id", profile.company_id)
    
    // Fetch Departments
    const { data: deptData } = await supabase
      .from("departments")
      .select("*")
      .eq("company_id", profile.company_id)

    // Fetch potential Team Leads (Profiles)
    const { data: empData } = await supabase
      .from("profiles")
      .select("id, name, email")
      .eq("company_id", profile.company_id)

    setTeams(teamData || [])
    setDepartments(deptData || [])
    setEmployees(empData || [])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.department_id) return
    
    setLoading(true)
    const { error } = await supabase.from("teams").insert([{
      name: form.name.trim(),
      department_id: form.department_id,
      team_lead_id: form.team_lead_id || null,
      company_id: profile.company_id
    }])

    if (!error) {
      setForm({ name: "", department_id: "", team_lead_id: "" })
      fetchData()
    }
    setLoading(false)
  }

  const handleDelete = (id, name) => {
    showConfirm({
      title: "Delete Team",
      message: `Are you sure you want to delete the ${name} team?`,
      onConfirm: async () => {
        await supabase.from("teams").delete().eq("id", id)
        fetchData()
      }
    })
  }

  return (
    <AppLayout title="Team Management" subtitle="Create and organize internal teams">
      <div className="space-y-8 md:space-y-12">
        
        {/* Only Admin/Manager can create teams */}
        <RoleGate allowedRoles={["admin", "manager", "hr", "corporate_admin"]}>
          <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-slate-100 mb-6 md:mb-8">Create New Team</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              <input
                type="text"
                placeholder="Team Name"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                className="border-2 border-slate-200 dark:border-slate-600 px-6 md:px-8 py-4 md:py-5 rounded-2xl outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 text-base md:text-xl transition-colors"
              />
              <select
                value={form.department_id}
                onChange={(e) => setForm({...form, department_id: e.target.value})}
                className="border-2 border-slate-200 dark:border-slate-600 px-6 md:px-8 py-4 md:py-5 rounded-2xl outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 text-base md:text-xl transition-colors"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <select
                value={form.team_lead_id}
                onChange={(e) => setForm({...form, team_lead_id: e.target.value})}
                className="border-2 border-slate-200 dark:border-slate-600 px-6 md:px-8 py-4 md:py-5 rounded-2xl outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 text-base md:text-xl transition-colors"
              >
                <option value="">Select Team Lead (Optional)</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
                ))}
              </select>
              <button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-8 md:px-12 py-4 md:py-5 font-bold text-base md:text-xl shadow-md transition hover:-translate-y-0.5 w-full md:w-auto"
              >
                {loading ? "Adding..." : "Add Team"}
              </button>
            </form>
          </div>
        </RoleGate>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
           <div className="px-8 md:px-12 py-6 md:py-8 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
             <h3 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-slate-100">Existing Teams</h3>
           </div>
           {teams.length === 0 ? (
             <p className="p-10 text-center text-slate-500 dark:text-slate-400 text-lg md:text-xl font-medium italic">No teams created yet. Create one to organize employees.</p>
           ) : (
             <div className="divide-y divide-slate-200 dark:divide-slate-700">
               {teams.map(team => (
                 <div key={team.id} className="p-8 md:p-10 flex flex-col md:flex-row md:justify-between md:items-center gap-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                   <div>
                     <h4 className="font-black text-xl md:text-3xl text-slate-800 dark:text-slate-100 mb-2">{team.name}</h4>
                     <p className="text-base md:text-xl text-slate-600 dark:text-slate-300 font-medium mb-1"><span className="text-slate-400 font-normal">Department:</span> {team.departments?.name || "N/A"}</p>
                     <p className="text-base md:text-xl text-slate-600 dark:text-slate-300 font-medium"><span className="text-slate-400 font-normal">Lead:</span> {team.team_lead?.name || "Unassigned"}</p>
                   </div>
                   <RoleGate allowedRoles={["admin", "manager", "hr", "corporate_admin"]}>
                     <button 
                       onClick={() => handleDelete(team.id, team.name)}
                       className="bg-slate-100 dark:bg-slate-700 hover:bg-red-600 text-slate-700 dark:text-slate-200 hover:text-white px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-base md:text-xl transition-all shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-600 hover:border-red-600 text-center w-full md:w-auto mt-4 md:mt-0"
                     >
                       Delete Team
                     </button>
                   </RoleGate>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    </AppLayout>
  )
}
