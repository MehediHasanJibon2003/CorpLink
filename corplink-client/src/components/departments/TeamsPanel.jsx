import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { logAdminActivity } from "../../utils/logger"

function TeamsPanel({ activeDept, user, profile }) {
  const [teams, setTeams] = useState([])
  const [employees, setEmployees] = useState([])
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const fetchTeams = async () => {
    const { data: teamsData, error: teamsError } = await supabase
      .from("teams")
      .select("*")
      .eq("department_id", activeDept.id)
      .order("created_at", { ascending: false })
      
    const { data: empsData } = await supabase
      .from("employees")
      .select("id, name")
      .eq("department_id", activeDept.id)

    if (empsData) setEmployees(empsData)

    if (!teamsError && teamsData) {
      const mappedTeams = teamsData.map(team => {
        const lead = empsData?.find(e => e.id === team.lead_id)
        return { ...team, lead: lead ? { name: lead.name } : null }
      })
      setTeams(mappedTeams)
    }
  }

  const fetchEmployees = async () => {} // Handled above

  useEffect(() => {
    if (activeDept) {
      fetchTeams()
      fetchEmployees()
    }
  }, [activeDept])

  const handleCreateTeam = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError("")

    const { error } = await supabase.from("teams").insert([{
      name: name.trim(),
      department_id: activeDept.id,
      company_id: profile.company_id
    }])

    if (error) {
      setError(error.message)
    } else {
      setName("")
      fetchTeams()
      await logAdminActivity({
        company_id: profile.company_id, user_id: user.id,
        action: `Created team '${name.trim()}' in ${activeDept.name}`,
        entity: "department"
      })
    }
    setLoading(false)
  }

  const handleDeleteTeam = async (id) => {
    if (!window.confirm("Delete this team? Employees will be unassigned from it.")) return
    await supabase.from("teams").delete().eq("id", id)
    fetchTeams()
  }

  const handleAssignLead = async (teamId, employeeId) => {
    const leadId = employeeId || null
    await supabase.from("teams").update({ lead_id: leadId }).eq("id", teamId)
    fetchTeams()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
        <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Create New Team</h4>
        <form onSubmit={handleCreateTeam} className="flex gap-3">
          <input 
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Frontend Team, Support Squad..."
            className="flex-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white placeholder-slate-400 rounded-lg px-4 py-2 outline-none focus:border-blue-500"
          />
          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition">
            {loading ? "Adding..." : "Add Team"}
          </button>
        </form>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {teams.length === 0 ? (
          <p className="text-slate-500 col-span-2 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-center border border-slate-100">No teams created in this department yet.</p>
        ) : teams.map(team => (
          <div key={team.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{team.name}</h5>
                <button onClick={() => handleDeleteTeam(team.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition">Delete</button>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Team Lead</label>
              <select 
                value={team.lead_id || ""}
                onChange={(e) => handleAssignLead(team.id, e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-sm"
              >
                <option value="">No Lead Assigned</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TeamsPanel
