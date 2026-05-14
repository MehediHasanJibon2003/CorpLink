import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { MoreHorizontal, Plus, Clock, MessageSquare, Paperclip, AlertCircle, CheckCircle2, ChevronRight, User } from "lucide-react"

const COLUMNS = [
  { id: "pending", label: "Backlog / Pending", color: "text-slate-400 bg-slate-100/50" },
  { id: "in_progress", label: "Active Execution", color: "text-blue-500 bg-blue-50" },
  { id: "needs_review", label: "Quality Audit", color: "text-amber-600 bg-amber-50" },
  { id: "finished", label: "Finalized", color: "text-emerald-600 bg-emerald-50" },
  { id: "rejected", label: "Rejected / Blocked", color: "text-red-600 bg-red-50" }
]

function TaskKanban({ activeProject, profile, onTaskClick, triggerRefetch }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = async () => {
    setLoading(true)
    const role = profile?.role?.toLowerCase()
    
    let query = supabase
      .from("tasks")
      .select("*, employees(name)")
      .eq("company_id", profile.company_id)

    // Apply Hierarchy Filters
    if (role !== 'admin') {
      // Dept Head, Manager, Employee, Restricted all filtered by Department
      if (profile.department_id) {
        // Most roles see everything in their department
        query = query.eq("department_id", profile.department_id)
      } else if (role === 'employee' || role === 'restricted') {
        // If no department, just see assigned tasks
        query = query.eq("assigned_to", profile.id)
      }
    }

    if (activeProject) {
      query = query.eq("project_id", activeProject.id)
    } else if (activeProject === null) {
      // Show Global Inbox only if no project is selected
      query = query.is("project_id", null)
    }

    const { data, error } = await query.order("created_at", { ascending: false })
    if (error) console.error("Kanban Fetch Error:", error)
    setTasks(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (profile) fetchTasks()
  }, [activeProject, triggerRefetch, profile])

  if (loading) return <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">Mapping Workspace Workflow...</div>

  return (
    <div className="flex flex-col md:flex-row gap-6 md:gap-8 pb-10 custom-scrollbar md:overflow-x-auto md:snap-x -mx-4 px-4 md:mx-0 md:px-0">
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id)
        
        return (
          <div key={col.id} className="w-full md:min-w-[400px] md:max-w-[400px] flex flex-col md:snap-start">
            <div className={`p-4 md:p-5 rounded-2xl mb-4 md:mb-6 flex justify-between items-center border-2 border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-10`}>
               <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.id === 'finished' ? 'bg-emerald-500' : col.id === 'rejected' ? 'bg-red-500' : 'bg-blue-500'}`} />
                  <h3 className="text-[12px] md:text-body font-black text-slate-800 dark:text-white uppercase tracking-widest">{col.label}</h3>
               </div>
               <span className="bg-slate-100 dark:bg-white/10 text-slate-500 px-2.5 py-1 rounded-lg text-[10px] font-black">{colTasks.length}</span>
            </div>

            <div className="flex-1 space-y-4 md:space-y-6">
              {colTasks.length === 0 ? (
                <div className="py-16 md:py-20 text-center bg-slate-50/50 dark:bg-white/5 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-white/5">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Active Missions</p>
                </div>
              ) : colTasks.map(task => (
                <div 
                  key={task.id} 
                  onClick={() => onTaskClick(task)}
                  className="group bg-white dark:bg-slate-800 p-5 md:p-8 rounded-[2rem] border-2 border-slate-100 dark:border-white/5 shadow-sm hover:border-blue-500/30 hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1 active:scale-[0.98]"
                >
                  <div className="flex justify-between items-start mb-4">
                     <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] ${
                       task.priority === 'high' ? 'bg-red-100 text-red-600' : 
                       task.priority === 'medium' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                     }`}>
                       {task.priority}
                     </span>
                     <MoreHorizontal className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                  </div>
                  
                  <h4 className="text-body md:text-heading-2 font-black text-slate-800 dark:text-white uppercase tracking-tight mb-4 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">{task.title}</h4>
                  
                  <div className="flex flex-wrap gap-4 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-50 dark:border-white/5">
                     <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <User className="h-3 w-3 md:h-3.5 md:w-3.5 text-blue-500" /> {task.employees?.name?.split(' ')[0] || "No Agent"}
                     </div>
                     <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Clock className="h-3 w-3 md:h-3.5 md:w-3.5 text-amber-500" /> {task.deadline ? new Date(task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' }) : "TBD"}
                     </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-3 opacity-60 md:opacity-40 group-hover:opacity-100 transition-opacity">
                     <button 
                        onClick={(e) => { e.stopPropagation(); onTaskClick(task, "comments"); }}
                        className="flex items-center gap-1 text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase transition-colors p-1"
                     >
                        <MessageSquare className="h-3 w-3" /> Update
                     </button>
                     <button 
                        onClick={(e) => { e.stopPropagation(); onTaskClick(task, "attachments"); }}
                        className="flex items-center gap-1 text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase transition-colors p-1"
                     >
                        <Paperclip className="h-3 w-3" /> Asset
                     </button>
                  </div>
                </div>
              ))}
              
              {col.id === 'pending' && (
                <button className="w-full py-6 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[2rem] text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-all flex flex-col items-center gap-2 group active:scale-95">
                   <div className="w-10 h-10 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center group-hover:bg-blue-50 transition-all">
                      <Plus className="h-6 w-6" />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest">Initiate Task</span>
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default TaskKanban

