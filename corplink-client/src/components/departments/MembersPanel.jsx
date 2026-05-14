import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { UserPlus, ShieldCheck, Users, Mail, ArrowRight } from "lucide-react"

function MembersPanel({ activeDept }) {
  const [employees, setEmployees] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  const [unassignedEmps, setUnassignedEmps] = useState([])
  const [selectedNewEmp, setSelectedNewEmp] = useState("")

  const fetchData = async () => {
    setLoading(true)
    const [empRes, teamRes, allEmpsRes] = await Promise.all([
      supabase.from("employees").select("*").eq("department_id", activeDept.id),
      supabase.from("teams").select("id, name").eq("department_id", activeDept.id),
      supabase.from("employees").select("id, name, department_id").eq("company_id", activeDept.company_id)
    ])
    
    if (!teamRes.error) setTeams(teamRes.data || [])

    if (!empRes.error && empRes.data) {
      const mappedEmps = empRes.data.map(emp => {
        const teamMatch = teamRes.data?.find(t => t.id === emp.team_id)
        return { ...emp, team_name: teamMatch ? teamMatch.name : null }
      })
      setEmployees(mappedEmps)
    }

    if (!allEmpsRes.error && allEmpsRes.data) {
      const available = allEmpsRes.data.filter(e => e.department_id !== activeDept.id)
      setUnassignedEmps(available)
    }

    setLoading(false)
  }

  useEffect(() => {
    if (activeDept) fetchData()
  }, [activeDept])

  const handleAddMemberToDept = async (e) => {
    e.preventDefault()
    if (!selectedNewEmp) return
    await supabase.from("employees").update({ department_id: activeDept.id }).eq("id", selectedNewEmp)
    setSelectedNewEmp("")
    fetchData()
  }

  const handleAssignTeam = async (employeeId, teamId) => {
    await supabase.from("employees").update({ team_id: teamId || null }).eq("id", employeeId)
    fetchData()
  }

  if (loading) return <div className="p-10 text-center text-slate-500 font-bold animate-pulse">Synchronizing Personnel...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Assign Member Form */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-100 dark:border-white/5 p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
           <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-600/10 rounded-2xl flex items-center justify-center">
              <UserPlus className="h-7 w-7 text-emerald-600" />
           </div>
           <div>
              <h4 className="text-heading-2 font-black text-slate-800 dark:text-white uppercase tracking-tight">Deploy Personnel</h4>
              <p className="text-label font-bold text-slate-500 uppercase tracking-widest mt-1">Assign employees to {activeDept.name}</p>
           </div>
        </div>
        <form onSubmit={handleAddMemberToDept} className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <select 
            value={selectedNewEmp}
            onChange={e => setSelectedNewEmp(e.target.value)}
            className="flex-1 lg:w-72 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-white/5 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500"
          >
            <option value="">Choose Employee</option>
            {unassignedEmps.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
          <button type="submit" disabled={!selectedNewEmp} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-label tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-all disabled:opacity-50">
            Confirm Assignment
          </button>
        </form>
      </div>

      {/* Members Grid/List */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border-2 border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b-2 border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
           <h4 className="text-body font-black text-slate-500 uppercase tracking-widest">Department Directory</h4>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50 dark:border-white/5">
                    <th className="p-8">Operational Member</th>
                    <th className="p-8">Status / Role</th>
                    <th className="p-8">Team Assignment</th>
                    <th className="p-8"></th>
                 </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-50 dark:divide-white/5">
                 {employees.length === 0 ? (
                   <tr><td colSpan="4" className="p-20 text-center text-slate-400 font-bold italic">No personnel deployed to this unit.</td></tr>
                 ) : employees.map((emp) => (
                   <tr key={emp.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                      <td className="p-8">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center font-black text-slate-500 uppercase">
                               {emp.name.charAt(0)}
                            </div>
                            <div>
                               <p className="text-heading-3 font-black text-slate-800 dark:text-white uppercase tracking-tight">{emp.name}</p>
                               <p className="text-label font-bold text-slate-500 flex items-center gap-2"><Mail className="h-3 w-3" /> {emp.email}</p>
                            </div>
                         </div>
                      </td>
                      <td className="p-8">
                         <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600">{emp.role}</span>
                            {activeDept.head_id === emp.id && (
                              <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-purple-100 text-purple-600 flex items-center gap-1">
                                 <ShieldCheck className="h-3 w-3" /> Unit Head
                              </span>
                            )}
                         </div>
                      </td>
                      <td className="p-8">
                         <div className="flex items-center gap-4">
                            <Users className="h-5 w-5 text-slate-300" />
                            <select
                               value={emp.team_id || ""}
                               onChange={(e) => handleAssignTeam(emp.id, e.target.value)}
                               className="bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-white/5 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500 min-w-[180px]"
                            >
                               <option value="">No Team Assigned</option>
                               {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                         </div>
                      </td>
                      <td className="p-8 text-right">
                         <ArrowRight className="h-5 w-5 text-slate-200 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  )
}

export default MembersPanel

