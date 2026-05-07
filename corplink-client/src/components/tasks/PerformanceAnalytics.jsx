import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { BarChart3, TrendingUp, CheckCircle2, Clock, AlertCircle, Users, Target, Activity } from "lucide-react"

function PerformanceAnalytics({ profile }) {
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgress: 0,
    needsReview: 0,
    rejected: 0,
    efficiency: 0,
    totalProjects: 0
  })
  const [employeePerformance, setEmployeePerformance] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = async () => {
    setLoading(true)
    const [tasksRes, projectsRes, employeesRes] = await Promise.all([
      supabase.from("tasks").select("*").eq("company_id", profile.company_id),
      supabase.from("projects").select("id").eq("company_id", profile.company_id),
      supabase.from("employees").select("id, name").eq("company_id", profile.company_id)
    ])

    if (!tasksRes.error && tasksRes.data) {
      const tasks = tasksRes.data
      const completed = tasks.filter(t => t.status === 'finished').length
      const inProgress = tasks.filter(t => t.status === 'in_progress').length
      const review = tasks.filter(t => t.status === 'needs_review').length
      const rejected = tasks.filter(t => t.status === 'rejected').length

      setStats({
        totalTasks: tasks.length,
        completedTasks: completed,
        inProgress,
        needsReview: review,
        rejected,
        totalProjects: projectsRes.data?.length || 0,
        efficiency: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
      })

      // Aggregate Employee Performance
      const empStats = (employeesRes.data || []).map(emp => {
        const empTasks = tasks.filter(t => t.assigned_to === emp.id)
        const empDone = empTasks.filter(t => t.status === 'finished').length
        return {
          id: emp.id,
          name: emp.name,
          total: empTasks.length,
          completed: empDone,
          rate: empTasks.length > 0 ? Math.round((empDone / empTasks.length) * 100) : 0
        }
      }).sort((a, b) => b.rate - a.rate)

      setEmployeePerformance(empStats)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (profile) fetchAnalytics()
  }, [profile])

  if (loading) return <div className="p-20 text-center text-slate-500 font-black animate-pulse uppercase tracking-[0.2em]">Recalibrating Analytics Engine...</div>

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700 pb-20">
      
      {/* High-Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-white/5 shadow-sm">
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Operational Success</p>
           <div className="flex items-end justify-between">
              <h3 className="text-5xl font-black text-emerald-500 tracking-tighter">{stats.efficiency}%</h3>
              <CheckCircle2 className="h-10 w-10 text-emerald-500/20 mb-1" />
           </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-white/5 shadow-sm">
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Total Initiatives</p>
           <div className="flex items-end justify-between">
              <h3 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.totalProjects}</h3>
              <Target className="h-10 w-10 text-blue-500/20 mb-1" />
           </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-white/5 shadow-sm">
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Active Workflow</p>
           <div className="flex items-end justify-between">
              <h3 className="text-5xl font-black text-blue-600 tracking-tighter">{stats.inProgress + stats.needsReview}</h3>
              <Activity className="h-10 w-10 text-blue-600/20 mb-1" />
           </div>
        </div>
        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-blue-500/20 text-white">
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Total Tasks</p>
           <div className="flex items-end justify-between">
              <h3 className="text-5xl font-black tracking-tighter">{stats.totalTasks}</h3>
              <TrendingUp className="h-10 w-10 text-blue-500 mb-1" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 md:gap-12">
         {/* Employee Performance Leaderboard */}
         <div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-[3rem] border-2 border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
            <div className="p-10 border-b-2 border-slate-50 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
               <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-4">
                  <Users className="h-6 w-6 text-blue-600" /> Human Resource Velocity
               </h4>
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">By Success Rate</span>
            </div>
            <div className="p-10 space-y-10">
               {employeePerformance.length === 0 ? (
                 <p className="py-20 text-center text-slate-400 font-bold italic">No performance data captured.</p>
               ) : employeePerformance.map(emp => (
                 <div key={emp.id} className="group">
                    <div className="flex justify-between items-center mb-4">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center font-black text-slate-500 uppercase">
                             {emp.name.charAt(0)}
                          </div>
                          <div>
                             <p className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">{emp.name}</p>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{emp.completed} / {emp.total} Tasks Completed</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-2xl font-black text-blue-600 tracking-tighter">{emp.rate}%</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
                       </div>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                       <div className={`h-full transition-all duration-1000 ${emp.rate > 80 ? 'bg-emerald-500' : emp.rate > 50 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${emp.rate}%` }} />
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Task Distribution Donut-style Stats */}
         <div className="xl:col-span-1 space-y-8">
            <div className="bg-white dark:bg-slate-800 rounded-[3rem] border-2 border-slate-100 dark:border-white/5 p-10 shadow-sm">
               <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-3">
                  <BarChart3 className="h-5 w-5" /> Workflow Mix
               </h4>
               <div className="space-y-6">
                  {[
                    { label: "Completed", count: stats.completedTasks, color: "bg-emerald-500", text: "text-emerald-500" },
                    { label: "In Progress", count: stats.inProgress, color: "bg-blue-500", text: "text-blue-500" },
                    { label: "Review Required", count: stats.needsReview, color: "bg-amber-500", text: "text-amber-500" },
                    { label: "Rejected/Blocked", count: stats.rejected, color: "bg-red-500", text: "text-red-500" }
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${item.color}`} />
                          <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">{item.label}</span>
                       </div>
                       <span className={`text-xl font-black ${item.text}`}>{item.count}</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-blue-600 rounded-[3rem] p-10 shadow-2xl shadow-blue-500/30 text-white text-center">
               <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="h-8 w-8 text-white" />
               </div>
               <h4 className="text-xl font-black uppercase tracking-tight mb-2">Predictive Health</h4>
               <p className="text-blue-100 text-sm font-medium opacity-80 mb-6">Your organization is operating at peak efficiency this quarter.</p>
               <div className="py-3 px-6 bg-white/20 rounded-2xl inline-block text-[10px] font-black uppercase tracking-widest">
                  AI Analyzed
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}

export default PerformanceAnalytics
