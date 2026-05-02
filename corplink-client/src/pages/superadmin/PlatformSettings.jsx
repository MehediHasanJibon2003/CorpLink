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
      <div className="grid lg:grid-cols-3 gap-6 relative z-10">
        {/* Company Selector */}
        <div className="rounded-3xl p-6 relative overflow-hidden"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(139,92,246,0.15)", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
          {/* Subtle glow */}
          <div className="absolute -top-10 -left-10 w-32 h-32 opacity-20 blur-2xl" style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.1))" }}>
              <Building2 className="h-4 w-4 text-violet-400" />
            </div>
            <h3 className="text-xs font-black text-violet-400 uppercase tracking-widest">Select Corporate</h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
               <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : companies.length === 0 ? (
            <p className="text-violet-400/70 text-sm text-center py-10">No active companies</p>
          ) : (
            <div className="space-y-2 relative z-10 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {companies.map(co => {
                const isActive = selectedCo?.id === co.id
                return (
                  <button
                    key={co.id}
                    onClick={() => setSelectedCo(co)}
                    className="w-full text-left px-5 py-3.5 rounded-2xl text-sm font-bold transition-all relative group overflow-hidden"
                    style={isActive 
                      ? { background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "white", boxShadow: "0 4px 15px rgba(124,58,237,0.3)" }
                      : { background: "rgba(255,255,255,0.02)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.1)" }
                    }
                  >
                    {!isActive && <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    <div className="flex items-center justify-between relative z-10">
                      <span>{co.name}</span>
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Module Toggles */}
        <div className="lg:col-span-2 rounded-3xl p-6 relative overflow-hidden"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(139,92,246,0.15)", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
          
          <div className="absolute top-0 right-0 w-64 h-64 opacity-10 blur-3xl" style={{ background: "radial-gradient(circle, #4f46e5, transparent)" }} />

          <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.1))" }}>
              <Settings2 className="h-4 w-4 text-blue-400" />
            </div>
            <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest">Module Access Configuration</h3>
          </div>
          
          {selectedCo && (
            <div className="mb-6 relative z-10 inline-flex px-4 py-2 rounded-xl" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
              <p className="text-sm text-blue-300 font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                Configuring: <span className="text-white tracking-wide">{selectedCo.name}</span>
              </p>
            </div>
          )}

          {!selectedCo ? (
            <div className="text-center py-20 relative z-10">
              <Settings2 className="h-16 w-16 text-violet-500/20 mx-auto mb-4" />
              <p className="text-violet-400 text-lg font-bold">Select a company first</p>
              <p className="text-violet-500/70 text-sm mt-2">Choose a corporate account from the list to manage its modules.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4 relative z-10">
              {DEFAULT_MODULES.map(mod => {
                const active = settings[mod.key] ?? true
                return (
                  <div
                    key={mod.key}
                    className="p-5 rounded-2xl transition-all duration-300 relative overflow-hidden group"
                    style={active 
                      ? { background: "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(79,70,229,0.05))", border: "1px solid rgba(139,92,246,0.3)", boxShadow: "0 4px 20px rgba(124,58,237,0.05)" }
                      : { background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", opacity: 0.7 }
                    }
                  >
                    {active && <div className="absolute top-0 left-0 w-1 h-full" style={{ background: "linear-gradient(180deg, #7c3aed, #4f46e5)" }} />}
                    
                    <div className="flex items-start justify-between relative z-10">
                      <div className="pr-4">
                        <p className={`text-sm font-black mb-1 ${active ? "text-white" : "text-violet-400/60"}`}>{mod.label}</p>
                        <p className={`text-xs ${active ? "text-violet-300/80" : "text-violet-500/50"}`}>{mod.desc}</p>
                      </div>
                      <button 
                        onClick={() => toggle(mod.key)} 
                        disabled={saving === mod.key} 
                        className="transition-transform active:scale-95 disabled:opacity-50 mt-1"
                      >
                        {active ? (
                          <ToggleRight className="h-9 w-9 text-violet-400 hover:text-violet-300 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)] transition-all" />
                        ) : (
                          <ToggleLeft className="h-9 w-9 text-violet-500/40 hover:text-violet-400/60 transition-colors" />
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
