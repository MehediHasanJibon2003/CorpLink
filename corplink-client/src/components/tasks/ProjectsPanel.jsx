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
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Create New Project</h3>
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Project Title" className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white placeholder-slate-400 rounded-lg px-4 py-2 outline-none focus:border-blue-500" />
          <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Short description" className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white placeholder-slate-400 rounded-lg px-4 py-2 outline-none focus:border-blue-500" />
          <select value={form.department_id} onChange={e => setForm({...form, department_id: e.target.value})} className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-lg px-4 py-2 outline-none focus:border-blue-500">
            <option value="">-- No Specific Department --</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2">
            {loading ? "Creating..." : "Create Project"}
          </button>
        </form>
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Default Inbox / Unassigned Board */}
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center mb-4 text-xl">📥</div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Inbox / No Project</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Standalone tasks that are not assigned to any specific project workflow.</p>
          </div>
          <button onClick={() => onSelectProject(null)} className="mt-6 w-full py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 transition">View Tasks</button>
        </div>

        {projects.map(proj => (
          <div key={proj.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-between hover:shadow-md transition group">
            <div>
              <div className="flex justify-between items-start mb-2">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xl font-bold">
                  {proj.name.charAt(0).toUpperCase()}
                </div>
                <button onClick={() => handleDelete(proj.id, proj.name)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition text-sm">Delete</button>
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg mt-3">{proj.name}</h4>
              <p className="text-xs text-blue-600 font-semibold mb-2">{proj.department?.name || "Company-wide"}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{proj.description}</p>
            </div>
            <button onClick={() => onSelectProject(proj)} className="mt-6 w-full py-2 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition border border-blue-200">
              Open Board
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProjectsPanel
