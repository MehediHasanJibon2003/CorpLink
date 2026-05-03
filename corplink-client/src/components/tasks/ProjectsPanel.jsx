import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { logAdminActivity } from "../../utils/logger"

function ProjectsPanel({ profile, user, onSelectProject }) {
  const [projects, setProjects] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({ name: "", description: "", department_id: "" })

  const fetchProjects = async () => {
    const [projRes, deptRes] = await Promise.all([
      supabase.from("projects").select("*").eq("company_id", profile.company_id).order("created_at", { ascending: false }),
      supabase.from("departments").select("id, name").eq("company_id", profile.company_id)
    ])

    if (!deptRes.error && deptRes.data) setDepartments(deptRes.data)
    
    if (!projRes.error && projRes.data) {
      // Manual mapping to avoid FK errors
      const mapped = projRes.data.map(p => {
        const d = deptRes.data?.find(dept => dept.id === p.department_id)
        return { ...p, department: d ? { name: d.name } : null }
      })
      setProjects(mapped)
    }
  }

  useEffect(() => {
    if (profile) fetchProjects()
  }, [profile])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    setError("")

    const { error } = await supabase.from("projects").insert([{
      name: form.name.trim(),
      description: form.description.trim(),
      department_id: form.department_id || null,
      company_id: profile.company_id
    }])

    if (!error) {
      setForm({ name: "", description: "", department_id: "" })
      fetchProjects()
      await logAdminActivity({
        company_id: profile.company_id, user_id: user.id,
        action: `Created Project: ${form.name.trim()}`, entity: "project"
      })
    } else {
      setError(error.message)
    }
    setLoading(false)
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete project "${name}"? Tasks associated with it will lose their project grouping.`)) return
    await supabase.from("projects").delete().eq("id", id)
    fetchProjects()
    await logAdminActivity({
      company_id: profile.company_id, user_id: user.id,
      action: `Deleted Project: ${name}`, entity: "project", severity: "warning"
    })
  }

  return (
    <div className="space-y-8 md:space-y-12">
      <div className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-10">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xl md:text-3xl mb-6 md:mb-8">Create New Project</h3>
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Project Title" className="border md:border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white placeholder-slate-400 rounded-xl md:rounded-2xl px-4 py-3 md:px-6 md:py-4 outline-none focus:border-blue-500 text-base md:text-lg" />
          <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Short description" className="border md:border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white placeholder-slate-400 rounded-xl md:rounded-2xl px-4 py-3 md:px-6 md:py-4 outline-none focus:border-blue-500 text-base md:text-lg" />
          <select value={form.department_id} onChange={e => setForm({...form, department_id: e.target.value})} className="border md:border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-xl md:rounded-2xl px-4 py-3 md:px-6 md:py-4 outline-none focus:border-blue-500 text-base md:text-lg">
            <option value="">-- No Specific Department --</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl md:rounded-2xl px-6 py-3 md:px-8 md:py-4 text-base md:text-lg shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 transition">
            {loading ? "Creating..." : "Create Project"}
          </button>
        </form>
        {error && <p className="text-red-500 text-sm md:text-lg mt-4 font-medium">{error}</p>}
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-10">
        {/* Default Inbox / Unassigned Board */}
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-10 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-200 dark:bg-slate-700 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 text-2xl md:text-3xl">📥</div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xl md:text-3xl">Inbox / No Project</h4>
            <p className="text-base md:text-xl text-slate-500 dark:text-slate-400 mt-3 md:mt-4 leading-relaxed">Standalone tasks that are not assigned to any specific project workflow.</p>
          </div>
          <button onClick={() => onSelectProject(null)} className="mt-8 md:mt-12 w-full py-3 md:py-4 bg-slate-800 text-white rounded-xl md:rounded-2xl font-bold text-base md:text-xl hover:bg-slate-900 transition shadow-lg hover:-translate-y-0.5">View Tasks</button>
        </div>

        {projects.map(proj => (
          <div key={proj.id} className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-10 flex flex-col justify-between hover:shadow-xl transition-all duration-300 group">
            <div>
              <div className="flex justify-between items-start mb-2 md:mb-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl md:rounded-2xl flex items-center justify-center text-2xl md:text-3xl font-black">
                  {proj.name.charAt(0).toUpperCase()}
                </div>
                <button onClick={() => handleDelete(proj.id, proj.name)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition text-sm md:text-base font-bold bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-lg">Delete</button>
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xl md:text-3xl mt-4 md:mt-6">{proj.name}</h4>
              <p className="text-sm md:text-lg text-blue-600 dark:text-blue-400 font-bold mb-3 md:mb-4 tracking-wide">{proj.department?.name || "Company-wide"}</p>
              <p className="text-base md:text-xl text-slate-500 dark:text-slate-400 leading-relaxed">{proj.description}</p>
            </div>
            <button onClick={() => onSelectProject(proj)} className="mt-8 md:mt-12 w-full py-3 md:py-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl md:rounded-2xl font-bold text-base md:text-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition border md:border-2 border-blue-200 dark:border-blue-800/50 hover:-translate-y-0.5">
              Open Board
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProjectsPanel
