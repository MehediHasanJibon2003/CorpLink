import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

const COLUMNS = [
  { id: "pending", title: "Pending", color: "bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700", badge: "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200" },
  { id: "in_progress", title: "In Progress", color: "bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/50", badge: "bg-blue-200 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300" },
  { id: "needs_review", title: "Needs Review", color: "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40", badge: "bg-amber-200 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300" },
  { id: "finished", title: "Completed", color: "bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900/40", badge: "bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-300" },
  { id: "rejected", title: "Rejected", color: "bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/40", badge: "bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-300" }
]

function TaskKanban({ activeProject, profile, onTaskClick, triggerRefetch }) {
  const [tasks, setTasks] = useState([])
  const [employees, setEmployees] = useState([])
  
  const fetchTasks = async () => {
    let query = supabase.from("tasks").select("*")
    if (activeProject) {
      query = query.eq("project_id", activeProject.id)
    } else {
      query = query.is("project_id", null)
    }
    query = query.eq("company_id", profile.company_id).order("created_at", { ascending: false })

    const { data: tasksData } = await query
    const { data: empsData } = await supabase.from("employees").select("id, name").eq("company_id", profile.company_id)
    
    if (tasksData && empsData) {
      const mapped = tasksData.map(t => {
        const e = empsData.find(emp => emp.id === t.assigned_to)
        return { ...t, assignee: e ? e.name : "Unassigned" }
      })
      setTasks(mapped)
      setEmployees(empsData)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [activeProject, profile, triggerRefetch])

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("taskId", taskId)
  }

  const handleDrop = async (e, newStatus) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData("taskId")
    if (!taskId) return
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId)
  }

  return (
    <div className="flex gap-6 md:gap-8 overflow-x-auto pb-6 items-start min-h-[700px] custom-scrollbar">
      {COLUMNS.map(col => (
        <div 
          key={col.id} 
          className={`flex-shrink-0 w-80 md:w-[26rem] rounded-2xl border-2 ${col.color} p-4 md:p-6 flex flex-col max-h-[85vh]`}
          onDragOver={e => e.preventDefault()}
          onDrop={e => handleDrop(e, col.id)}
        >
          <div className="flex justify-between items-center mb-6 px-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg md:text-2xl">{col.title}</h4>
            <span className={`text-sm md:text-base px-3 py-1 rounded-full font-bold ${col.badge}`}>
              {tasks.filter(t => t.status === col.id).length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 px-1 custom-scrollbar">
            {tasks.filter(t => t.status === col.id).map(task => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onClick={() => onTaskClick(task)}
                className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-xl md:rounded-2xl shadow-sm border md:border-2 border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-3 md:mb-4">
                  <span className={`text-xs md:text-sm uppercase font-bold tracking-wider ${task.priority === 'high' ? 'text-red-500' : task.priority === 'medium' ? 'text-purple-500' : 'text-slate-400'}`}>
                    {task.priority || "Normal"}
                  </span>
                  {task.deadline && (
                    <span className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md md:rounded-lg flex items-center">
                      ⏱ {new Date(task.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <h5 className="font-bold text-slate-800 dark:text-slate-100 text-base md:text-xl mb-2 leading-snug">{task.title}</h5>
                <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">{task.description}</p>
                
                <div className="flex justify-between items-center mt-4 md:mt-5 pt-4 md:pt-5 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs md:text-sm font-black border border-blue-200 dark:border-blue-800/50">
                      {task.assignee.charAt(0)}
                    </div>
                    <span className="text-sm md:text-base font-bold text-slate-600 dark:text-slate-300">{task.assignee}</span>
                  </div>
                  <span className="text-sm md:text-base font-semibold text-slate-400 hover:text-blue-500 transition cursor-pointer flex items-center gap-1">
                    💬 Details
                  </span>
                </div>
              </div>
            ))}
            
            {tasks.filter(t => t.status === col.id).length === 0 && (
              <div className="border-2 border-dashed border-slate-300/50 dark:border-slate-600/50 rounded-xl md:rounded-2xl p-8 md:p-10 flex flex-col justify-center items-center text-slate-400 dark:text-slate-500 font-medium italic text-base md:text-lg">
                Drop task here
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default TaskKanban
