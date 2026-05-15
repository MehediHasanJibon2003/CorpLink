import { useEffect, useState } from "react"
import { supabase } from "../../../lib/supabase"
import { ClipboardList, CheckCircle2, Clock, AlertCircle, TrendingUp } from "lucide-react"

function DepartmentTasksPanel({ activeDept }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("tasks")
      .select("*, employees(name)")
      .eq("department_id", activeDept.id)
      .order("created_at", { ascending: false })

    if (!error) setTasks(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (activeDept) fetchTasks()
  }, [activeDept])

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'finished').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
  }

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  if (loading) return <div className="p-10 text-center text-slate-500">Loading department tasks...</div>

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      
      {/* Mini Stats Card */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-2xl md:rounded-3xl border-2 border-slate-100 dark:border-white/5 shadow-sm">
           <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 md:mb-2">Total Tasks</p>
           <h3 className="text-heading-2 md:text-heading-1 font-black text-slate-800 dark:text-white">{stats.total}</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-2xl md:rounded-3xl border-2 border-slate-100 dark:border-white/5 shadow-sm">
           <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1.5 md:mb-2">Completed</p>
           <h3 className="text-heading-2 md:text-heading-1 font-black text-emerald-600">{stats.completed}</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-2xl md:rounded-3xl border-2 border-slate-100 dark:border-white/5 shadow-sm">
           <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1.5 md:mb-2">Active</p>
           <h3 className="text-heading-2 md:text-heading-1 font-black text-blue-600">{stats.inProgress}</h3>
        </div>
        <div className="bg-blue-600 p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-lg shadow-blue-500/20 text-white">
           <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-blue-100 mb-1.5 md:mb-2">Success Rate</p>
           <h3 className="text-heading-2 md:text-heading-1 font-black">{completionRate}%</h3>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-[2.5rem] border-2 border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="px-6 md:px-8 py-4 md:py-6 border-b-2 border-slate-50 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
           <h4 className="text-[14px] md:text-heading-2 font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2 md:gap-3">
              <ClipboardList className="h-5 w-5 text-blue-500" /> <span className="truncate">Workflow Tracking</span>
           </h4>
        </div>

        <div className="divide-y-2 divide-slate-50 dark:divide-white/5">
           {tasks.length === 0 ? (
             <div className="p-16 md:p-20 text-center text-slate-400 font-bold italic text-[13px]">No tasks found.</div>
           ) : tasks.map(task => (
             <div key={task.id} className="p-6 md:p-8 hover:bg-slate-50 dark:hover:bg-white/5 transition-all group">
                <div className="flex flex-col md:flex-row justify-between gap-4 md:gap-6">
                   <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2 md:mb-3">
                         <span className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest ${
                           task.priority === 'high' ? 'bg-red-100 text-red-600' : 
                           task.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                         }`}>
                           {task.priority}
                         </span>
                         <span className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest ${
                           task.status === 'finished' ? 'bg-emerald-100 text-emerald-600' : 
                           task.status === 'in_progress' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                         }`}>
                           {task.status.replace('_', ' ')}
                         </span>
                      </div>
                      <h5 className="text-[16px] md:text-heading-1 font-black text-slate-900 dark:text-white mb-1.5 md:mb-2 group-hover:text-blue-600 transition-colors truncate">{task.title}</h5>
                      <p className="text-slate-500 dark:text-slate-400 text-[12px] md:text-body font-medium line-clamp-2">{task.description}</p>
                   </div>
                   
                   <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-50 dark:border-white/5">
                      <div className="md:text-right">
                         <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned To</p>
                         <p className="text-[12px] md:text-heading-3 font-black text-slate-800 dark:text-white truncate">{task.employees?.name || "Unassigned"}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Deadline</p>
                         <p className="text-[12px] md:text-body font-bold text-slate-600 dark:text-slate-300">{task.deadline ? new Date(task.deadline).toLocaleDateString() : "No Date"}</p>
                      </div>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  )
}

export default DepartmentTasksPanel

