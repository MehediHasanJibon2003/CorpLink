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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [tab, setTab] = useState("alerts") // alerts, blocked
  const [search, setSearch] = useState("")

  const fetchData = async () => {
    setLoading(true)
    const [alertRes, blockedRes] = await Promise.all([
      supabase.from("threat_alerts").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, email, full_name, is_blocked").eq("is_blocked", true)
    ])
    setAlerts(alertRes.data || [])
    setBlockedUsers(blockedRes.data || [])
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

  const filteredAlerts = alerts.filter(a => (a.email || "").toLowerCase().includes(search.toLowerCase()))
  const filteredBlocked = blockedUsers.filter(u => (u.email || "").toLowerCase().includes(search.toLowerCase()))

  return (
    <SuperAdminLayout title="Threat Management" subtitle="Monitor security alerts and manage blocked entities">
      
      {/* Search & Tabs */}
      <div className="flex flex-col md:flex-row gap-6 justify-between mb-8 md:mb-12">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 md:py-4 rounded-xl md:rounded-2xl bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10 outline-none focus:border-violet-500 font-bold text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl border-2 border-slate-200 dark:border-violet-500/10">
          <button
            onClick={() => setTab("alerts")}
            className={`px-6 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${
              tab === "alerts" ? "bg-violet-600 text-white shadow-lg" : "text-slate-500 dark:text-violet-400"
            }`}
          >
            Threat Alerts ({alerts.filter(a => !a.resolved).length})
          </button>
          <button
            onClick={() => setTab("blocked")}
            className={`px-6 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${
              tab === "blocked" ? "bg-red-600 text-white shadow-lg" : "text-slate-500 dark:text-violet-400"
            }`}
          >
            Blocked Users ({blockedUsers.length})
          </button>
        </div>
      </div>

      <div className="rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm">
        {loading ? (
          <div className="py-40 text-center flex flex-col items-center gap-6">
            <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="font-black text-slate-500 dark:text-violet-400 uppercase tracking-widest">Scanning infrastructure...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-violet-500/5 border-b-2 border-slate-100 dark:border-violet-500/10">
                  <th className="px-8 py-6 md:py-8 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Target Identity</th>
                  <th className="px-8 py-6 md:py-8 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Incident Details</th>
                  <th className="px-8 py-6 md:py-8 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Severity/Status</th>
                  <th className="px-8 py-6 md:py-8 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-violet-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100 dark:divide-violet-500/5">
                {tab === "alerts" ? (
                  filteredAlerts.length === 0 ? (
                    <tr><td colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No threats detected</td></tr>
                  ) : filteredAlerts.map(alert => (
                    <tr key={alert.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <td className="px-8 py-6 md:py-8">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 ${alert.resolved ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500 animate-pulse'}`}>
                            {alert.resolved ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm md:text-lg font-black text-slate-900 dark:text-white uppercase truncate">{alert.email}</p>
                            <p className="text-[10px] font-bold text-slate-500">{new Date(alert.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 md:py-8">
                        <p className="text-[10px] md:text-xs font-black uppercase text-slate-700 dark:text-white tracking-widest">{alert.type}</p>
                        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 truncate max-w-[200px]">{alert.description}</p>
                      </td>
                      <td className="px-8 py-6 md:py-8">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border-2 ${
                          alert.severity === 'high' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-8 py-6 md:py-8">
                        <div className="flex items-center justify-end gap-3">
                          {!alert.resolved && (
                            <button onClick={() => resolveAlert(alert.id)} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20">Resolve</button>
                          )}
                          <button onClick={() => deleteAlert(alert.id)} className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-red-500 transition-all"><Trash2 className="h-5 w-5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  filteredBlocked.length === 0 ? (
                    <tr><td colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No blocked users</td></tr>
                  ) : filteredBlocked.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <td className="px-8 py-6 md:py-8">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0"><UserX className="h-6 w-6" /></div>
                          <div className="min-w-0">
                            <p className="text-sm md:text-lg font-black text-slate-900 dark:text-white uppercase truncate">{user.full_name || "Unknown"}</p>
                            <p className="text-[10px] font-bold text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 md:py-8 text-xs font-black text-slate-500 uppercase tracking-widest">Account Suspended</td>
                      <td className="px-8 py-6 md:py-8">
                        <span className="px-4 py-1.5 rounded-full bg-red-50 text-red-600 border-2 border-red-100 text-[10px] font-black uppercase tracking-widest">Blocked</span>
                      </td>
                      <td className="px-8 py-6 md:py-8">
                        <div className="flex items-center justify-end">
                          <button onClick={() => toggleUserBlock(user.id, true)} className="px-6 py-3 rounded-xl bg-emerald-50 border-2 border-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                            <UserCheck className="h-4 w-4" /> Unblock
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  )
}
