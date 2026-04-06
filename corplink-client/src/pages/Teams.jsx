import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import AppLayout from "../components/layout/AppLayout"
import RoleGate from "../components/roles/RoleGate"

export default function Teams() {
  const { user, profile } = useAuth()
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

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this team?")) return
    await supabase.from("teams").delete().eq("id", id)
    fetchData()
  }

  return (
    <AppLayout title="Team Management" subtitle="Create and organize internal teams">
      <div className="space-y-6">
        
        {/* Only Admin/Manager can create teams */}
        <RoleGate allowedRoles={["admin", "manager", "hr", "corporate_admin"]}>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold mb-4">Create New Team</h3>
            <form onSubmit={handleSubmit} className="grid md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Team Name"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                className="border border-slate-300 dark:border-slate-600 px-4 py-2 rounded-xl outline-none focus:border-blue-500"
              />
              <select
                value={form.department_id}
                onChange={(e) => setForm({...form, department_id: e.target.value})}
                className="border border-slate-300 dark:border-slate-600 px-4 py-2 rounded-xl outline-none focus:border-blue-500"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <select
                value={form.team_lead_id}
                onChange={(e) => setForm({...form, team_lead_id: e.target.value})}
                className="border border-slate-300 dark:border-slate-600 px-4 py-2 rounded-xl outline-none focus:border-blue-500"
              >
                <option value="">Select Team Lead (Optional)</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
                ))}
              </select>
              <button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 font-medium"
              >
                {loading ? "Adding..." : "Add Team"}
              </button>
            </form>
          </div>
        </RoleGate>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
           <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
             <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Existing Teams</h3>
           </div>
           {teams.length === 0 ? (
             <p className="p-5 text-slate-500 dark:text-slate-400">No teams created yet.</p>
           ) : (
             <div className="divide-y divide-slate-200">
               {teams.map(team => (
                 <div key={team.id} className="p-5 flex justify-between items-center">
                   <div>
                     <h4 className="font-semibold text-lg text-slate-800 dark:text-slate-100">{team.name}</h4>
                     <p className="text-sm text-slate-600 dark:text-slate-300">Department: {team.departments?.name || "N/A"}</p>
                     <p className="text-sm text-slate-600 dark:text-slate-300">Lead: {team.team_lead?.name || "Unassigned"}</p>
                   </div>
                   <RoleGate allowedRoles={["admin", "manager", "hr", "corporate_admin"]}>
                     <button 
                       onClick={() => handleDelete(team.id)}
                       className="text-red-500 hover:text-red-700 font-medium text-sm"
                     >
                       Delete
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
