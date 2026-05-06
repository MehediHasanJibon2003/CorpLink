import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import SuperAdminLayout from "../../components/superadmin/layout/SuperAdminLayout"
import { ShieldAlert, ShieldCheck, UserX, UserCheck, Search, Clock, Trash2 } from "lucide-react"

export default function ThreatManagement() {
  const [alerts, setAlerts] = useState([])
  const [blockedUsers, setBlockedUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("alerts") // 'alerts' or 'blocked'
  const [saving, setSaving] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    const [alertsRes, blockedRes] = await Promise.all([
      supabase.from("threat_alerts").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("is_blocked", true).order("full_name")
    ])
    setAlerts(alertsRes.data || [])
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

  const deleteAlert = async (id) => {
    if (!window.confirm("Delete this alert history?")) return
    setSaving(id)
    await supabase.from("threat_alerts").delete().eq("id", id)
    await fetchData()
    setSaving(null)
  }

  const unblockUser = async (profileId, email) => {
    if (!window.confirm(`Unblock ${email}?`)) return
    setSaving(profileId)
    // 1. Unblock in profiles
    await supabase.from("profiles").update({ is_blocked: false }).eq("id", profileId)
    // 2. Mark alerts for this email as resolved
    await supabase.from("threat_alerts").update({ resolved: true }).eq("target_email", email)
    // 3. Clear failed attempts to prevent immediate re-blocking
    await supabase.from("login_attempts").delete().eq("email", email)
    
    await fetchData()
    setSaving(null)
  }

  return (
    <SuperAdminLayout title="Threat Management" subtitle="Monitor suspicious activities and manage blocked accounts">
      
      {/* Tabs */}
      <div className="flex gap-4 mb-10 p-2 rounded-2xl bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10 w-fit">
        <button
          onClick={() => setTab("alerts")}
          className={`flex items-center gap-3 px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
            tab === "alerts" 
              ? "bg-violet-600 text-white shadow-lg shadow-violet-500/40" 
              : "text-slate-500 dark:text-violet-400 hover:bg-slate-50 dark:hover:bg-white/5"
          }`}
        >
          <ShieldAlert className="h-5 w-5" /> Active Threats ({alerts.filter(a => !a.resolved).length})
        </button>
        <button
          onClick={() => setTab("blocked")}
          className={`flex items-center gap-3 px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
            tab === "blocked" 
              ? "bg-red-600 text-white shadow-lg shadow-red-500/40" 
              : "text-slate-500 dark:text-violet-400 hover:bg-slate-50 dark:hover:bg-white/5"
          }`}
        >
          <UserX className="h-5 w-5" /> Blocked Users ({blockedUsers.length})
        </button>
      </div>

      <div className="rounded-[2.5rem] overflow-hidden bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm">
        {loading ? (
          <div className="py-40 text-center flex flex-col items-center gap-6">
            <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="font-black text-slate-500 dark:text-violet-400 uppercase tracking-[0.2em]">Scanning for threats...</p>
          </div>
        ) : tab === "alerts" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-violet-500/5 border-b-2 border-slate-100 dark:border-violet-500/10">
                  <th className="px-10 py-8 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Threat Info</th>
                  <th className="px-10 py-8 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Severity</th>
                  <th className="px-10 py-8 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Status</th>
                  <th className="px-10 py-8 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Timestamp</th>
                  <th className="px-10 py-8 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100 dark:divide-violet-500/5">
                {alerts.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest">No threat alerts found</td></tr>
                ) : alerts.map(alert => (
                  <tr key={alert.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-10 py-8">
                      <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{alert.target_email}</p>
                      <p className="text-xs font-bold text-slate-500 dark:text-violet-500 mt-1 uppercase tracking-widest">{alert.threat_type}</p>
                    </td>
                    <td className="px-10 py-8">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border-2 ${
                        alert.severity === 'high' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-10 py-8">
                      {alert.resolved ? (
                        <div className="flex items-center gap-2 text-emerald-500 font-black text-xs uppercase tracking-widest">
                          <ShieldCheck className="h-4 w-4" /> Resolved
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-500 font-black text-xs uppercase tracking-widest animate-pulse">
                          <ShieldAlert className="h-4 w-4" /> Unresolved
                        </div>
                      )}
                    </td>
                    <td className="px-10 py-8 text-xs font-black text-slate-500 dark:text-violet-400 uppercase tracking-widest">
                      {new Date(alert.created_at).toLocaleString()}
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-3">
                        {!alert.resolved && (
                          <button
                            onClick={() => resolveAlert(alert.id)}
                            disabled={saving === alert.id}
                            className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-emerald-500/30"
                          >
                            Resolve
                          </button>
                        )}
                        <button
                          onClick={() => deleteAlert(alert.id)}
                          disabled={saving === alert.id}
                          className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-violet-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-red-500/5 border-b-2 border-slate-100 dark:border-red-500/10">
                  <th className="px-10 py-8 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-red-400">User Profile</th>
                  <th className="px-10 py-8 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-red-400">Email</th>
                  <th className="px-10 py-8 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-red-400">Blocked Since</th>
                  <th className="px-10 py-8 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-red-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100 dark:divide-red-500/5">
                {blockedUsers.length === 0 ? (
                  <tr><td colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest">No users currently blocked</td></tr>
                ) : blockedUsers.map(user => (
                  <tr key={user.id} className="hover:bg-red-50/30 dark:hover:bg-red-500/[0.02] transition-colors">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
                          {user.full_name?.charAt(0) || "U"}
                        </div>
                        <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{user.full_name}</p>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-sm font-bold text-slate-600 dark:text-violet-300">
                      {user.email}
                    </td>
                    <td className="px-10 py-8 text-xs font-black text-slate-500 dark:text-red-400 uppercase tracking-widest flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Recently Flagged
                    </td>
                    <td className="px-10 py-8">
                      <button
                        onClick={() => unblockUser(user.id, user.email)}
                        disabled={saving === user.id}
                        className="flex items-center gap-3 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-black uppercase tracking-[0.15em] hover:scale-105 transition-all shadow-xl shadow-emerald-500/30"
                      >
                        <UserCheck className="h-5 w-5" /> Unblock Access
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  )
}
