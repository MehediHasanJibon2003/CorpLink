import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

const COLUMNS = [
  { id: "pending", title: "Pending", color: "bg-slate-100 border-slate-200", badge: "bg-slate-200 text-slate-700" },
  { id: "in_progress", title: "In Progress", color: "bg-blue-50 border-blue-100", badge: "bg-blue-200 text-blue-800" },
  { id: "needs_review", title: "Needs Review", color: "bg-amber-50 border-amber-100", badge: "bg-amber-200 text-amber-800" },
  { id: "finished", title: "Completed", color: "bg-green-50 border-green-100", badge: "bg-green-200 text-green-800" },
  { id: "rejected", title: "Rejected", color: "bg-red-50 border-red-100", badge: "bg-red-200 text-red-800" }
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
    
    // Scoped to company
    query = query.eq("company_id", profile.company_id).order("created_at", { ascending: false })

    const { data: tasksData } = await query
    const { data: empsData } = await supabase.from("employees").select("id, name").eq("company_id", profile.company_id)
    
    // Map assignments
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

    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))

    // DB update
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
            <h4 className="font-bold text-slate-800">{col.title}</h4>
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
                className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-blue-300 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${task.priority === 'high' ? 'text-red-500' : task.priority === 'medium' ? 'text-purple-500' : 'text-slate-400'}`}>
                    {task.priority || "Normal"}
                  </span>
                  {task.deadline && (
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 rounded flex items-center">
                      ⏱ {new Date(task.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <h5 className="font-semibold text-slate-800 text-sm mb-1">{task.title}</h5>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{task.description}</p>
                
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                      {task.assignee.charAt(0)}
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{task.assignee}</span>
                  </div>
                  <span className="text-xs text-slate-400 hover:text-blue-500 transition cursor-pointer">
                    💬 Details
                  </span>
                </div>
              </div>
            ))}
            
            {tasks.filter(t => t.status === col.id).length === 0 && (
              <div className="border-2 border-dashed border-slate-300/50 rounded-lg p-6 flex flex-col justify-center items-center text-slate-400 italic text-sm">
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
