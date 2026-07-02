import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import SuperAdminLayout from "../../components/superadmin/layout/SuperAdminLayout"
import { 
  ShieldAlert, ShieldCheck, UserX, UserCheck, 
  Trash2, RefreshCw, Search, MoreHorizontal 
} from "lucide-react"
import { useConfirm } from "../../context/ConfirmContext"

export default function ThreatManagement() {
  const { showConfirm } = useConfirm()
  const [alerts, setAlerts] = useState([])
  const [blockedUsers, setBlockedUsers] = useState([])
  const [blockedCompanies, setBlockedCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [tab, setTab] = useState("alerts") // alerts, blocked
  const [search, setSearch] = useState("")

  const fetchData = async () => {
    setLoading(true)
    const [alertRes, blockedRes, blockedCoRes] = await Promise.all([
      supabase.from("threat_alerts").select("*, companies(name)").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, email, full_name, is_blocked").eq("is_blocked", true),
      supabase.from("companies").select("id, name, email, status").eq("status", "suspended")
    ])
    console.log("ALERTS DATA:", alertRes.data)
    setAlerts(alertRes.data || [])
    setBlockedUsers(blockedRes.data || [])
    setBlockedCompanies(blockedCoRes.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const resolveAlert = async (id) => {
    setSaving(id)
    await supabase.from("threat_alerts").update({ resolved: true }).eq("id", id)
    await fetchData()
    setSaving(null)
  }

  const toggleUserBlock = async (userId, currentStatus) => {
    setSaving(userId)
    await supabase.from("profiles").update({ is_blocked: !currentStatus }).eq("id", userId)
    await fetchData()
    setSaving(null)
  }

  const unblockCompany = async (companyId) => {
    setSaving(companyId)
    await supabase.from("companies").update({ status: 'active', failed_login_attempts: 0 }).eq("id", companyId)
    // Resolve associated alerts
    await supabase.from("threat_alerts").update({ resolved: true }).eq("company_id", companyId).eq("type", "Brute Force Attack")
    await fetchData()
    setSaving(null)
  }

  const deleteAlert = (id) => {
    showConfirm({
      title: "Delete Alert",
      message: "Are you sure you want to delete this threat alert?",
      onConfirm: async () => {
        setSaving(id)
        await supabase.from("threat_alerts").delete().eq("id", id)
        await fetchData()
        setSaving(null)
      }
    })
  }

  const filteredAlerts = alerts.filter(a => (a.target_email || "").toLowerCase().includes(search.toLowerCase()))
  const filteredBlocked = blockedUsers.filter(u => (u.email || "").toLowerCase().includes(search.toLowerCase()))
  const filteredBlockedCos = blockedCompanies.filter(c => (c.name || "").toLowerCase().includes(search.toLowerCase()))

  return (
    <SuperAdminLayout title="Threat Management" subtitle="Monitor security alerts and manage blocked entities">
      
      {/* Search & Tabs */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between mb-8 md:mb-12">
        <div className="relative flex-1 max-w-full lg:max-w-md order-2 lg:order-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 md:py-5 rounded-2xl bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10 outline-none focus:border-violet-500 font-black text-slate-900 dark:text-white text-badge md:text-heading-3 uppercase tracking-tight"
          />
        </div>

        <div className="flex p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl border-2 border-slate-200 dark:border-violet-500/10 order-1 lg:order-2">
          <button
            onClick={() => setTab("alerts")}
            className={`flex-1 lg:flex-none px-4 md:px-8 py-3.5 rounded-xl text-[9px] md:text-label font-black uppercase tracking-widest transition-all ${
              tab === "alerts" ? "bg-violet-600 text-white shadow-lg" : "text-slate-500 dark:text-violet-400"
            }`}
          >
            Threats ({alerts.filter(a => !a.resolved).length})
          </button>
          <button
            onClick={() => setTab("blocked")}
            className={`flex-1 lg:flex-none px-4 md:px-8 py-3.5 rounded-xl text-[9px] md:text-label font-black uppercase tracking-widest transition-all ${
              tab === "blocked" ? "bg-red-600 text-white shadow-lg" : "text-slate-500 dark:text-violet-400"
            }`}
          >
            Blocked Entities ({blockedUsers.length + blockedCompanies.length})
          </button>
        </div>
      </div>

      <div className="rounded-3xl md:rounded-[3rem] overflow-hidden bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm">
        {loading ? (
          <div className="py-40 text-center flex flex-col items-center gap-6">
            <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="font-black text-slate-500 dark:text-violet-400 uppercase tracking-widest text-badge">Scanning Infrastructure...</p>
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-violet-500/5 border-b-2 border-slate-100 dark:border-violet-500/10">
                    <th className="px-10 py-8 text-badge font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Target Identity</th>
                    <th className="px-10 py-8 text-badge font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Incident Details</th>
                    <th className="px-10 py-8 text-badge font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Severity/Status</th>
                    <th className="px-10 py-8 text-badge font-black uppercase tracking-widest text-slate-500 dark:text-violet-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-100 dark:divide-violet-500/5">
                  {tab === "alerts" ? (
                    filteredAlerts.length === 0 ? (
                      <tr><td colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-badge">No Threats Detected</td></tr>
                    ) : filteredAlerts.map(alert => (
                      <tr key={alert.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] group">
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${alert.resolved ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500 animate-pulse'}`}>
                              {alert.resolved ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-heading-3 font-black text-slate-900 dark:text-white uppercase truncate max-w-[200px]">{alert.target_email}</p>
                              <p className="text-badge font-bold text-slate-400 mt-1">{new Date(alert.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <p className="text-label font-black uppercase text-slate-700 dark:text-white tracking-widest">{alert.threat_type}</p>
                          <p className="text-badge font-bold text-slate-500 truncate max-w-[200px]">{alert.description}</p>
                          {alert.companies?.name && (
                            <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest mt-2 border border-violet-200 dark:border-violet-500/20 px-2 py-1 rounded-md w-fit">Company: {alert.companies.name}</p>
                          )}
                        </td>
                        <td className="px-10 py-8">
                          <span className={`px-4 py-1.5 rounded-full text-badge font-black uppercase tracking-widest border-2 ${
                            alert.severity === 'high' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {alert.severity}
                          </span>
                        </td>
                        <td className="px-10 py-8 text-right flex justify-end gap-3 transition-all">
                            {!alert.resolved && (
                              <button onClick={() => resolveAlert(alert.id)} className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-badge font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all">Resolve</button>
                            )}
                            <button onClick={() => deleteAlert(alert.id)} className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-red-500 transition-all hover:bg-red-50"><Trash2 className="h-5 w-5" /></button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <>
                      {filteredBlockedCos.length === 0 && filteredBlocked.length === 0 ? (
                        <tr><td colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-badge">No Blocked Entities</td></tr>
                      ) : (
                        <>
                          {filteredBlockedCos.map(company => (
                            <tr key={company.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] group">
                              <td className="px-10 py-8">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-xl bg-red-600/10 text-red-600 flex items-center justify-center shrink-0"><ShieldAlert className="h-6 w-6" /></div>
                                  <div className="min-w-0">
                                    <p className="text-heading-3 font-black text-slate-900 dark:text-white uppercase truncate max-w-[200px]">{company.name}</p>
                                    <p className="text-badge font-bold text-slate-500">Corporate Account</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-10 py-8 text-label font-black text-slate-500 uppercase tracking-widest">Multiple Failed Logins</td>
                              <td className="px-10 py-8">
                                <span className="px-4 py-1.5 rounded-full bg-red-50 text-red-600 border-2 border-red-100 text-badge font-black uppercase tracking-widest">Suspended</span>
                              </td>
                              <td className="px-10 py-8 text-right flex justify-end transition-all">
                                  <button onClick={() => unblockCompany(company.id)} className="px-6 py-3 rounded-xl bg-emerald-50 border-2 border-emerald-100 text-emerald-600 text-badge font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95">
                                    <ShieldCheck className="h-4 w-4" /> Unblock Company
                                  </button>
                              </td>
                            </tr>
                          ))}
                          {filteredBlocked.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] group">
                              <td className="px-10 py-8">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-xl bg-red-600/10 text-red-600 flex items-center justify-center shrink-0"><UserX className="h-6 w-6" /></div>
                                  <div className="min-w-0">
                                    <p className="text-heading-3 font-black text-slate-900 dark:text-white uppercase truncate max-w-[200px]">{user.full_name || "Unknown"}</p>
                                    <p className="text-badge font-bold text-slate-500">{user.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-10 py-8 text-label font-black text-slate-500 uppercase tracking-widest">Account Suspended</td>
                              <td className="px-10 py-8">
                                <span className="px-4 py-1.5 rounded-full bg-red-50 text-red-600 border-2 border-red-100 text-badge font-black uppercase tracking-widest">Blocked</span>
                              </td>
                              <td className="px-10 py-8 text-right flex justify-end transition-all">
                                  <button onClick={() => toggleUserBlock(user.id, true)} className="px-6 py-3 rounded-xl bg-emerald-50 border-2 border-emerald-100 text-emerald-600 text-badge font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95">
                                    <UserCheck className="h-4 w-4" /> Unblock User
                                  </button>
                              </td>
                            </tr>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y-2 divide-slate-100 dark:divide-violet-500/5">
              {tab === "alerts" ? (
                filteredAlerts.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 font-bold uppercase text-badge">No Detected Threats</div>
                ) : filteredAlerts.map(alert => (
                  <div key={alert.id} className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${alert.resolved ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500 animate-pulse'}`}>
                            {alert.resolved ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                         </div>
                         <div>
                            <p className="text-badge font-black text-slate-900 dark:text-white uppercase tracking-tight truncate max-w-[200px]">{alert.target_email}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">{alert.threat_type}</p>
                         </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${
                        alert.severity === 'high' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 line-clamp-2">{alert.description}</p>
                    {alert.companies?.name && (
                      <p className="text-[9px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest border border-violet-200 dark:border-violet-500/20 px-2 py-1 rounded-md w-fit">Company: {alert.companies.name}</p>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5 mt-2">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">{new Date(alert.created_at).toLocaleDateString()}</p>
                       <div className="flex items-center gap-2 flex-nowrap shrink-0">
                          {!alert.resolved && (
                            <button onClick={() => resolveAlert(alert.id)} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest shadow-md whitespace-nowrap">Resolve</button>
                          )}
                          <button onClick={() => deleteAlert(alert.id)} className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 border-2 border-red-100 dark:border-red-500/20 shrink-0"><Trash2 className="h-4 w-4" /></button>
                       </div>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {filteredBlockedCos.length === 0 && filteredBlocked.length === 0 ? (
                    <div className="py-20 text-center text-slate-400 font-bold uppercase text-badge">No Blocked Entities</div>
                  ) : (
                    <>
                      {filteredBlockedCos.map(company => (
                        <div key={company.id} className="p-6 space-y-4">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-red-600/10 text-red-600 flex items-center justify-center shrink-0"><ShieldAlert className="h-5 w-5" /></div>
                              <div>
                                <p className="text-heading-3 font-black text-slate-900 dark:text-white uppercase">{company.name}</p>
                                <p className="text-badge font-bold text-slate-500">Corporate Account</p>
                              </div>
                          </div>
                          <div className="flex items-center justify-between pt-2">
                              <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 border-2 border-red-100 text-[9px] font-black uppercase tracking-widest">Suspended</span>
                              <button onClick={() => unblockCompany(company.id)} className="px-5 py-2.5 rounded-xl bg-emerald-50 border-2 border-emerald-100 text-emerald-600 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4" /> Unblock
                              </button>
                          </div>
                        </div>
                      ))}
                      {filteredBlocked.map(user => (
                        <div key={user.id} className="p-6 space-y-4">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-red-600/10 text-red-600 flex items-center justify-center shrink-0"><UserX className="h-5 w-5" /></div>
                              <div>
                                <p className="text-heading-3 font-black text-slate-900 dark:text-white uppercase">{user.full_name || "Unknown"}</p>
                                <p className="text-badge font-bold text-slate-500">{user.email}</p>
                              </div>
                          </div>
                          <div className="flex items-center justify-between pt-2">
                              <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 border-2 border-red-100 text-[9px] font-black uppercase tracking-widest">Blocked</span>
                              <button onClick={() => toggleUserBlock(user.id, true)} className="px-5 py-2.5 rounded-xl bg-emerald-50 border-2 border-emerald-100 text-emerald-600 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                <UserCheck className="h-4 w-4" /> Unblock
                              </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </SuperAdminLayout>
  )
}

