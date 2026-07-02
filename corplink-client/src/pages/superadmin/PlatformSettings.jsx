import { useEffect, useState, useRef } from "react"
import { supabase } from "../../lib/supabase"
import SuperAdminLayout from "../../components/superadmin/layout/SuperAdminLayout"
import { useTheme } from "../../context/ThemeContext"
import { useAuth } from "../../context/AuthContext"
import { logAdminActivity } from "../../utils/logger"
import {
  ToggleLeft, ToggleRight, Building2, ShieldCheck,
  Palette, Save, Upload, RefreshCw, ChevronDown, Loader2, CheckCircle, X
} from "lucide-react"

const DEFAULT_MODULES = [
  { key: "task_management", label: "Task", desc: "Projects & tasks" },
  { key: "messaging", label: "Chat", desc: "Internal messaging" },
  { key: "collaboration", label: "Collab", desc: "Partner discovery" },
  { key: "news_feed", label: "Feed", desc: "Notice board" },
  { key: "analytics", label: "Charts", desc: "Data reports" },
  { key: "departments", label: "Departments", desc: "Dept management" },
  { key: "teams", label: "Teams", desc: "Team management" },
  { key: "employees", label: "Employees", desc: "Employee records" },
]

export default function PlatformSettings() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState("modules")
  const [companies, setCompanies] = useState([])
  const [selectedCo, setSelectedCo] = useState(null)
  const [moduleSettings, setModuleSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [isCoListOpen, setIsCoListOpen] = useState(false)

  const [systemRules, setSystemRules] = useState({
    password_min_length: 8,
    require_symbols: true,
    maintenance_mode: false,
    max_login_attempts: 5,
    registration_open: true
  })
  const { branding: themeBranding } = useTheme()
  const [branding, setBranding] = useState({
    platform_name: "CorpLink",
    primary_color: "#8b5cf6",
    logo_url: null,
    favicon_url: null,
  })
  const [savingRules, setSavingRules] = useState(false)
  const [rulesSuccess, setRulesSuccess] = useState('')
  const [savingBranding, setSavingBranding] = useState(false)
  const [brandingSuccess, setBrandingSuccess] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingIcon, setUploadingIcon] = useState(false)
  const logoInputRef = useRef(null)
  const iconInputRef = useRef(null)

  useEffect(() => {
    const loadInit = async () => {
      const { data: comps } = await supabase.from("companies").select("id, name").eq("status", "active").order("name")
      setCompanies(comps || [])
      if (comps?.length) setSelectedCo(comps[0])

      // Load Branding
      const { data: brandData } = await supabase.from("platform_config").select("config").eq("id", "branding").maybeSingle()
      if (brandData?.config) {
        setBranding(prev => ({ ...prev, ...brandData.config }))
      }

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
    await logAdminActivity({
      user_id: profile?.id,
      company_id: selectedCo.id,
      action: `${newVal ? 'Enabled' : 'Disabled'} module: ${moduleKey}`,
      entity: "Platform Settings",
      severity: "info"
    })
    setSaving(null)
  }

  const handleSaveRules = async () => {
    setSavingRules(true)
    setRulesSuccess('')
    try {
      await supabase.from('system_configurations').upsert(
        Object.entries(systemRules).map(([key, value]) => ({ key, value: String(value) })),
        { onConflict: 'key' }
      )
      await logAdminActivity({
        user_id: profile?.id,
        action: `Updated system rules`,
        entity: "Platform Settings",
        severity: "warning"
      })
      setRulesSuccess('System rules saved successfully!')
      setTimeout(() => setRulesSuccess(''), 3000)
    } catch (err) {
      alert('Failed to save: ' + err.message)
    } finally {
      setSavingRules(false)
    }
  }

  const handleUploadImage = async (file, field) => {
    if (!file) return
    const isLogo = field === 'logo_url'
    if (isLogo) setUploadingLogo(true)
    else setUploadingIcon(true)

    try {
      const ext = file.name.split('.').pop()
      const fileName = `${field}_${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('platform-assets')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('platform-assets')
        .getPublicUrl(fileName)

      setBranding(prev => ({ ...prev, [field]: urlData.publicUrl }))
    } catch (err) {
      alert('Upload failed: ' + err.message)
    } finally {
      if (isLogo) setUploadingLogo(false)
      else setUploadingIcon(false)
    }
  }

  const handleSaveBranding = async () => {
    setSavingBranding(true)
    setBrandingSuccess('')
    try {
      const { error } = await supabase.from('platform_config').upsert({ id: 'branding', config: branding })
      if (error) throw error
      localStorage.setItem("corplink-branding", JSON.stringify(branding))
      // Apply immediately without reload
      const root = window.document.documentElement
      if (branding.primary_color) root.style.setProperty('--primary-color', branding.primary_color)
      if (branding.platform_name) document.title = branding.platform_name
      if (branding.favicon_url) {
        let link = document.querySelector("link[rel~='icon']")
        if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link) }
        link.href = branding.favicon_url
      }
      await logAdminActivity({
        user_id: profile?.id,
        action: `Updated platform branding`,
        entity: "Platform Settings",
        severity: "info"
      })
      setBrandingSuccess('Branding updated successfully!')
      setTimeout(() => setBrandingSuccess(''), 3000)
    } catch (err) {
      alert('Failed to save: ' + err.message)
    } finally {
      setSavingBranding(false)
    }
  }

  return (
    <SuperAdminLayout title="Platform Settings" subtitle="Branding and system rules">

      {/* Responsive Tab Navigation */}
      <div className="grid grid-cols-3 lg:flex lg:flex-row gap-3 md:gap-6 mb-8 md:mb-12">
        {[
          { id: "modules", label: "Modules", icon: Building2 },
          { id: "system", label: "Rules", icon: ShieldCheck },
          { id: "branding", label: "Branding", icon: Palette },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center justify-center lg:justify-start gap-2 md:gap-3 px-3 md:px-8 py-3.5 md:py-5 rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-label tracking-widest transition-all border-2 ${activeTab === tab.id
                ? "bg-violet-600 text-white border-violet-600 shadow-lg"
                : "bg-white dark:bg-white/5 text-slate-500 dark:text-violet-400 border-slate-100 dark:border-violet-500/15"
              }`}
          >
            <tab.icon className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="relative z-10">

        {/* TAB 1: MODULE ACTIVATION */}
        {activeTab === "modules" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Company Selector */}
            <div className="rounded-3xl p-6 md:p-8 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h3 className="text-badge font-black text-slate-500 uppercase tracking-widest">Companies</h3>
                {/* Mobile Toggle Arrow */}
                <button
                  onClick={() => setIsCoListOpen(!isCoListOpen)}
                  className="lg:hidden p-2 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-violet-600 transition-all"
                >
                  <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${isCoListOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-10"><RefreshCw className="h-6 w-6 animate-spin text-violet-500" /></div>
              ) : (
                <div className={`${isCoListOpen ? 'flex flex-col max-h-[250px] overflow-y-auto' : 'hidden'} lg:flex lg:flex-col gap-2 lg:max-h-[500px] lg:overflow-y-auto pr-1 no-scrollbar transition-all duration-300`}>
                  {companies.map(co => (
                    <button
                      key={co.id}
                      onClick={() => { setSelectedCo(co); setIsCoListOpen(false); }}
                      className={`text-left px-5 md:px-6 py-3.5 md:py-4 rounded-xl font-black uppercase text-[9px] md:text-label tracking-widest transition-all border-2 shrink-0 ${selectedCo?.id === co.id
                          ? "bg-violet-600 text-white border-transparent shadow-md"
                          : "bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-violet-300 border-slate-100 dark:border-white/5"
                        }`}
                    >
                      {co.name}
                    </button>
                  ))}
                </div>
              )}
              {/* Selected Label for Mobile when closed */}
              {!isCoListOpen && !loading && (
                <div className="lg:hidden p-4 rounded-xl bg-violet-50 dark:bg-violet-500/5 border-2 border-violet-100 dark:border-violet-500/10 text-center">
                  <p className="text-[9px] font-black uppercase text-violet-600 tracking-widest">{selectedCo?.name || "Select Corporate"}</p>
                </div>
              )}
            </div>

            {/* Modules Grid */}
            <div className="lg:col-span-2 rounded-3xl p-6 md:p-10 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15">
              <div className="mb-8 border-b-2 border-slate-100 dark:border-white/5 pb-6">
                <h3 className="text-badge font-black text-slate-500 uppercase tracking-widest mb-2">Module Access Control</h3>
                <p className="text-heading-3 md:text-heading-2 font-black text-violet-600 uppercase tracking-tight">
                  {selectedCo ? `Configuring: ${selectedCo.name}` : "Select a Corporate"}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {DEFAULT_MODULES.map(mod => {
                  const active = moduleSettings[mod.key] ?? true
                  return (
                    <div key={mod.key} className={`p-5 rounded-2xl border-2 transition-all ${active ? "bg-violet-50/50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-500/30 shadow-sm" : "opacity-60 bg-slate-50 dark:bg-white/[0.02] border-transparent"}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-heading-3 font-black uppercase tracking-tight text-slate-900 dark:text-white truncate">{mod.label}</p>
                          <p className="text-badge font-bold text-slate-500 mt-0.5 truncate">{mod.desc}</p>
                        </div>
                        <button onClick={() => toggleModule(mod.key)} disabled={saving === mod.key}>
                          {active ? <ToggleRight className="h-9 w-9 text-violet-600" /> : <ToggleLeft className="h-9 w-9 text-slate-300" />}
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
          <div className="rounded-3xl md:rounded-[3rem] p-6 md:p-12 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16">
              <div className="space-y-6 md:space-y-8">
                <h3 className="text-heading-3 md:text-heading-1 font-black text-slate-900 dark:text-white uppercase tracking-tight">Security</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-badge font-black uppercase text-slate-500 tracking-widest block mb-2">Password Length</label>
                    <input type="number" value={systemRules.password_min_length} onChange={e => setSystemRules({ ...systemRules, password_min_length: e.target.value })} className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10 rounded-xl px-5 py-4 outline-none font-bold text-slate-900 dark:text-white focus:border-violet-500/40 transition-all" />
                  </div>
                  <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10">
                    <p className="font-black uppercase text-badge md:text-label tracking-widest text-slate-900 dark:text-white">Require Symbols</p>
                    <button onClick={() => setSystemRules({ ...systemRules, require_symbols: !systemRules.require_symbols })}>
                      {systemRules.require_symbols ? <ToggleRight className="h-9 w-9 text-emerald-500" /> : <ToggleLeft className="h-9 w-9 text-slate-300" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6 md:space-y-8">
                <h3 className="text-heading-3 md:text-heading-1 font-black text-slate-900 dark:text-white uppercase tracking-tight">System Status</h3>
                <div className="space-y-4">
                  <div className={`p-5 md:p-6 rounded-2xl border-2 transition-all ${systemRules.maintenance_mode ? 'bg-red-50 dark:bg-red-950/20 border-red-200' : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-black uppercase tracking-widest text-badge md:text-label text-slate-900 dark:text-white">Maintenance Mode</p>
                      <button onClick={() => setSystemRules({ ...systemRules, maintenance_mode: !systemRules.maintenance_mode })}>
                        {systemRules.maintenance_mode ? <ToggleRight className="h-9 w-9 text-red-500" /> : <ToggleLeft className="h-9 w-9 text-emerald-500" />}
                      </button>
                    </div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{systemRules.maintenance_mode ? "Platform Locked" : "Platform Active"}</p>
                  </div>
                </div>
                {rulesSuccess && (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-[11px] font-black">
                    <CheckCircle className="h-4 w-4" />{rulesSuccess}
                  </div>
                )}
                <button onClick={handleSaveRules} disabled={savingRules} className="w-full bg-violet-600 py-4 rounded-xl text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:scale-[1.02] disabled:opacity-60 transition-all flex items-center justify-center gap-2">
                  {savingRules ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save Config</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BRANDING */}
        {activeTab === "branding" && (
          <div className="rounded-3xl md:rounded-[3rem] p-6 md:p-12 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16">

              {/* Left: Identity */}
              <div className="space-y-6 md:space-y-8">
                <h3 className="text-heading-3 md:text-heading-1 font-black text-slate-900 dark:text-white uppercase tracking-tight">Identity</h3>
                <div className="space-y-5">
                  {/* Platform Name */}
                  <div>
                    <label className="text-badge font-black uppercase text-slate-500 tracking-widest block mb-2">Platform Name</label>
                    <input
                      type="text"
                      value={branding.platform_name}
                      onChange={e => setBranding({ ...branding, platform_name: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10 rounded-xl px-5 py-4 outline-none font-bold text-slate-900 dark:text-white focus:border-violet-500/40 transition-all"
                    />
                  </div>

                  {/* Theme Color */}
                  <div>
                    <label className="text-badge font-black uppercase text-slate-500 tracking-widest block mb-2">Theme Color</label>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5">
                      <input
                        type="color"
                        value={branding.primary_color}
                        onChange={e => {
                          const color = e.target.value
                          setBranding({ ...branding, primary_color: color })
                          // Live preview
                          document.documentElement.style.setProperty('--primary-color', color)
                        }}
                        className="h-12 w-20 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <div className="flex-1">
                        <p className="font-mono font-black text-slate-900 dark:text-white text-heading-3">{branding.primary_color?.toUpperCase()}</p>
                        <p className="text-badge text-slate-400 font-bold uppercase tracking-widest mt-1">Live preview active</p>
                      </div>
                      {/* Color swatch preview */}
                      <div
                        className="w-12 h-12 rounded-xl shadow-lg border-2 border-white/20"
                        style={{ background: branding.primary_color }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Media Assets */}
              <div className="space-y-6 md:space-y-8">
                <h3 className="text-heading-3 md:text-heading-1 font-black text-slate-900 dark:text-white uppercase tracking-tight">Media Assets</h3>
                <div className="grid grid-cols-2 gap-4">

                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <p className="text-badge font-black uppercase text-slate-500 tracking-widest text-center">Logo</p>
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      className="aspect-square rounded-2xl bg-slate-50 dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-violet-500/20 flex flex-col items-center justify-center relative group cursor-pointer hover:border-violet-500/50 transition-all overflow-hidden"
                    >
                      {uploadingLogo ? (
                        <Loader2 className="h-6 w-6 text-violet-500 animate-spin" />
                      ) : branding.logo_url ? (
                        <>
                          <img src={branding.logo_url} alt="Logo" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2 flex-col">
                            <Upload className="h-5 w-5 text-white" />
                            <p className="text-white text-[9px] font-black uppercase">Change</p>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); setBranding(prev => ({ ...prev, logo_url: null })) }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-slate-300 group-hover:text-violet-500 transition-colors mb-1" />
                          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Upload</p>
                        </>
                      )}
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleUploadImage(e.target.files[0], 'logo_url')}
                    />
                  </div>

                  {/* Icon / Favicon Upload */}
                  <div className="space-y-2">
                    <p className="text-badge font-black uppercase text-slate-500 tracking-widest text-center">Favicon / Icon</p>
                    <div
                      onClick={() => iconInputRef.current?.click()}
                      className="aspect-square rounded-2xl bg-slate-50 dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-violet-500/20 flex flex-col items-center justify-center relative group cursor-pointer hover:border-violet-500/50 transition-all overflow-hidden"
                    >
                      {uploadingIcon ? (
                        <Loader2 className="h-6 w-6 text-violet-500 animate-spin" />
                      ) : branding.favicon_url ? (
                        <>
                          <img src={branding.favicon_url} alt="Icon" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2 flex-col">
                            <Upload className="h-5 w-5 text-white" />
                            <p className="text-white text-[9px] font-black uppercase">Change</p>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); setBranding(prev => ({ ...prev, favicon_url: null })) }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-slate-300 group-hover:text-violet-500 transition-colors mb-1" />
                          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Upload</p>
                        </>
                      )}
                    </div>
                    <input
                      ref={iconInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleUploadImage(e.target.files[0], 'favicon_url')}
                    />
                    <p className="text-[9px] text-slate-400 font-bold text-center uppercase tracking-widest">Used as browser tab icon</p>
                  </div>
                </div>

                {/* Live Preview Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10">
                  <p className="text-badge font-black uppercase text-slate-500 tracking-widest mb-3">Live Preview</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-body shadow-lg overflow-hidden"
                      style={{ background: branding.primary_color }}
                    >
                      {branding.logo_url
                        ? <img src={branding.logo_url} className="w-full h-full object-cover" alt="logo" />
                        : (branding.platform_name?.charAt(0) || 'C')
                      }
                    </div>
                    <div>
                      <p className="font-black uppercase tracking-widest text-slate-900 dark:text-white text-body">{branding.platform_name || 'CorpLink'}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: branding.primary_color }}>Platform</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 border-t-2 border-slate-100 dark:border-white/5 pt-8">
              {brandingSuccess && (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-[11px] font-black mb-4">
                  <CheckCircle className="h-4 w-4" />{brandingSuccess}
                </div>
              )}
              <button onClick={handleSaveBranding} disabled={savingBranding} className="w-full bg-emerald-600 py-4 rounded-xl text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:scale-[1.02] disabled:opacity-60 transition-all flex items-center justify-center gap-2">
                {savingBranding ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save Brand Configuration</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  )
}

