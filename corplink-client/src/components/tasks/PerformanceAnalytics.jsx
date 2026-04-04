import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

function PerformanceAnalytics({ profile }) {
  const [tasks, setTasks] = useState([])
  const [employees, setEmployees] = useState([])
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      const { data: tData } = await supabase.from("tasks").select("*").eq("company_id", profile.company_id)
      const { data: eData } = await supabase.from("employees").select("id, name, role").eq("company_id", profile.company_id)
      if (tData) setTasks(tData)
      if (eData) setEmployees(eData)
    }
    if (profile?.company_id) fetchAnalytics()
  }, [profile])

  const total = tasks.length
  const finished = tasks.filter(t => t.status === "finished").length
  const rejected = tasks.filter(t => t.status === "rejected").length
  const pending = tasks.filter(t => t.status === "pending" || t.status === "in_progress" || t.status === "needs_review").length

  const completionRate = total === 0 ? 0 : Math.round((finished / total) * 100)

  // Top performant employees
  const empStats = employees.map(emp => {
    const empTasks = tasks.filter(t => t.assigned_to === emp.id)
    return {
      ...emp,
      totalAssigned: empTasks.length,
      finishedCount: empTasks.filter(t => t.status === "finished").length
    }
  }).sort((a,b) => b.finishedCount - a.finishedCount).slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-semibold">Total Tasks</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-2">{total}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-b-4 border-b-amber-400">
          <p className="text-slate-500 text-sm font-semibold">Pending / Ongoing</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-2">{pending}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-b-4 border-b-green-500">
          <p className="text-slate-500 text-sm font-semibold">Completed</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-2">{finished}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-b-4 border-b-red-500">
          <p className="text-slate-500 text-sm font-semibold">Rejected</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-2">{rejected}</h3>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl shadow-sm text-white flex flex-col justify-between col-span-2 md:col-span-4 lg:col-span-1">
          <p className="text-slate-300 text-sm font-semibold">Completion Rate</p>
          <div className="flex items-end gap-2 mt-2">
            <h3 className="text-4xl font-bold text-blue-400">{completionRate}%</h3>
          </div>
          <div className="w-full bg-slate-700 h-2 mt-4 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${completionRate}%` }} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Top Performers</h3>
          <p className="text-sm text-slate-500">Based on finished tasks assigned directly to them.</p>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="p-4 font-semibold">Employee</th>
              <th className="p-4 font-semibold">Role</th>
              <th className="p-4 font-semibold text-center">Tasks Assigned</th>
              <th className="p-4 font-semibold text-center">Tasks Completed</th>
              <th className="p-4 font-semibold text-right">Success Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {empStats.map(emp => {
              const rate = emp.totalAssigned === 0 ? 0 : Math.round((emp.finishedCount / emp.totalAssigned) * 100)
              return (
                <tr key={emp.id} className="hover:bg-slate-50">
                  <td className="p-4 font-semibold text-slate-800">{emp.name}</td>
                  <td className="p-4 text-slate-500 capitalize">{emp.role}</td>
                  <td className="p-4 text-center font-medium">{emp.totalAssigned}</td>
                  <td className="p-4 text-center font-bold text-green-600">{emp.finishedCount}</td>
                  <td className="p-4 text-right">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${rate > 70 ? 'bg-green-100 text-green-700' : rate > 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {rate}%
                    </span>
                  </td>
                </tr>
              )
            })}
            {empStats.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-slate-400">No data available</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default PerformanceAnalytics
