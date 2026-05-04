import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import SuperAdminLayout from "../../components/superadmin/layout/SuperAdminLayout"
import { CreditCard, RefreshCw, Sparkles } from "lucide-react"

const PLANS = ["basic", "standard", "enterprise"]

const planStyle = {
  basic:      { bg: "rgba(148,163,184,0.1)", text: "#94a3b8", border: "rgba(148,163,184,0.2)" },
  standard:   { bg: "rgba(59,130,246,0.1)", text: "#60a5fa", border: "rgba(59,130,246,0.2)" },
  enterprise: { bg: "rgba(124,58,237,0.1)", text: "#a78bfa", border: "rgba(124,58,237,0.2)" },
}

const statusStyle = {
  active:    { bg: "rgba(16,185,129,0.1)", text: "#34d399", border: "rgba(16,185,129,0.2)" },
  expired:   { bg: "rgba(239,68,68,0.1)", text: "#f87171", border: "rgba(239,68,68,0.2)" },
  cancelled: { bg: "rgba(148,163,184,0.1)", text: "#94a3b8", border: "rgba(148,163,184,0.2)" },
}

export default function SubscriptionBilling() {
  const [subs, setSubs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(null)

  const fetchSubs = async () => {
    setLoading(true)
    const { data } = await supabase
      .from("subscriptions")
      .select("*, companies(name, email)")
      .order("created_at", { ascending: false })
    setSubs(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchSubs() }, [])

  const changePlan = async (id, plan) => {
    setSaving(id)
    await supabase.from("subscriptions").update({ plan }).eq("id", id)
    await fetchSubs()
    setSaving(null)
  }

  const changeStatus = async (id, status) => {
    setSaving(id)
    await supabase.from("subscriptions").update({ status }).eq("id", id)
    await fetchSubs()
    setSaving(null)
  }

  const isExpiring = (expiry) => {
    if (!expiry) return false
    const days = (new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24)
    return days < 7 && days > 0
  }

  return (
    <SuperAdminLayout title="Subscriptions & Billing" subtitle="Manage all corporate subscription plans and payment status">
      
      {/* Header Metric */}
      <div className="mb-10 md:mb-16 inline-flex items-center gap-4 md:gap-6 px-6 md:px-10 py-5 md:py-8 rounded-3xl md:rounded-[2.5rem] relative overflow-hidden bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-lg shadow-violet-500/5">
        <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-100 dark:border-emerald-500/20 shadow-inner">
          <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-emerald-500 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-[10px] md:text-xs font-black text-slate-500 dark:text-violet-400 uppercase tracking-[0.2em] mb-1 md:mb-2">Active Subscriptions</p>
          <p className="text-2xl md:text-5xl font-black text-slate-900 dark:text-white flex items-baseline gap-2 md:gap-4">
            {subs.filter(s => s.status === 'active').length} 
            <span className="text-sm md:text-lg font-black text-slate-400 dark:text-violet-500 uppercase tracking-widest">/ {subs.length} total</span>
          </p>
        </div>
      </div>

      <div className="rounded-3xl md:rounded-[3rem] overflow-hidden relative bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm dark:shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-1 dark:shadow-[0_0_30px_rgba(16,185,129,0.6)]" style={{ background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.6), transparent)" }} />
 
        <div className="px-8 md:px-12 py-6 md:py-8 flex items-center justify-between border-b-2 border-slate-100 dark:border-violet-500/10 bg-slate-50/50 dark:bg-violet-500/5">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center bg-violet-100 dark:bg-violet-500/10 border-2 border-violet-200 dark:border-violet-500/20 shadow-md">
              <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Billing Overview</h2>
          </div>
          <button onClick={fetchSubs} className="flex items-center gap-3 px-5 md:px-8 py-2.5 md:py-4 rounded-xl md:rounded-2xl text-xs md:text-sm font-black text-slate-600 dark:text-violet-300 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all border-2 border-transparent dark:hover:border-violet-500/30 uppercase tracking-widest">
            <RefreshCw className="h-4 w-4 md:h-5 md:w-5" /> Sync Data
          </button>
        </div>

        {subs.length === 0 && !loading && (
          <div className="text-center py-20 relative">
            <div className="absolute inset-0 opacity-5 dark:opacity-10" style={{ background: "radial-gradient(circle at center, #7c3aed, transparent 50%)" }} />
            <CreditCard className="h-16 w-16 text-slate-300 dark:text-violet-500/30 mx-auto mb-4 relative z-10" />
            <p className="text-slate-600 dark:text-violet-300 font-bold text-lg relative z-10">No subscriptions found.</p>
            <p className="text-slate-400 dark:text-violet-500 text-sm mt-2 relative z-10">Corporate subscriptions appear here once they are approved.</p>
          </div>
        )}

        {(loading || subs.length > 0) && (
          <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="text-left bg-slate-50/50 dark:bg-transparent border-b-2 border-slate-100 dark:border-violet-500/15">
                {["Company", "Plan Tier", "Status", "Start Date", "Expiry", "Management"].map(h => (
                  <th key={h} className="px-8 md:px-12 py-6 md:py-8 text-xs md:text-sm font-black text-slate-500 dark:text-violet-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100 dark:divide-violet-500/10">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-20 text-slate-500 dark:text-violet-500 font-black uppercase tracking-widest">Fetching subscriptions...</td></tr>
              ) : subs.map(sub => {
                const pStyle = planStyle[sub.plan] || planStyle.basic;
                const sStyle = statusStyle[sub.status] || statusStyle.cancelled;
                return (
                <tr key={sub.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  <td className="px-8 md:px-12 py-6 md:py-8">
                    <p className="text-base md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-wide">{sub.companies?.name || "—"}</p>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-violet-400/80 mt-1 font-bold">{sub.companies?.email || "—"}</p>
                  </td>
                  <td className="px-8 md:px-12 py-6 md:py-8">
                    <span className="text-[10px] md:text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest border-2 inline-block"
                      style={{ background: pStyle.bg, color: pStyle.text, borderColor: pStyle.border }}>
                      {sub.plan}
                    </span>
                  </td>
                  <td className="px-8 md:px-12 py-6 md:py-8">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full" style={{ backgroundColor: sStyle.text, boxShadow: `0 0 10px ${sStyle.text}` }} />
                      <span className="text-[10px] md:text-xs font-black uppercase tracking-widest" style={{ color: sStyle.text }}>
                        {sub.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 md:px-12 py-6 md:py-8 text-xs md:text-sm font-black text-slate-600 dark:text-violet-300 uppercase tracking-widest">
                    {sub.start_date ? new Date(sub.start_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "—"}
                  </td>
                  <td className="px-8 md:px-12 py-6 md:py-8 text-xs md:text-sm font-black uppercase tracking-widest">
                    <span className={isExpiring(sub.expiry_date) ? "text-amber-500 dark:text-amber-400 flex items-center gap-2" : "text-slate-600 dark:text-violet-400"}>
                      {sub.expiry_date ? new Date(sub.expiry_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "No expiry"}
                      {isExpiring(sub.expiry_date) && <span title="Expiring soon" className="inline-block w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-amber-500 animate-pulse" />}
                    </span>
                  </td>
                  <td className="px-8 md:px-12 py-6 md:py-8">
                    <div className="flex items-center gap-3 md:gap-5">
                      <div className="relative">
                        <select
                          value={sub.plan}
                          disabled={saving === sub.id}
                          onChange={e => changePlan(sub.id, e.target.value)}
                          className="text-[10px] md:text-xs font-black px-4 md:px-6 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl outline-none transition-all cursor-pointer disabled:opacity-50 appearance-none bg-slate-100 dark:bg-black/30 border-2 border-slate-200 dark:border-violet-500/30 text-slate-900 dark:text-white focus:border-violet-500 dark:focus:border-violet-500/80 uppercase tracking-widest pr-10"
                        >
                          {PLANS.map(p => <option key={p} value={p} className="bg-white dark:bg-[#0d0622] text-slate-900 dark:text-white">{p.toUpperCase()}</option>)}
                        </select>
                        <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      </div>
                      {sub.status === "active" ? (
                        <button
                          disabled={saving === sub.id}
                          onClick={() => changeStatus(sub.id, "expired")}
                          className="text-[10px] md:text-xs font-black px-5 md:px-8 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl transition-all disabled:opacity-50 uppercase tracking-widest border-2"
                          style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", borderColor: "rgba(239,68,68,0.2)" }}
                          onMouseOver={e => { if(!saving) { e.currentTarget.style.background = "rgba(239,68,68,0.2)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(239,68,68,0.3)" } }}
                          onMouseOut={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none" }}
                        >
                          Expire
                        </button>
                      ) : (
                        <button
                          disabled={saving === sub.id}
                          onClick={() => changeStatus(sub.id, "active")}
                          className="text-[10px] md:text-xs font-black px-5 md:px-8 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl transition-all disabled:opacity-50 shadow-lg uppercase tracking-widest border-2 border-transparent"
                          style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white" }}
                          onMouseOver={e => { if(!saving) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(16,185,129,0.4)" } }}
                          onMouseOut={e => { e.currentTarget.style.transform = "none" }}
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  )
}
