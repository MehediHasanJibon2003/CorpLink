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
    <div className="flex gap-4 overflow-x-auto pb-4 items-start min-h-[600px]">
      {COLUMNS.map(col => (
        <div 
          key={col.id} 
          className={`flex-shrink-0 w-80 rounded-xl border ${col.color} p-3 flex flex-col max-h-[80vh]`}
          onDragOver={e => e.preventDefault()}
          onDrop={e => handleDrop(e, col.id)}
        >
          <div className="flex justify-between items-center mb-4 px-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-100">{col.title}</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${col.badge}`}>
              {tasks.filter(t => t.status === col.id).length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 px-1 custom-scrollbar">
            {tasks.filter(t => t.status === col.id).map(task => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onClick={() => onTaskClick(task)}
                className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${task.priority === 'high' ? 'text-red-500' : task.priority === 'medium' ? 'text-purple-500' : 'text-slate-400'}`}>
                    {task.priority || "Normal"}
                  </span>
                  {task.deadline && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 rounded flex items-center">
                      ⏱ {new Date(task.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <h5 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-1">{task.title}</h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{task.description}</p>
                
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">
                      {task.assignee.charAt(0)}
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{task.assignee}</span>
                  </div>
                  <span className="text-xs text-slate-400 hover:text-blue-500 transition cursor-pointer">
                    💬 Details
                  </span>
                </div>
              </div>
            ))}
            
            {tasks.filter(t => t.status === col.id).length === 0 && (
              <div className="border-2 border-dashed border-slate-300/50 dark:border-slate-600/50 rounded-lg p-6 flex flex-col justify-center items-center text-slate-400 dark:text-slate-600 italic text-sm">
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
