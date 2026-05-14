import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { logAdminActivity } from "../../utils/logger"
import { Users, Plus, Trash2, ShieldCheck, UserPlus, TrendingUp } from "lucide-react"

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

  useEffect(() => {
    if (activeDept) fetchTeams()
  }, [activeDept])

  const handleCreateTeam = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)

    const { error } = await supabase.from("teams").insert([{
      name: name.trim(),
      department_id: activeDept.id,
      company_id: profile.company_id
    }])

    if (!error) {
      setName(""); fetchTeams()
      await logAdminActivity({
        company_id: profile.company_id, user_id: user.id,
        action: `Created team '${name.trim()}' in ${activeDept.name}`,
        entity: "department"
      })
    }
    setLoading(false)
  }

  const handleDeleteTeam = async (id) => {
    if (!window.confirm("Delete this team?")) return
    await supabase.from("teams").delete().eq("id", id)
    fetchTeams()
  }

  const handleAssignLead = async (teamId, employeeId) => {
    await supabase.from("teams").update({ lead_id: employeeId || null }).eq("id", teamId)
    fetchTeams()
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl border-2 border-slate-100 dark:border-white/5 p-6 md:p-8 shadow-sm">
        <h4 className="text-[10px] md:text-body font-black text-slate-400 uppercase tracking-widest mb-4 md:mb-6">Create New Strategic Team</h4>
        <form onSubmit={handleCreateTeam} className="flex flex-col md:flex-row gap-3 md:gap-4">
          <input 
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Team Title"
            className="flex-1 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-white/5 rounded-xl md:rounded-2xl px-5 md:px-6 py-3.5 md:py-4 outline-none focus:border-blue-500 text-[13px] md:text-body font-bold"
          />
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-label tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-all">
            {loading ? "Adding..." : "Launch Team"}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        {teams.length === 0 ? (
          <div className="col-span-full py-16 md:py-20 text-center bg-white dark:bg-white/5 rounded-2xl md:rounded-[2.5rem] border-2 border-dashed border-slate-200">
             <p className="text-slate-400 font-black uppercase tracking-widest text-[12px]">No teams established</p>
          </div>
        ) : teams.map(team => (
          <div key={team.id} className="group bg-white dark:bg-slate-800 rounded-2xl md:rounded-[2rem] border-2 border-slate-100 dark:border-white/5 p-6 md:p-8 shadow-sm hover:border-blue-500/30 transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4 md:mb-6">
                 <div className="bg-blue-50 dark:bg-blue-600/10 p-3 md:p-4 rounded-xl md:rounded-2xl">
                    <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                 </div>
                 <button onClick={() => handleDeleteTeam(team.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all md:opacity-0 md:group-hover:opacity-100"><Trash2 className="h-5 w-5" /></button>
              </div>
              <h5 className="text-[16px] md:text-heading-1 font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1 md:mb-2 truncate">{team.name}</h5>
              <p className="text-[9px] md:text-label font-bold text-slate-500 uppercase tracking-widest mb-6 md:mb-8">Strategic Unit</p>
            </div>
            
            <div className="space-y-3 md:space-y-4">
              <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block">Operational Lead</label>
              <select 
                value={team.lead_id || ""}
                onChange={(e) => handleAssignLead(team.id, e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-white/5 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-[9px] md:text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500"
              >
                <option value="">No Lead Assigned</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TeamsPanel

