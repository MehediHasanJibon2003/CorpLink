import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import SuperAdminLayout from "../../components/superadmin/layout/SuperAdminLayout"
import { 
  ToggleLeft, ToggleRight, Building2, ShieldCheck, 
  Palette, Save, Upload, AlertCircle, RefreshCw 
} from "lucide-react"

const DEFAULT_MODULES = [
  { key: "task_management", label: "Task",  desc: "Projects & tasks" },
  { key: "messaging",       label: "Chat",  desc: "Internal messaging" },
  { key: "collaboration",   label: "Collab", desc: "Partner discovery" },
  { key: "news_feed",       label: "Feed",  desc: "Notice board" },
  { key: "analytics",       label: "Charts", desc: "Data reports" },
  { key: "departments",     label: "Teams",  desc: "Team management" },
]

export default function PlatformSettings() {
  const [activeTab, setActiveTab] = useState("modules")
  const [companies, setCompanies] = useState([])
  const [selectedCo, setSelectedCo] = useState(null)
  const [moduleSettings, setModuleSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)

  const [systemRules, setSystemRules] = useState({
    password_min_length: 8,
    require_symbols: true,
    maintenance_mode: false,
    max_login_attempts: 5,
    registration_open: true
  })
  const [branding, setBranding] = useState({
    platform_name: "CorpLink",
    primary_color: "#8b5cf6",
    logo_url: null
  })

  useEffect(() => {
    const loadInit = async () => {
      const { data: comps } = await supabase.from("companies").select("id, name").eq("status", "active").order("name")
      setCompanies(comps || [])
      if (comps?.length) setSelectedCo(comps[0])
      setLoading(false)
    }
    loadInit()
  }, [])

  useEffect(() => {
    if (!selectedCo) return
    supabase.from("platform_settings").select("module_name, is_active").eq("corporate_id", selectedCo.id)
      .then(({ data }) => {
        const map = {}
        data?.forEach(s => { map[s.module_name] = s.is_active })
        DEFAULT_MODULES.forEach(m => { if (!(m.key in map)) map[m.key] = true })
        setModuleSettings(map)
      })
  }, [selectedCo])

  const toggleModule = async (moduleKey) => {
    if (!selectedCo) return
    const newVal = !moduleSettings[moduleKey]
    setSaving(moduleKey)
    setModuleSettings(prev => ({ ...prev, [moduleKey]: newVal }))
    await supabase.from("platform_settings").upsert({ corporate_id: selectedCo.id, module_name: moduleKey, is_active: newVal }, { onConflict: "corporate_id,module_name" })
    setSaving(null)
  }

  return (
    <SuperAdminLayout title="Platform Settings" subtitle="Branding and system rules">
      
      {/* Responsive Tab Navigation */}
      <div className="flex gap-3 md:gap-6 mb-8 md:mb-12 overflow-x-auto pb-2 no-scrollbar">
        {[
          { id: "modules", label: "Modules", icon: Building2 },
          { id: "system",  label: "Rules",   icon: ShieldCheck },
          { id: "branding", label: "Branding", icon: Palette },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 md:gap-3 px-6 md:px-8 py-3.5 md:py-5 rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest transition-all border-2 shrink-0 ${
              activeTab === tab.id 
                ? "bg-violet-600 text-white border-violet-600 shadow-lg" 
                : "bg-white dark:bg-white/5 text-slate-500 dark:text-violet-400 border-slate-100 dark:border-violet-500/15"
            }`}
          >
            <tab.icon className="h-4 w-4 md:h-5 md:w-5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative z-10">
        
        {/* TAB 1: MODULE ACTIVATION */}
        {activeTab === "modules" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Company Selector */}
            <div className="rounded-3xl p-6 md:p-8 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15">
              <h3 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Corporates</h3>
              {loading ? (
                <div className="flex justify-center py-10"><RefreshCw className="h-6 w-6 animate-spin text-violet-500" /></div>
              ) : (
                <div className="space-y-2 max-h-[300px] lg:max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {companies.map(co => (
                    <button
                      key={co.id}
                      onClick={() => setSelectedCo(co)}
                      className={`w-full text-left px-4 md:px-6 py-3 md:py-4 rounded-xl font-black uppercase text-[10px] md:text-xs tracking-widest transition-all border-2 ${
                        selectedCo?.id === co.id 
                          ? "bg-violet-600 text-white border-transparent" 
                          : "bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-violet-300 border-slate-100 dark:border-white/5"
                      }`}
                    >
                      {co.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Modules Grid */}
            <div className="lg:col-span-2 rounded-3xl p-6 md:p-10 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {DEFAULT_MODULES.map(mod => {
                  const active = moduleSettings[mod.key] ?? true
                  return (
                    <div key={mod.key} className={`p-5 md:p-6 rounded-2xl border-2 transition-all ${active ? "bg-violet-50/50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-500/30" : "opacity-60 bg-slate-50 dark:bg-white/[0.02] border-transparent"}`}>
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-sm md:text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white truncate">{mod.label}</p>
                          <p className="text-[10px] md:text-xs font-bold text-slate-500 truncate">{mod.desc}</p>
                        </div>
                        <button onClick={() => toggleModule(mod.key)} disabled={saving === mod.key}>
                          {active ? <ToggleRight className="h-10 w-10 text-violet-600" /> : <ToggleLeft className="h-10 w-10 text-slate-300" />}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SYSTEM RULES */}
        {activeTab === "system" && (
          <div className="rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
              <div className="space-y-8">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Security</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">Password Length</label>
                    <input type="number" value={systemRules.password_min_length} onChange={e=>setSystemRules({...systemRules, password_min_length: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10 rounded-xl px-4 py-3 outline-none font-bold text-slate-900 dark:text-white" />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10">
                    <p className="font-black uppercase text-[10px] md:text-xs tracking-widest text-slate-900 dark:text-white">Require Symbols</p>
                    <button onClick={()=>setSystemRules({...systemRules, require_symbols: !systemRules.require_symbols})}>
                      {systemRules.require_symbols ? <ToggleRight className="h-10 w-10 text-emerald-500" /> : <ToggleLeft className="h-10 w-10 text-slate-300" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Status</h3>
                <div className="space-y-4">
                  <div className={`p-6 rounded-2xl border-2 ${systemRules.maintenance_mode ? 'bg-red-50 dark:bg-red-950/20 border-red-200' : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-black uppercase tracking-widest text-xs text-slate-900 dark:text-white">Maintenance Mode</p>
                      <button onClick={()=>setSystemRules({...systemRules, maintenance_mode: !systemRules.maintenance_mode})}>
                        {systemRules.maintenance_mode ? <ToggleRight className="h-10 w-10 text-red-500" /> : <ToggleLeft className="h-10 w-10 text-emerald-500" />}
                      </button>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500">{systemRules.maintenance_mode ? "Locked for Users" : "System Live"}</p>
                  </div>
                </div>
                <button className="w-full bg-violet-600 py-4 rounded-xl text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl">Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BRANDING */}
        {activeTab === "branding" && (
          <div className="rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
              <div className="space-y-8">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Identity</h3>
                <div className="space-y-4">
                   <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">Platform Name</label>
                    <input type="text" value={branding.platform_name} onChange={e=>setBranding({...branding, platform_name: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10 rounded-xl px-4 py-3 outline-none font-bold text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">Theme Color</label>
                    <div className="flex items-center gap-4">
                      <input type="color" value={branding.primary_color} onChange={e=>setBranding({...branding, primary_color: e.target.value})} className="h-12 w-24 rounded-lg bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 cursor-pointer" />
                      <p className="font-mono font-bold text-slate-500">{branding.primary_color}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Assets</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-500">Logo</p>
                    <div className="aspect-square rounded-2xl bg-slate-50 dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center relative overflow-hidden group cursor-pointer">
                      <Upload className="h-6 w-6 text-slate-300" />
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-500">Favicon</p>
                    <div className="aspect-square rounded-2xl bg-slate-50 dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center relative overflow-hidden group cursor-pointer">
                      <Upload className="h-6 w-6 text-slate-300" />
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  </div>
                </div>
                <button className="w-full bg-emerald-600 py-4 rounded-xl text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl">Apply Assets</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  )
}
