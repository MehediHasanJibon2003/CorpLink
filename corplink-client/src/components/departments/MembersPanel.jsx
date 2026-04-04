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
    <div className="space-y-6">
      
      {/* Assign Member to Dept Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-slate-800">Add Employee to Department</h4>
          <p className="text-xs text-slate-500 mt-1">Select an employee from the company to join {activeDept.name}.</p>
        </div>
        <form onSubmit={handleAddMemberToDept} className="flex gap-2">
          <select 
            value={selectedNewEmp}
            onChange={e => setSelectedNewEmp(e.target.value)}
            className="border border-slate-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500 text-sm bg-white"
          >
            <option value="">-- Choose Employee --</option>
            {unassignedEmps.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
          <button type="submit" disabled={!selectedNewEmp} className="bg-blue-600 disabled:bg-blue-300 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition text-sm">
            Add to Dept
          </button>
        </form>
      </div>

      {/* Member Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
              <th className="p-4">Employee Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Team Assignment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {employees.length === 0 ? (
              <tr><td colSpan="4" className="p-10 text-center text-slate-500">No employees assigned to this department yet.</td></tr>
            ) : employees.map((emp) => (
            <tr key={emp.id} className="hover:bg-slate-50 transition">
              <td className="p-4 font-semibold text-slate-800">{emp.name}</td>
              <td className="p-4 text-slate-500">{emp.email}</td>
              <td className="p-4">
                <span className="bg-slate-100 px-2 py-1 rounded text-xs font-semibold text-slate-600 capitalize">
                  {emp.role}
                </span>
                {activeDept.head_id === emp.id && (
                  <span className="ml-2 bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">Head of Dept</span>
                )}
              </td>
              <td className="p-4">
                {teams.length === 0 ? (
                  <span className="text-slate-400 italic text-xs">No teams available</span>
                ) : (
                  <select
                    value={emp.team_id || ""}
                    onChange={(e) => handleAssignTeam(emp.id, e.target.value)}
                    className="border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500 text-sm bg-white cursor-pointer"
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
