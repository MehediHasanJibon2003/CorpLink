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
  const pending = tasks.filter(t => t.status === "pending").length
  const inProgress = tasks.filter(t => t.status === "in_progress").length
  const needsReview = tasks.filter(t => t.status === "needs_review").length

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
    <div className="space-y-8 md:space-y-12">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 md:gap-6">
        <div className="bg-white dark:bg-slate-800 p-5 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-bold uppercase tracking-wider mb-2">Total Tasks</p>
          <h3 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-slate-100">{total}</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm border-b-[6px] border-b-amber-400 flex flex-col justify-between">
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-bold uppercase tracking-wider mb-2">Pending</p>
          <h3 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-slate-100">{pending}</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm border-b-[6px] border-b-blue-500 flex flex-col justify-between">
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-bold uppercase tracking-wider mb-2">In Progress</p>
          <h3 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-slate-100">{inProgress}</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm border-b-[6px] border-b-orange-500 flex flex-col justify-between">
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-bold uppercase tracking-wider mb-2">Needs Review</p>
          <h3 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-slate-100">{needsReview}</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm border-b-[6px] border-b-green-500 flex flex-col justify-between">
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-bold uppercase tracking-wider mb-2">Completed</p>
          <h3 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-slate-100">{finished}</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm border-b-[6px] border-b-red-500 flex flex-col justify-between">
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-bold uppercase tracking-wider mb-2">Rejected</p>
          <h3 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-slate-100">{rejected}</h3>
        </div>
        <div className="bg-slate-800 p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-lg text-white flex flex-col justify-between col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-1 border-b-[6px] border-b-blue-400">
          <p className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-wider mb-2">Success Rate</p>
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-3xl md:text-5xl font-black text-blue-400">{completionRate}%</h3>
            <div className="flex-1 max-w-[120px] bg-slate-700 h-2 md:h-3 rounded-full overflow-hidden">
               <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${completionRate}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-black text-xl md:text-3xl text-slate-800 dark:text-slate-100 mb-2">Top Performers</h3>
          <p className="text-sm md:text-lg text-slate-500 dark:text-slate-400">Based on finished tasks assigned directly to them.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-base md:text-xl min-w-[800px]">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs md:text-sm uppercase tracking-wider">
              <tr>
                <th className="p-4 md:p-6 font-bold">Employee</th>
                <th className="p-4 md:p-6 font-bold">Role</th>
                <th className="p-4 md:p-6 font-bold text-center">Tasks Assigned</th>
                <th className="p-4 md:p-6 font-bold text-center">Tasks Completed</th>
                <th className="p-4 md:p-6 font-bold text-right">Success Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {empStats.map(emp => {
                const rate = emp.totalAssigned === 0 ? 0 : Math.round((emp.finishedCount / emp.totalAssigned) * 100)
                return (
                  <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition duration-200">
                    <td className="p-4 md:p-6 font-bold text-slate-800 dark:text-slate-100">{emp.name}</td>
                    <td className="p-4 md:p-6 text-slate-500 dark:text-slate-400 capitalize font-medium">{emp.role}</td>
                    <td className="p-4 md:p-6 text-center font-bold text-slate-700 dark:text-slate-200">{emp.totalAssigned}</td>
                    <td className="p-4 md:p-6 text-center font-black text-green-600">{emp.finishedCount}</td>
                    <td className="p-4 md:p-6 text-right">
                      <span className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm md:text-base font-black ${rate > 70 ? 'bg-green-100 text-green-700' : rate > 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {rate}%
                      </span>
                    </td>
                  </tr>
                )
              })}
              {empStats.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-400 font-medium italic">No data available</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default PerformanceAnalytics
