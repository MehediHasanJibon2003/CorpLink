import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import SuperAdminLayout from "../../components/superadmin/layout/SuperAdminLayout"
import { ToggleLeft, ToggleRight, Building2, Settings2 } from "lucide-react"

const DEFAULT_MODULES = [
  { key: "task_management", label: "Task Management",  desc: "Projects, Kanban, task tracking" },
  { key: "messaging",       label: "Messaging",         desc: "Direct messages between users" },
  { key: "collaboration",   label: "Collaboration",     desc: "Partner discovery & proposals" },
  { key: "news_feed",       label: "News Feed",         desc: "Corporate announcements & posts" },
  { key: "analytics",       label: "Analytics",         desc: "Performance reports & charts" },
  { key: "departments",     label: "Departments",       desc: "Department & team management" },
]

export default function PlatformSettings() {
  const [companies, setCompanies]    = useState([])
  const [selectedCo, setSelectedCo] = useState(null)
  const [settings, setSettings]     = useState({})
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(null)

  useEffect(() => {
    supabase.from("companies").select("id, name").eq("status", "active").order("name")
      .then(({ data }) => {
        setCompanies(data || [])
        if (data?.length) setSelectedCo(data[0])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!selectedCo) return
    supabase.from("platform_settings").select("module_name, is_active").eq("corporate_id", selectedCo.id)
      .then(({ data }) => {
        const map = {}
        data?.forEach(s => { map[s.module_name] = s.is_active })
        DEFAULT_MODULES.forEach(m => { if (!(m.key in map)) map[m.key] = true })
        setSettings(map)
      })
  }, [selectedCo])

  const toggle = async (moduleKey) => {
    if (!selectedCo) return
    const newVal = !settings[moduleKey]
    setSaving(moduleKey)
    setSettings(prev => ({ ...prev, [moduleKey]: newVal }))
    await supabase.from("platform_settings").upsert(
      { corporate_id: selectedCo.id, module_name: moduleKey, is_active: newVal },
      { onConflict: "corporate_id,module_name" }
    )
    setSaving(null)
  }

  return (
    <SuperAdminLayout title="Platform Settings" subtitle="Control which modules are active for each corporate account">
      <div className="grid lg:grid-cols-3 gap-8 md:gap-12 relative z-10">
        {/* Company Selector */}
        <div className="rounded-3xl md:rounded-[3rem] p-8 md:p-10 relative overflow-hidden bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm dark:shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
          {/* Subtle glow */}
          <div className="absolute -top-10 -left-10 w-32 h-32 opacity-10 dark:opacity-20 blur-2xl" style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
          
          <div className="flex items-center gap-4 mb-8 md:mb-10 relative z-10">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center bg-violet-100 dark:bg-violet-500/10 border-2 border-violet-200 dark:border-violet-500/20 shadow-md">
              <Building2 className="h-5 w-5 md:h-6 md:w-6 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-xs md:text-sm font-black text-slate-500 dark:text-violet-400 uppercase tracking-[0.2em]">Select Corporate</h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
               <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : companies.length === 0 ? (
            <p className="text-slate-500 dark:text-violet-400/70 text-sm text-center py-10">No active companies</p>
          ) : (
            <div className="space-y-3 md:space-y-4 relative z-10 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {companies.map(co => {
                const isActive = selectedCo?.id === co.id
                return (
                  <button
                    key={co.id}
                    onClick={() => setSelectedCo(co)}
                    className={`w-full text-left px-6 md:px-8 py-4 md:py-6 rounded-2xl md:rounded-3xl text-sm md:text-lg font-black uppercase tracking-widest transition-all relative group overflow-hidden border-2 ${
                      isActive 
                        ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white border-transparent shadow-[0_8px_25px_rgba(124,58,237,0.4)] scale-[1.02]" 
                        : "bg-slate-50 dark:bg-white/[0.02] text-slate-700 dark:text-violet-300 border-slate-200 dark:border-violet-500/10 hover:border-violet-500/30"
                    }`}
                  >
                    {!isActive && <div className="absolute inset-0 bg-slate-100 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    <div className="flex items-center justify-between relative z-10">
                      <span>{co.name}</span>
                      {isActive && <div className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_white]" />}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Module Toggles */}
        <div className="lg:col-span-2 rounded-3xl md:rounded-[3rem] p-8 md:p-12 relative overflow-hidden bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm dark:shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
          
          <div className="absolute top-0 right-0 w-64 h-64 opacity-5 dark:opacity-10 blur-3xl" style={{ background: "radial-gradient(circle, #4f46e5, transparent)" }} />
 
          <div className="flex items-center gap-4 md:gap-6 mb-4 relative z-10">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-500/10 border-2 border-blue-100 dark:border-blue-500/20 shadow-md">
              <Settings2 className="h-5 w-5 md:h-6 md:w-6 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="text-xs md:text-sm font-black text-slate-500 dark:text-blue-400 uppercase tracking-[0.2em]">Module Access Configuration</h3>
          </div>
          
          {selectedCo && (
            <div className="mb-8 md:mb-12 relative z-10 inline-flex px-6 py-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border-2 border-blue-100 dark:border-blue-500/20 shadow-lg shadow-blue-500/5">
              <p className="text-sm md:text-lg text-blue-700 dark:text-blue-300 font-black uppercase tracking-widest flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 dark:bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)] animate-pulse" />
                Configuring: <span className="text-slate-900 dark:text-white">{selectedCo.name}</span>
              </p>
            </div>
          )}

          {!selectedCo ? (
            <div className="text-center py-20 relative z-10">
              <Settings2 className="h-16 w-16 text-slate-300 dark:text-violet-500/20 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-violet-400 text-lg font-bold">Select a company first</p>
              <p className="text-slate-400 dark:text-violet-500/70 text-sm mt-2">Choose a corporate account from the list to manage its modules.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6 md:gap-8 relative z-10">
              {DEFAULT_MODULES.map(mod => {
                const active = settings[mod.key] ?? true
                return (
                  <div
                    key={mod.key}
                    className={`p-6 md:p-10 rounded-3xl md:rounded-[2rem] transition-all duration-300 relative overflow-hidden group border-2 ${
                      active 
                        ? "bg-violet-50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-500/30 shadow-md dark:shadow-[0_8px_30px_rgba(124,58,237,0.1)]"
                        : "bg-slate-50 dark:bg-white/[0.01] border-slate-200 dark:border-white/5 opacity-60"
                    }`}
                  >
                    {active && <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-violet-600 to-indigo-600" />}
                    
                    <div className="flex items-start justify-between relative z-10">
                      <div className="pr-4">
                        <p className={`text-base md:text-xl font-black mb-2 uppercase tracking-wide ${active ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-violet-400/60"}`}>{mod.label}</p>
                        <p className={`text-xs md:text-sm font-bold ${active ? "text-slate-600 dark:text-violet-300/80" : "text-slate-400 dark:text-violet-500/50"}`}>{mod.desc}</p>
                      </div>
                      <button 
                        onClick={() => toggle(mod.key)} 
                        disabled={saving === mod.key} 
                        className="transition-transform active:scale-95 disabled:opacity-50 mt-1"
                      >
                        {active ? (
                          <ToggleRight className="h-10 w-10 md:h-12 md:w-12 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 drop-shadow-[0_0_12px_rgba(167,139,250,0.6)] transition-all" />
                        ) : (
                          <ToggleLeft className="h-10 w-10 md:h-12 md:w-12 text-slate-300 dark:text-violet-500/40 hover:text-slate-400 dark:hover:text-violet-400/60 transition-colors" />
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  )
}
