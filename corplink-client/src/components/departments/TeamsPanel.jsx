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
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl border-2 border-slate-200 dark:border-slate-700 p-6 md:p-8 shadow-sm">
        <h4 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 mb-6">Create New Team</h4>
        <form onSubmit={handleCreateTeam} className="flex flex-col md:flex-row gap-4 md:gap-6">
          <input 
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Frontend Team, Support Squad..."
            className="flex-1 border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 dark:text-white placeholder-slate-400 rounded-xl md:rounded-2xl px-6 py-3 md:px-8 md:py-4 outline-none focus:border-blue-500 text-base md:text-xl transition-colors w-full"
          />
          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-8 md:px-12 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-base md:text-xl transition shadow-md hover:shadow-lg w-full md:w-auto hover:-translate-y-0.5">
            {loading ? "Adding..." : "Add Team"}
          </button>
        </form>
        {error && <p className="text-red-500 font-bold text-base mt-4">{error}</p>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
        {teams.length === 0 ? (
          <p className="text-slate-500 col-span-full p-8 md:p-10 bg-white dark:bg-slate-800/50 rounded-2xl md:rounded-3xl text-center border-2 border-slate-200 dark:border-slate-700 text-lg md:text-xl font-medium italic shadow-sm">No teams created in this department yet.</p>
        ) : teams.map(team => (
          <div key={team.id} className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl border-2 border-slate-200 dark:border-slate-700 p-6 md:p-8 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group hover:-translate-y-1">
            <div>
              <div className="flex justify-between items-start mb-4 gap-4">
                <h5 className="font-black text-slate-800 dark:text-slate-100 text-2xl md:text-3xl break-words flex-1">{team.name}</h5>
                <button onClick={() => handleDeleteTeam(team.id)} className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800/50 px-4 py-2 rounded-xl text-sm md:text-base font-bold shadow-sm transition opacity-0 group-hover:opacity-100 shrink-0">Delete</button>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t-2 border-slate-100 dark:border-slate-700">
              <label className="text-sm md:text-base font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 block">Team Lead</label>
              <select 
                value={team.lead_id || ""}
                onChange={(e) => handleAssignLead(team.id, e.target.value)}
                className="w-full border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 dark:text-white rounded-xl md:rounded-2xl px-5 py-3 md:px-6 md:py-4 outline-none focus:border-blue-500 text-base md:text-xl font-medium transition-colors"
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
