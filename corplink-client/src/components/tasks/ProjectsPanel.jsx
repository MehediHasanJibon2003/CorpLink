import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { logAdminActivity } from "../../utils/logger"
import { FolderKanban, Plus, Trash2, Building, Layout, ChevronRight, Activity, CheckCircle2, Edit3, X } from "lucide-react"
import { useConfirm } from "../../context/ConfirmContext"

function ProjectsPanel({ profile, user, onSelectProject }) {
  const { showConfirm } = useConfirm()
  const [projects, setProjects] = useState([])
  const [departments, setDepartments] = useState([])
  const [projectStats, setProjectStats] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({ name: "", description: "", department_id: "" })

  const fetchProjectsData = async () => {
    const role = profile?.role?.toLowerCase()
    
    let projQuery = supabase.from("projects").select("*").eq("company_id", profile.company_id)
    
    // Apply Hierarchy Filter
    if (role !== 'admin' && profile.department_id) {
      projQuery = projQuery.eq("department_id", profile.department_id)
    }

    const [projRes, deptRes, tasksRes] = await Promise.all([
      projQuery.order("created_at", { ascending: false }),
      supabase.from("departments").select("id, name").eq("company_id", profile.company_id),
      supabase.from("tasks").select("project_id, status").eq("company_id", profile.company_id)
    ])

    if (!deptRes.error && deptRes.data) setDepartments(deptRes.data)
    
    const stats = {}
    tasksRes.data?.forEach(t => {
      const pid = t.project_id || 'inbox'
      if (!stats[pid]) stats[pid] = { total: 0, completed: 0 }
      stats[pid].total++
      if (t.status === 'finished') stats[pid].completed++
    })
    setProjectStats(stats)

    if (!projRes.error && projRes.data) {
      const mapped = projRes.data.map(p => {
        const d = deptRes.data?.find(dept => dept.id === p.department_id)
        return { ...p, department_name: d ? d.name : "Company-wide" }
      })
      setProjects(mapped)
    }
  }

  useEffect(() => {
    if (profile) fetchProjectsData()
  }, [profile])

  const handleEdit = (proj) => {
    setForm({
      name: proj.name,
      description: proj.description || "",
      department_id: proj.department_id || ""
    })
    setEditingId(proj.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => {
    setForm({ name: "", description: "", department_id: "" })
    setEditingId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    setError("")

    try {
      if (editingId) {
        // Update Existing Project
        const { error } = await supabase.from("projects").update({
          name: form.name.trim(),
          description: form.description.trim(),
          department_id: form.department_id || null
        }).eq("id", editingId)

        if (error) throw error
        await logAdminActivity({
          company_id: profile.company_id, user_id: user.id,
          action: `Updated Project: ${form.name.trim()}`, entity: "project"
        })
      } else {
        // Create New Project
        const { data: insertData, error: insertError } = await supabase.from("projects").insert([{
          name: form.name.trim(),
          description: form.description.trim(),
          department_id: form.department_id || null,
          company_id: profile.company_id
        }]).select()

        if (insertError) throw insertError

        // --- AUTO CHAT GROUP CREATION ---
        if (insertData && insertData.length > 0) {
          await supabase.from("chat_groups").insert([{
            name: `${form.name.trim()} Workspace`,
            company_id: profile.company_id,
            type: 'project',
            reference_id: insertData[0].id
          }])
        }
        // --------------------------------

        await logAdminActivity({
          company_id: profile.company_id, user_id: user.id,
          action: `Established Project: ${form.name.trim()}`, entity: "project"
        })
      }
      resetForm()
      fetchProjectsData()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (id, name) => {
    showConfirm({
      title: "Delete Project",
      message: `Are you sure you want to permanently delete project "${name}"?`,
      onConfirm: async () => {
        await supabase.from("projects").delete().eq("id", id)
        fetchProjectsData()
        await logAdminActivity({
          company_id: profile.company_id, user_id: user.id,
          action: `Deleted Project: ${name}`, entity: "project", severity: "warning"
        })
      }
    })
  }

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-500">
      
      {/* Creation/Edit HUD */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border-2 border-slate-100 dark:border-white/5 p-8 md:p-12">
        <div className="flex justify-between items-center mb-8">
           <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
             {editingId ? <Edit3 className="h-6 w-6 text-amber-500" /> : <Plus className="h-6 w-6 text-blue-500" />} 
             {editingId ? "Update Project Parameters" : "Initialize Enterprise Project"}
           </h3>
           {editingId && (
             <button onClick={resetForm} className="text-slate-400 hover:text-red-500 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
               <X className="h-4 w-4" /> Cancel Edit
             </button>
           )}
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Strategic Title" className="bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:border-blue-500 outline-none transition-all" />
          <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Objective" className="bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:border-blue-500 outline-none transition-all" />
          <select value={form.department_id} onChange={e => setForm({...form, department_id: e.target.value})} className="bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-white/5 rounded-2xl px-4 py-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500">
            <option value="">Global Unit</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button type="submit" disabled={loading} className={`${editingId ? 'bg-amber-500' : 'bg-blue-600'} text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all hover:scale-[1.02]`}>
            {loading ? "Processing..." : editingId ? "Update Project" : "Launch Project"}
          </button>
        </form>
        {error && <p className="text-red-500 text-xs font-bold mt-4 bg-red-50 p-3 rounded-xl">{error}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Inbox / Default Card */}
        <div className="bg-slate-100 dark:bg-white/5 rounded-[2.5rem] p-10 flex flex-col justify-between border-2 border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all">
          <div>
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
               <Activity className="h-8 w-8 text-slate-400" />
            </div>
            <h4 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Global Inbox</h4>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1 mb-6">Unassigned Workflow</p>
            
            {projectStats['inbox'] && (
              <div className="space-y-2">
                 <div className="flex justify-between text-[10px] font-black uppercase">
                    <span className="text-slate-400">Activity Level</span>
                    <span className="text-slate-700 dark:text-slate-300">{Math.round((projectStats['inbox'].completed / projectStats['inbox'].total) * 100)}%</span>
                 </div>
                 <div className="h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-400" style={{ width: `${(projectStats['inbox'].completed / projectStats['inbox'].total) * 100}%` }} />
                 </div>
              </div>
            )}
          </div>
          <button onClick={() => onSelectProject(null)} className="mt-12 w-full py-4 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-md hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
            Explore Workflow <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {projects.map(proj => {
          const stats = projectStats[proj.id] || { total: 0, completed: 0 }
          const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
          
          return (
            <div key={proj.id} className="group bg-white dark:bg-slate-800 rounded-[2.5rem] border-2 border-slate-100 dark:border-white/5 p-10 shadow-sm hover:border-blue-500/30 transition-all flex flex-col justify-between hover:-translate-y-1">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                    <Layout className="h-8 w-8" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(proj)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Edit3 className="h-5 w-5" /></button>
                    <button onClick={() => handleDelete(proj.id, proj.name)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 className="h-5 w-5" /></button>
                  </div>
                </div>
                <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">{proj.name}</h4>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-6 flex items-center gap-2"><Building className="h-3 w-3" /> {proj.department_name}</p>
                
                <div className="space-y-3">
                   <div className="flex justify-between text-[10px] font-black uppercase">
                      <span className="text-slate-400">Project Velocity</span>
                      <span className="text-blue-600">{progress}%</span>
                   </div>
                   <div className="h-2 bg-slate-50 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)] transition-all duration-1000" style={{ width: `${progress}%` }} />
                   </div>
                   <div className="flex gap-4 mt-2">
                      <div className="text-[10px] font-black text-slate-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> {stats.completed} Done</div>
                      <div className="text-[10px] font-black text-slate-400 flex items-center gap-1"><Activity className="h-3 w-3 text-blue-500" /> {stats.total} Total</div>
                   </div>
                </div>
              </div>
              <button onClick={() => onSelectProject(proj)} className="mt-12 w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                Launch Board <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProjectsPanel
