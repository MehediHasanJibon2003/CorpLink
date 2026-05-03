import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import AppLayout from "../components/layout/AppLayout"

import ProjectsPanel from "../components/tasks/ProjectsPanel"
import TaskKanban from "../components/tasks/TaskKanban"
import TaskDetailModal from "../components/tasks/TaskDetailModal"
import PerformanceAnalytics from "../components/tasks/PerformanceAnalytics"
import { logAdminActivity } from "../utils/logger"

function Tasks() {
  const { user, profile } = useAuth()
  
  const [activeTab, setActiveTab] = useState("projects") // projects, kanban, analytics
  const [activeProject, setActiveProject] = useState(null) // null means 'global unassigned'
  const [activeTask, setActiveTask] = useState(null)
  const [triggerRefetch, setTriggerRefetch] = useState(0)

  // Creation Modal state (Task)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState({ title: "", description: "", assigned_to: "", deadline: "", priority: "medium" })

  useEffect(() => {
    if (profile) {
      supabase.from("employees").select("id, name").eq("company_id", profile.company_id).then(res => {
        if (res.data) setEmployees(res.data)
      })
    }
  }, [profile])

  const handleSelectProject = (project) => {
    setActiveProject(project)
    setActiveTab("kanban")
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return

    const insertData = {
      company_id: profile.company_id,
      title: form.title.trim(),
      description: form.description.trim(),
      assigned_to: form.assigned_to || null,
      deadline: form.deadline || null,
      priority: form.priority,
      status: "pending",
      created_by: user.id
    }

    if (activeProject) {
      insertData.project_id = activeProject.id
      insertData.department_id = activeProject.department_id || null
    }

    const { error } = await supabase.from("tasks").insert([insertData])
    if (!error) {
      setShowCreateTask(false)
      setForm({ title: "", description: "", assigned_to: "", deadline: "", priority: "medium" })
      setTriggerRefetch(prev => prev + 1)
      await logAdminActivity({
        company_id: profile.company_id, user_id: user.id, action: `Created task '${insertData.title}'`, entity: "task"
      })
    } else {
      alert(error.message)
    }
  }

  return (
    <AppLayout title="Projects & Tasks" subtitle="Master board for workflows, approvals, and productivity.">
      
      {/* Top Navbar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-3 md:p-5 mb-8 md:mb-12 flex justify-between items-center overflow-x-auto custom-scrollbar">
        <div className="flex gap-2 md:gap-4 min-w-max">
          <button 
            onClick={() => setActiveTab('projects')} 
            className={`px-4 py-2 md:px-6 md:py-3 font-semibold text-sm md:text-lg rounded-lg md:rounded-xl transition ${activeTab === 'projects' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50'}`}
          >
            📂 All Projects
          </button>
          <button 
            onClick={() => setActiveTab('kanban')} 
            className={`px-4 py-2 md:px-6 md:py-3 font-semibold text-sm md:text-lg rounded-lg md:rounded-xl transition ${activeTab === 'kanban' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50'}`}
          >
            📋 {activeProject ? `Board: ${activeProject.name}` : "Global Task Board"}
          </button>
          <button 
            onClick={() => setActiveTab('analytics')} 
            className={`px-4 py-2 md:px-6 md:py-3 font-semibold text-sm md:text-lg rounded-lg md:rounded-xl transition ${activeTab === 'analytics' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50'}`}
          >
            📈 Performance Analytics
          </button>
        </div>
        
        {activeTab === 'kanban' && (
          <button onClick={() => setShowCreateTask(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm md:text-lg px-4 py-2 md:px-8 md:py-3 rounded-lg md:rounded-xl transition shrink-0 ml-4 shadow-lg shadow-blue-500/20 hover:-translate-y-0.5">
            + New Task
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'projects' && (
        <ProjectsPanel profile={profile} user={user} onSelectProject={handleSelectProject} />
      )}

      {activeTab === 'kanban' && (
        <div className="animate-in fade-in duration-300">
          <TaskKanban 
            activeProject={activeProject} 
            profile={profile} 
            onTaskClick={(t) => setActiveTask(t)} 
            triggerRefetch={triggerRefetch}
          />
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="animate-in fade-in duration-300">
          <PerformanceAnalytics profile={profile} />
        </div>
      )}

      {/* Detail Modal Overlay */}
      {activeTask && (
        <TaskDetailModal 
          task={activeTask} 
          profile={profile}
          onClose={() => setActiveTask(null)}
          onUpdate={() => {
            setTriggerRefetch(prev => prev + 1)
            // We just let the kanban board refresh, optionally update activeTask states if needed
            // But since modal stays open, let's close it or keep it open. Keeping open is fine 
            // since fetch inside modal doesn't immediately pull state, but we can do a quick check
            setActiveTask(null) // for simplicity, close after workflow change
          }}
        />
      )}

      {/* Create Task Quick-Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl shadow-xl w-full max-w-2xl p-6 md:p-10">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-2xl md:text-3xl mb-2 md:mb-4">Create New Task</h3>
            <p className="text-sm md:text-lg text-slate-500 dark:text-slate-400 mb-6 md:mb-8">
              {activeProject ? `Adding under project: ${activeProject.name}` : "Adding to Global Inbox"}
            </p>
            <form onSubmit={handleCreateTask} className="space-y-4 md:space-y-6">
              <div>
                <label className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">Title</label>
                <input type="text" required value={form.title} onChange={e=>setForm({...form, title: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg md:rounded-xl px-4 py-3 md:px-5 md:py-4 mt-2 outline-none focus:border-blue-500 text-base md:text-lg bg-slate-50 dark:bg-slate-900/50" />
              </div>
              <div>
                <label className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">Description</label>
                <textarea value={form.description} onChange={e=>setForm({...form, description: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg md:rounded-xl px-4 py-3 md:px-5 md:py-4 mt-2 outline-none focus:border-blue-500 text-base md:text-lg bg-slate-50 dark:bg-slate-900/50" rows="4" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">Assign To</label>
                  <select value={form.assigned_to} onChange={e=>setForm({...form, assigned_to: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg md:rounded-xl px-4 py-3 md:px-5 md:py-4 mt-2 outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 text-base md:text-lg">
                    <option value="">-- Unassigned --</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">Priority</label>
                  <select value={form.priority} onChange={e=>setForm({...form, priority: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg md:rounded-xl px-4 py-3 md:px-5 md:py-4 mt-2 outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 text-base md:text-lg">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">Deadline</label>
                <input type="date" value={form.deadline} onChange={e=>setForm({...form, deadline: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg md:rounded-xl px-4 py-3 md:px-5 md:py-4 mt-2 outline-none focus:border-blue-500 text-base md:text-lg bg-slate-50 dark:bg-slate-900/50" />
              </div>
              <div className="flex justify-end gap-3 md:gap-4 mt-8">
                <button type="button" onClick={() => setShowCreateTask(false)} className="text-slate-500 dark:text-slate-400 font-bold px-6 py-3 md:px-8 md:py-4 text-base md:text-lg hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 md:px-8 md:py-4 text-base md:text-lg rounded-xl transition shadow-lg shadow-blue-500/20 hover:-translate-y-0.5">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AppLayout>
  )
}

export default Tasks