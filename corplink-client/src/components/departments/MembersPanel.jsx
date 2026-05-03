import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

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
        return { ...emp, teams: teamMatch ? { name: teamMatch.name } : null }
      })
      setEmployees(mappedEmps)
    }

    if (!allEmpsRes.error && allEmpsRes.data) {
      // Find employees not currently in this department
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
    fetchData() // Refresh everything
  }

  const handleAssignTeam = async (employeeId, teamId) => {
    await supabase.from("employees").update({ team_id: teamId || null }).eq("id", employeeId)
    // Optimistic update
    setEmployees(prev => prev.map(emp => {
      if (emp.id === employeeId) {
        const teamMatch = teams.find(t => t.id === teamId)
        return { ...emp, team_id: teamId, teams: teamMatch ? { name: teamMatch.name } : null }
      }
      return emp
    }))
  }

  if (loading) return <div className="p-10 text-center text-slate-500">Loading members...</div>

  return (
    <div className="space-y-8">
      
      {/* Assign Member to Dept Form */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl border-2 border-slate-200 dark:border-slate-700 p-6 md:p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h4 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100">Add Employee to Department</h4>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-2 font-medium">Select an employee from the company to join {activeDept.name}.</p>
        </div>
        <form onSubmit={handleAddMemberToDept} className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <select 
            value={selectedNewEmp}
            onChange={e => setSelectedNewEmp(e.target.value)}
            className="w-full sm:w-auto border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 dark:text-white rounded-xl md:rounded-2xl px-6 py-3 md:px-8 md:py-4 outline-none focus:border-blue-500 text-base md:text-xl font-bold cursor-pointer transition-colors"
          >
            <option value="">-- Choose Employee --</option>
            {unassignedEmps.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
          <button type="submit" disabled={!selectedNewEmp} className="bg-blue-600 disabled:bg-blue-300 hover:bg-blue-700 text-white px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold transition shadow-md text-base md:text-xl w-full sm:w-auto shrink-0">
            Add to Dept
          </button>
        </form>
      </div>

      {/* Member Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl shadow-sm border-2 border-slate-200 dark:border-slate-700 overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b-2 border-slate-200 dark:border-slate-700 text-sm md:text-base uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">
              <th className="p-6 md:p-8 whitespace-nowrap">Employee Name</th>
              <th className="p-6 md:p-8 whitespace-nowrap">Email</th>
              <th className="p-6 md:p-8 whitespace-nowrap">Role</th>
              <th className="p-6 md:p-8 whitespace-nowrap">Team Assignment</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-100 dark:divide-slate-800 text-base md:text-lg">
            {employees.length === 0 ? (
              <tr><td colSpan="4" className="p-10 md:p-16 text-center text-slate-500 text-lg md:text-xl font-medium italic">No employees assigned to this department yet.</td></tr>
            ) : employees.map((emp) => (
            <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
              <td className="p-6 md:p-8 font-black text-xl md:text-2xl text-slate-800 dark:text-slate-100 whitespace-nowrap">{emp.name}</td>
              <td className="p-6 md:p-8 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">{emp.email}</td>
              <td className="p-6 md:p-8 whitespace-nowrap">
                <span className="bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-lg text-sm md:text-base font-bold text-slate-700 dark:text-slate-200 capitalize shadow-sm">
                  {emp.role}
                </span>
                {activeDept.head_id === emp.id && (
                  <span className="ml-3 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50 px-4 py-2 rounded-lg text-sm md:text-base font-bold shadow-sm inline-block mt-2 xl:mt-0">Head of Dept</span>
                )}
              </td>
              <td className="p-6 md:p-8 whitespace-nowrap">
                {teams.length === 0 ? (
                  <span className="text-slate-400 italic font-medium">No teams available</span>
                ) : (
                  <select
                    value={emp.team_id || ""}
                    onChange={(e) => handleAssignTeam(emp.id, e.target.value)}
                    className="border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-xl px-4 py-2 md:px-6 md:py-3 outline-none focus:border-blue-500 text-base md:text-lg cursor-pointer font-bold transition-colors w-full max-w-[250px]"
                  >
                    <option value="">-- No Team --</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  )
}

export default MembersPanel
