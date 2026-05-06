import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import SuperAdminLayout from "../../components/superadmin/layout/SuperAdminLayout"
import { 
  ToggleLeft, ToggleRight, Building2, Settings2, ShieldCheck, 
  Palette, Save, Upload, CheckCircle2, AlertCircle, RefreshCw 
} from "lucide-react"

const DEFAULT_MODULES = [
  { key: "task_management", label: "Task Management",  desc: "Projects, Kanban, task tracking" },
  { key: "messaging",       label: "Messaging",         desc: "Direct messages between users" },
  { key: "collaboration",   label: "Collaboration",     desc: "Partner discovery & proposals" },
  { key: "news_feed",       label: "News Feed",         desc: "Corporate announcements & posts" },
  { key: "analytics",       label: "Analytics",         desc: "Performance reports & charts" },
  { key: "departments",     label: "Departments",       desc: "Department & team management" },
]

export default function PlatformSettings() {
  const [activeTab, setActiveTab] = useState("modules") // modules, system, branding
  const [companies, setCompanies]    = useState([])
  const [selectedCo, setSelectedCo] = useState(null)
  const [moduleSettings, setModuleSettings] = useState({})
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(null)

  // Global Config States
  const [systemRules, setSystemRules] = useState({
    password_min_length: 8,
    require_symbols: true,
    maintenance_mode: false,
    max_login_attempts: 5,
    session_timeout: 30,
    registration_open: true
  })
  const [branding, setBranding] = useState({
    platform_name: "CorpLink",
    primary_color: "#8b5cf6",
    logo_url: null,
    favicon_url: null
  })

  useEffect(() => {
    const loadInit = async () => {
      // 1. Load Companies
      const { data: comps } = await supabase.from("companies").select("id, name").eq("status", "active").order("name")
      setCompanies(comps || [])
      if (comps?.length) setSelectedCo(comps[0])

      // 2. Load Global Configs
      const { data: configs } = await supabase.from("platform_config").select("*")
      configs?.forEach(item => {
        if (item.id === "system_rules") setSystemRules(item.config)
        if (item.id === "branding") setBranding(item.config)
      })
      
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

  // --- Actions ---
  const toggleModule = async (moduleKey) => {
    if (!selectedCo) return
    const newVal = !moduleSettings[moduleKey]
    setSaving(moduleKey)
    setModuleSettings(prev => ({ ...prev, [moduleKey]: newVal }))
    await supabase.from("platform_settings").upsert(
      { corporate_id: selectedCo.id, module_name: moduleKey, is_active: newVal },
      { onConflict: "corporate_id,module_name" }
    )
    setSaving(null)
  }

  const saveConfig = async (configId, data) => {
    setSaving(configId)
    const { error } = await supabase.from("platform_config").upsert({ id: configId, config: data })
    if (error) alert("Error saving settings")
    else alert("Settings updated successfully! Refresh to see changes.")
    setSaving(null)
  }

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0]
    if (!file) return
    
    setSaving(type)
    const fileName = `${type}-${Date.now()}`
    const { data, error } = await supabase.storage
      .from("platform-assets")
      .upload(fileName, file)

    if (data) {
      const publicUrl = supabase.storage.from("platform-assets").getPublicUrl(fileName).data.publicUrl
      const updatedBranding = { ...branding, [type === 'logo' ? 'logo_url' : 'favicon_url']: publicUrl }
      setBranding(updatedBranding)
      await supabase.from("platform_config").upsert({ id: "branding", config: updatedBranding })
    }
    setSaving(null)
  }

  return (
    <SuperAdminLayout title="Platform Settings" subtitle="Configure system rules, global branding, and corporate module access">
      
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-4 md:gap-6 mb-12 relative z-10">
        {[
          { id: "modules", label: "Module Activation", icon: Building2 },
          { id: "system",  label: "System Rules",       icon: ShieldCheck },
          { id: "branding", label: "Branding & White-label", icon: Palette },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase tracking-widest transition-all border-2 ${
              activeTab === tab.id 
                ? "bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-600/30" 
                : "bg-white dark:bg-white/5 text-slate-500 dark:text-violet-400 border-slate-100 dark:border-violet-500/15 hover:border-violet-500/30"
            }`}
          >
            <tab.icon className="h-5 w-5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative z-10">
        
        {/* TAB 1: MODULE ACTIVATION */}
        {activeTab === "modules" && (
          <div className="grid lg:grid-cols-3 gap-8 md:gap-12 animate-in fade-in duration-300">
            {/* Company Selector */}
            <div className="rounded-3xl md:rounded-[3rem] p-8 md:p-10 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm">
              <h3 className="text-xs font-black text-slate-500 dark:text-violet-400 uppercase tracking-widest mb-8">Select Corporate</h3>
              {loading ? (
                <div className="flex justify-center py-10"><RefreshCw className="h-6 w-6 animate-spin text-violet-500" /></div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {companies.map(co => (
                    <button
                      key={co.id}
                      onClick={() => setSelectedCo(co)}
                      className={`w-full text-left px-6 py-5 rounded-2xl font-black uppercase tracking-widest transition-all border-2 ${
                        selectedCo?.id === co.id 
                          ? "bg-violet-600 text-white border-transparent shadow-lg" 
                          : "bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-violet-300 border-slate-200 dark:border-violet-500/10"
                      }`}
                    >
                      {co.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Modules */}
            <div className="lg:col-span-2 rounded-3xl md:rounded-[3rem] p-8 md:p-12 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15">
              <div className="grid sm:grid-cols-2 gap-8">
                {DEFAULT_MODULES.map(mod => {
                  const active = moduleSettings[mod.key] ?? true
                  return (
                    <div key={mod.key} className={`p-8 rounded-[2rem] border-2 transition-all ${active ? "bg-violet-50/50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-500/30 shadow-md" : "opacity-60 border-transparent bg-slate-50 dark:bg-white/[0.02]"}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xl font-black mb-1 uppercase tracking-tight text-slate-900 dark:text-white">{mod.label}</p>
                          <p className="text-sm font-bold text-slate-500 dark:text-violet-400">{mod.desc}</p>
                        </div>
                        <button onClick={() => toggleModule(mod.key)} disabled={saving === mod.key}>
                          {active ? <ToggleRight className="h-12 w-12 text-violet-600" /> : <ToggleLeft className="h-12 w-12 text-slate-300" />}
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
          <div className="rounded-[3rem] p-10 md:p-16 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid md:grid-cols-2 gap-12 md:gap-20">
              {/* Security Policy */}
              <div className="space-y-10">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8">Auth & Security Policy</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-black uppercase text-slate-500 tracking-widest block mb-3">Min Password Length</label>
                      <input type="number" value={systemRules.password_min_length} onChange={e=>setSystemRules({...systemRules, password_min_length: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10 rounded-2xl px-6 py-4 outline-none focus:border-violet-500 text-lg font-bold text-slate-900 dark:text-white" />
                    </div>
                    <div className="flex items-center justify-between p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10">
                      <div>
                        <p className="font-black text-slate-900 dark:text-white uppercase text-sm tracking-widest">Require Symbols</p>
                        <p className="text-xs font-bold text-slate-500">Force users to use complex passwords</p>
                      </div>
                      <button onClick={()=>setSystemRules({...systemRules, require_symbols: !systemRules.require_symbols})}>
                        {systemRules.require_symbols ? <ToggleRight className="h-10 w-10 text-emerald-500" /> : <ToggleLeft className="h-10 w-10 text-slate-300" />}
                      </button>
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase text-slate-500 tracking-widest block mb-3">Max Failed Attempts</label>
                      <input type="number" value={systemRules.max_login_attempts} onChange={e=>setSystemRules({...systemRules, max_login_attempts: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10 rounded-2xl px-6 py-4 outline-none focus:border-violet-500 text-lg font-bold text-slate-900 dark:text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Maintenance & Reg */}
              <div className="space-y-10">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8">Platform Status</h3>
                <div className="space-y-6">
                  <div className={`p-8 rounded-3xl border-2 transition-all ${systemRules.maintenance_mode ? 'bg-red-50 dark:bg-red-900/10 border-red-200' : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <AlertCircle className={`h-6 w-6 ${systemRules.maintenance_mode ? 'text-red-500' : 'text-emerald-500'}`} />
                        <p className="font-black uppercase tracking-widest text-slate-900 dark:text-white">Maintenance Mode</p>
                      </div>
                      <button onClick={()=>setSystemRules({...systemRules, maintenance_mode: !systemRules.maintenance_mode})}>
                        {systemRules.maintenance_mode ? <ToggleRight className="h-12 w-12 text-red-500" /> : <ToggleLeft className="h-12 w-12 text-emerald-500" />}
                      </button>
                    </div>
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                      {systemRules.maintenance_mode ? "Platform is LOCKED for all users except Super Admins." : "Platform is LIVE and accessible to all corporates."}
                    </p>
                  </div>

                  <div className="p-8 rounded-3xl bg-blue-50/50 dark:bg-blue-900/10 border-2 border-blue-100 dark:border-blue-500/10">
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-black uppercase tracking-widest text-slate-900 dark:text-white">Public Registration</p>
                      <button onClick={()=>setSystemRules({...systemRules, registration_open: !systemRules.registration_open})}>
                        {systemRules.registration_open ? <ToggleRight className="h-12 w-12 text-blue-500" /> : <ToggleLeft className="h-12 w-12 text-slate-300" />}
                      </button>
                    </div>
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Allow new corporates to register without an invite.</p>
                  </div>
                </div>

                <button 
                  onClick={() => saveConfig("system_rules", systemRules)}
                  disabled={saving === "system_rules"}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-black uppercase tracking-widest py-6 rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-50"
                >
                  <Save className="h-6 w-6" />
                  {saving === "system_rules" ? "Saving..." : "Save System Rules"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BRANDING */}
        {activeTab === "branding" && (
          <div className="rounded-[3rem] p-10 md:p-16 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid md:grid-cols-2 gap-16 md:gap-24">
              <div className="space-y-12">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8">Platform Identity</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-black uppercase text-slate-500 tracking-widest block mb-3">Platform Name</label>
                      <input type="text" value={branding.platform_name} onChange={e=>setBranding({...branding, platform_name: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10 rounded-2xl px-6 py-4 outline-none focus:border-violet-500 text-lg font-bold text-slate-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase text-slate-500 tracking-widest block mb-3">Theme Primary Color</label>
                      <div className="flex gap-4 items-center">
                        <input type="color" value={branding.primary_color} onChange={e=>setBranding({...branding, primary_color: e.target.value})} className="h-16 w-32 rounded-2xl bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10 cursor-pointer" />
                        <p className="text-lg font-mono font-bold text-slate-500">{branding.primary_color.toUpperCase()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => saveConfig("branding", branding)}
                  disabled={saving === "branding"}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest py-6 rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-50"
                >
                  <Save className="h-6 w-6" />
                  {saving === "branding" ? "Saving..." : "Apply Branding"}
                </button>
              </div>

              {/* Assets Upload */}
              <div className="space-y-12">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8">Visual Assets</h3>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <p className="text-xs font-black uppercase text-slate-500 tracking-widest">Main Logo</p>
                    <div className="aspect-square rounded-3xl bg-slate-50 dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-violet-500/20 flex flex-col items-center justify-center p-6 relative overflow-hidden group">
                      {branding.logo_url ? (
                        <img src={branding.logo_url} className="max-h-full max-w-full object-contain relative z-10" />
                      ) : (
                        <Upload className="h-8 w-8 text-slate-300" />
                      )}
                      <input type="file" accept="image/*" onChange={(e)=>handleFileUpload(e, 'logo')} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                      <div className="absolute inset-0 bg-violet-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-30 pointer-events-none">
                        <p className="text-white text-xs font-black uppercase">Change Logo</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-black uppercase text-slate-500 tracking-widest">Favicon</p>
                    <div className="aspect-square rounded-3xl bg-slate-50 dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-violet-500/20 flex flex-col items-center justify-center p-6 relative overflow-hidden group">
                      {branding.favicon_url ? (
                        <img src={branding.favicon_url} className="w-12 h-12 object-contain relative z-10" />
                      ) : (
                        <Upload className="h-8 w-8 text-slate-300" />
                      )}
                      <input type="file" accept="image/*" onChange={(e)=>handleFileUpload(e, 'favicon')} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                      <div className="absolute inset-0 bg-violet-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-30 pointer-events-none">
                        <p className="text-white text-xs font-black uppercase">Change Icon</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-100 dark:border-amber-500/10 flex gap-4">
                   <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
                   <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Assets are stored in Supabase Storage. Changing the primary color will update the entire platform UI instantly.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  )
}
