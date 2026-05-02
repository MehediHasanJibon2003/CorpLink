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
      <div className="mb-6 inline-flex items-center gap-3 px-5 py-3 rounded-2xl relative overflow-hidden"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(139,92,246,0.15)" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.1))", border: "1px solid rgba(16,185,129,0.2)" }}>
          <Sparkles className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <p className="text-xs font-bold text-violet-400 uppercase tracking-widest">Active Subscriptions</p>
          <p className="text-xl font-black text-white">{subs.filter(s => s.status === 'active').length} <span className="text-sm font-medium text-violet-500">/ {subs.length} total</span></p>
        </div>
      </div>

      <div className="rounded-3xl overflow-hidden relative"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(139,92,246,0.12)", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)", boxShadow: "0 0 20px rgba(16,185,129,0.5)" }} />

        <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)", background: "rgba(139,92,246,0.02)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.1))" }}>
              <CreditCard className="h-4 w-4 text-violet-400" />
            </div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Billing Overview</h2>
          </div>
          <button onClick={fetchSubs} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-violet-300 bg-white/5 hover:bg-white/10 hover:text-white transition-all border border-transparent hover:border-violet-500/30">
            <RefreshCw className="h-3.5 w-3.5" /> Sync Data
          </button>
        </div>

        {subs.length === 0 && !loading && (
          <div className="text-center py-20 relative">
            <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at center, #7c3aed, transparent 50%)" }} />
            <CreditCard className="h-16 w-16 text-violet-500/30 mx-auto mb-4 relative z-10" />
            <p className="text-violet-300 font-bold text-lg relative z-10">No subscriptions found.</p>
            <p className="text-violet-500 text-sm mt-2 relative z-10">Corporate subscriptions appear here once they are approved.</p>
          </div>
        )}

        {(loading || subs.length > 0) && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
                  {["Company", "Plan Tier", "Status", "Start Date", "Expiry", "Management"].map(h => (
                    <th key={h} className="px-6 py-4 text-xs font-black text-violet-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "rgba(139,92,246,0.06)" }}>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-violet-500 font-medium">Fetching subscriptions...</td></tr>
                ) : subs.map(sub => {
                  const pStyle = planStyle[sub.plan] || planStyle.basic;
                  const sStyle = statusStyle[sub.status] || statusStyle.cancelled;
                  return (
                  <tr key={sub.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <p className="font-bold text-white tracking-wide">{sub.companies?.name || "—"}</p>
                      <p className="text-xs text-violet-400/80 mt-0.5">{sub.companies?.email || "—"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block"
                        style={{ background: pStyle.bg, color: pStyle.text, border: `1px solid ${pStyle.border}` }}>
                        {sub.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sStyle.text, boxShadow: `0 0 8px ${sStyle.text}` }} />
                        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: sStyle.text }}>
                          {sub.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-violet-300">
                      {sub.start_date ? new Date(sub.start_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "—"}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium">
                      <span className={isExpiring(sub.expiry_date) ? "text-amber-400 flex items-center gap-1" : "text-violet-400"}>
                        {sub.expiry_date ? new Date(sub.expiry_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "No expiry"}
                        {isExpiring(sub.expiry_date) && <span title="Expiring soon" className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse ml-1" />}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <select
                          value={sub.plan}
                          disabled={saving === sub.id}
                          onChange={e => changePlan(sub.id, e.target.value)}
                          className="text-[11px] font-bold px-3 py-1.5 rounded-xl outline-none transition-all cursor-pointer disabled:opacity-50 appearance-none"
                          style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(139,92,246,0.3)", color: "white" }}
                          onFocus={(e) => { e.target.style.borderColor = "rgba(139,92,246,0.8)" }}
                          onBlur={(e) => { e.target.style.borderColor = "rgba(139,92,246,0.3)" }}
                        >
                          {PLANS.map(p => <option key={p} value={p} className="bg-[#0d0622]">{p.toUpperCase()}</option>)}
                        </select>
                        {sub.status === "active" ? (
                          <button
                            disabled={saving === sub.id}
                            onClick={() => changeStatus(sub.id, "expired")}
                            className="text-[11px] font-bold px-4 py-1.5 rounded-xl transition-all disabled:opacity-50"
                            style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
                            onMouseOver={e => { if(!saving) e.currentTarget.style.background = "rgba(239,68,68,0.2)" }}
                            onMouseOut={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
                          >
                            Expire
                          </button>
                        ) : (
                          <button
                            disabled={saving === sub.id}
                            onClick={() => changeStatus(sub.id, "active")}
                            className="text-[11px] font-bold px-4 py-1.5 rounded-xl transition-all disabled:opacity-50 shadow-lg"
                            style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white" }}
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
