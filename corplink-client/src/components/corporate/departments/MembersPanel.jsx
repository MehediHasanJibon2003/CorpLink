import { useEffect, useState } from "react"
import { supabase } from "../../../lib/supabase"
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
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      
      {/* Assign Member Form */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl border-2 border-slate-100 dark:border-white/5 p-6 md:p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
        <div className="flex items-center gap-4 md:gap-6">
           <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-50 dark:bg-emerald-600/10 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
              <UserPlus className="h-6 w-6 md:h-7 md:w-7 text-emerald-600" />
           </div>
           <div className="min-w-0">
              <h4 className="text-[16px] md:text-heading-2 font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">Deploy Personnel</h4>
              <p className="text-[9px] md:text-label font-bold text-slate-500 uppercase tracking-widest mt-0.5 md:mt-1 truncate">Assign to {activeDept.name}</p>
           </div>
        </div>
        <form onSubmit={handleAddMemberToDept} className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full lg:w-auto">
          <select 
            value={selectedNewEmp}
            onChange={e => setSelectedNewEmp(e.target.value)}
            className="flex-1 lg:w-72 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-white/5 rounded-xl md:rounded-2xl px-4 md:px-6 py-3.5 md:py-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500"
          >
            <option value="">Choose Employee</option>
            {unassignedEmps.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
          <button type="submit" disabled={!selectedNewEmp} className="bg-blue-600 text-white px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-label tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-all disabled:opacity-50">
            Confirm Assignment
          </button>
        </form>
      </div>

      {/* Members Directory */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-[2.5rem] border-2 border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="px-6 md:px-8 py-4 md:py-6 border-b-2 border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
           <h4 className="text-[11px] md:text-body font-black text-slate-500 uppercase tracking-widest">Department Directory</h4>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto custom-scrollbar">
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
                   <tr><td colSpan="4" className="p-20 text-center text-slate-400 font-bold italic">No personnel deployed.</td></tr>
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

        {/* Mobile List View */}
        <div className="md:hidden divide-y-2 divide-slate-50 dark:divide-white/5">
           {employees.length === 0 ? (
             <div className="p-10 text-center text-slate-400 font-bold italic text-[13px]">No personnel deployed.</div>
           ) : employees.map((emp) => (
             <div key={emp.id} className="p-5 space-y-4">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center font-black text-slate-500 uppercase text-[14px]">
                      {emp.name.charAt(0)}
                   </div>
                   <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">{emp.name}</p>
                      <p className="text-[10px] font-bold text-slate-500 truncate">{emp.email}</p>
                   </div>
                </div>
                <div className="flex flex-wrap gap-2">
                   <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-600">{emp.role}</span>
                   {activeDept.head_id === emp.id && (
                     <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-purple-100 text-purple-600">Unit Head</span>
                   )}
                </div>
                <div className="pt-2 border-t border-slate-50 dark:border-white/5">
                   <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Strategic Team</label>
                   <select
                      value={emp.team_id || ""}
                      onChange={(e) => handleAssignTeam(emp.id, e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-white/5 rounded-lg px-3 py-2 text-[9px] font-black uppercase tracking-widest outline-none"
                   >
                      <option value="">No Team Assigned</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                   </select>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
    </div>
  )
}

export default MembersPanel

