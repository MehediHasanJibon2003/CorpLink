import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import SuperAdminLayout from "../../components/superadmin/layout/SuperAdminLayout"
import { Search, CheckCircle, XCircle, PauseCircle, X } from "lucide-react"

const STATUS_TABS = ["all", "pending", "active", "inactive", "rejected"]

const statusStyle = {
  pending:  { bg: "rgba(245,158,11,0.1)", text: "#fbbf24", border: "rgba(245,158,11,0.2)", label: "Pending" },
  active:   { bg: "rgba(16,185,129,0.1)", text: "#34d399", border: "rgba(16,185,129,0.2)", label: "Active" },
  inactive: { bg: "rgba(148,163,184,0.1)", text: "#94a3b8", border: "rgba(148,163,184,0.2)", label: "Inactive" },
  rejected: { bg: "rgba(239,68,68,0.1)", text: "#f87171", border: "rgba(239,68,68,0.2)", label: "Rejected" },
}

const planStyle = {
  basic:      { bg: "rgba(148,163,184,0.1)", text: "#94a3b8", border: "rgba(148,163,184,0.2)" },
  standard:   { bg: "rgba(59,130,246,0.1)", text: "#60a5fa", border: "rgba(59,130,246,0.2)" },
  enterprise: { bg: "rgba(124,58,237,0.1)", text: "#a78bfa", border: "rgba(124,58,237,0.2)" },
}

export default function CorporateManagement() {
  const [companies, setCompanies] = useState([])
  const [filtered, setFiltered]   = useState([])
  const [tab, setTab]             = useState("all")
  const [search, setSearch]       = useState("")
  const [loading, setLoading]     = useState(true)
  const [denyModal, setDenyModal] = useState(null)
  const [denyReason, setDenyReason] = useState("")
  const [saving, setSaving]       = useState(false)

  const fetchCompanies = async () => {
    setLoading(true)
    const { data } = await supabase.from("companies").select("*").order("created_at", { ascending: false })
    setCompanies(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchCompanies() }, [])

  useEffect(() => {
    let list = [...companies]
    if (tab !== "all") list = list.filter(c => c.status === tab)
    if (search) list = list.filter(c =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(list)
  }, [companies, tab, search])

  const updateStatus = async (id, status, extra = {}) => {
    setSaving(true)
    const patch = { status, ...extra }
    if (status === "active") patch.approved_at = new Date().toISOString()
    await supabase.from("companies").update(patch).eq("id", id)
    await fetchCompanies()
    setSaving(false)
    setDenyModal(null)
    setDenyReason("")
  }

  const counts = STATUS_TABS.reduce((acc, t) => {
    acc[t] = t === "all" ? companies.length : companies.filter(c => c.status === t).length
    return acc
  }, {})

  return (
    <SuperAdminLayout title="Corporate Management" subtitle="Approve, manage and monitor all registered companies">
      {/* Search & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        {/* Status Tabs */}
        <div className="flex gap-3 md:gap-4 flex-wrap p-2 md:p-3 rounded-2xl md:rounded-3xl bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10 shadow-sm">
          {STATUS_TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 md:px-8 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-black uppercase tracking-widest transition-all duration-300 ${
                tab === t 
                  ? "text-white shadow-xl bg-gradient-to-br from-violet-600 to-indigo-600 dark:shadow-[0_8px_20px_rgba(124,58,237,0.4)] scale-105" 
                  : "text-slate-500 dark:text-violet-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10"
              }`}
            >
              {t} <span className="opacity-60 ml-2">({counts[t] || 0})</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 h-5 w-5 md:h-6 md:w-6 text-slate-400 dark:text-violet-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search corporates..."
            className="w-full rounded-2xl md:rounded-[2rem] pl-12 md:pl-16 pr-6 md:pr-8 py-4 md:py-6 text-base md:text-xl font-black text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-violet-500/70 outline-none transition-all bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 focus:border-violet-500 dark:focus:border-violet-500/50 focus:shadow-[0_0_25px_rgba(139,92,246,0.15)] shadow-sm"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-3xl md:rounded-[3rem] overflow-hidden relative bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm dark:shadow-[0_10px_40px_rgba(0,0,0,0.2)] mb-12">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-1 dark:shadow-[0_0_30px_rgba(139,92,246,0.6)]" style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent)" }} />
 
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="text-left bg-slate-50/50 dark:bg-violet-500/5 border-b-2 border-slate-100 dark:border-violet-500/15">
                {["Company", "Plan", "Status", "Registered", "Actions"].map(h => (
                  <th key={h} className="px-8 md:px-12 py-6 md:py-8 text-xs md:text-sm font-black text-slate-500 dark:text-violet-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100 dark:divide-violet-500/10">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-20 text-slate-500 dark:text-violet-500 font-black uppercase tracking-widest">Loading companies...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-20 text-slate-500 dark:text-violet-500 font-black uppercase tracking-widest">No companies found</td></tr>
              ) : filtered.map((company, i) => {
                const sStyle = statusStyle[company.status] || statusStyle.pending
                const pStyle = planStyle[company.plan] || planStyle.basic
                return (
                  <tr key={company.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="px-8 md:px-12 py-6 md:py-8">
                      <div className="flex items-center gap-4 md:gap-6">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center font-black text-white text-base md:text-2xl shadow-lg"
                          style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                          {company.name?.charAt(0)?.toUpperCase() || "C"}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white text-base md:text-xl uppercase tracking-wide">{company.name}</p>
                          <p className="text-xs md:text-sm text-slate-500 dark:text-violet-400/80 mt-1 font-bold">{company.email || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 md:px-12 py-6 md:py-8">
                      <span className="text-[10px] md:text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest border-2"
                        style={{ background: pStyle.bg, color: pStyle.text, borderColor: pStyle.border }}>
                        {company.plan || "basic"}
                      </span>
                    </td>
                    <td className="px-8 md:px-12 py-6 md:py-8">
                      <span className="text-[10px] md:text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest border-2"
                        style={{ background: sStyle.bg, color: sStyle.text, borderColor: sStyle.border }}>
                        {sStyle.label || company.status}
                      </span>
                      {company.rejection_reason && (
                        <p className="text-[10px] md:text-xs text-red-600 dark:text-red-400 mt-2 max-w-[150px] truncate font-bold uppercase tracking-wider" title={company.rejection_reason}>
                          Reason: {company.rejection_reason}
                        </p>
                      )}
                    </td>
                    <td className="px-8 md:px-12 py-6 md:py-8 text-xs md:text-sm font-black text-slate-600 dark:text-violet-400/80 uppercase tracking-widest">
                      {new Date(company.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-8 md:px-12 py-6 md:py-8">
                      <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                        {company.status !== "active" && (
                          <button
                            disabled={saving}
                            onClick={() => updateStatus(company.id, "active")}
                            className="group flex items-center gap-3 text-xs md:text-sm font-black px-6 py-3 rounded-xl md:rounded-[1.5rem] transition-all disabled:opacity-50 uppercase tracking-[0.15em] border-2"
                            style={{ background: "rgba(16,185,129,0.1)", color: "#34d399", borderColor: "rgba(16,185,129,0.2)" }}
                            onMouseOver={e => { if(!saving) { e.currentTarget.style.background = "rgba(16,185,129,0.2)"; e.currentTarget.style.boxShadow = "0 10px 25px rgba(16,185,129,0.3)"; e.currentTarget.style.transform = "translateY(-3px)" } }}
                            onMouseOut={e => { e.currentTarget.style.background = "rgba(16,185,129,0.1)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none" }}
                          >
                            <CheckCircle className="h-5 w-5 stroke-[2.5px] group-hover:scale-110 transition-transform" /> Approve
                          </button>
                        )}
                        {company.status !== "rejected" && (
                          <button
                            disabled={saving}
                            onClick={() => { setDenyModal(company); setDenyReason("") }}
                            className="group flex items-center gap-3 text-xs md:text-sm font-black px-6 py-3 rounded-xl md:rounded-[1.5rem] transition-all disabled:opacity-50 uppercase tracking-[0.15em] border-2"
                            style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", borderColor: "rgba(239,68,68,0.2)" }}
                            onMouseOver={e => { if(!saving) { e.currentTarget.style.background = "rgba(239,68,68,0.2)"; e.currentTarget.style.boxShadow = "0 10px 25px rgba(239,68,68,0.3)"; e.currentTarget.style.transform = "translateY(-3px)" } }}
                            onMouseOut={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none" }}
                          >
                            <XCircle className="h-5 w-5 stroke-[2.5px] group-hover:scale-110 transition-transform" /> Deny
                          </button>
                        )}
                        {company.status === "active" && (
                          <button
                            disabled={saving}
                            onClick={() => updateStatus(company.id, "inactive")}
                            className="group flex items-center gap-3 text-xs md:text-sm font-black px-6 py-3 rounded-xl md:rounded-[1.5rem] transition-all disabled:opacity-50 uppercase tracking-[0.15em] border-2"
                            style={{ background: "rgba(148,163,184,0.1)", color: "#94a3b8", borderColor: "rgba(148,163,184,0.2)" }}
                            onMouseOver={e => { if(!saving) { e.currentTarget.style.background = "rgba(148,163,184,0.2)"; e.currentTarget.style.transform = "translateY(-3px)" } }}
                            onMouseOut={e => { e.currentTarget.style.background = "rgba(148,163,184,0.1)"; e.currentTarget.style.transform = "none" }}
                          >
                            <PauseCircle className="h-5 w-5 stroke-[2.5px] group-hover:scale-110 transition-transform" /> Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deny Modal (Glassmorphism) */}
      {denyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 dark:bg-black/90 backdrop-blur-xl transition-all animate-in fade-in duration-300">
          <div className="rounded-[2.5rem] p-10 md:p-14 w-full max-w-2xl relative overflow-hidden bg-white dark:bg-[#0d0622] border-2 border-slate-100 dark:border-violet-500/30 shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
            
            {/* Modal Ambient Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 opacity-10 dark:opacity-20 -translate-y-1/2 translate-x-1/2 blur-[80px]" style={{ background: "radial-gradient(circle, #ef4444, transparent)" }} />

            <div className="flex items-center justify-between mb-10 relative z-10">
              <h3 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white flex items-center gap-4 uppercase tracking-tight">
                <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                Reject Corporate
              </h3>
              <button onClick={() => setDenyModal(null)} className="text-slate-400 dark:text-violet-400 hover:text-slate-900 dark:hover:text-white transition-all bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 p-4 rounded-2xl hover:rotate-90">
                <X className="h-6 w-6 md:h-8 md:w-8" />
              </button>
            </div>
            
            <p className="text-base md:text-xl text-slate-600 dark:text-violet-300 mb-8 relative z-10 font-bold leading-relaxed">
              You are rejecting <strong className="text-slate-900 dark:text-white font-black uppercase tracking-wide">{denyModal.name}</strong>. Please provide a reason to notify them.
            </p>
            
            <textarea
              value={denyReason}
              onChange={e => setDenyReason(e.target.value)}
              rows={4}
              placeholder="Enter rejection reason…"
              className="w-full rounded-2xl md:rounded-3xl px-8 py-6 md:py-8 text-base md:text-xl font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-violet-500/50 outline-none transition-all resize-none relative z-10 mb-10 bg-slate-50 dark:bg-black/40 border-2 border-slate-100 dark:border-violet-500/20 focus:border-violet-500 dark:focus:border-violet-500/60"
            />
            
            <div className="flex gap-6 justify-end relative z-10 pt-8 border-t-2 border-slate-50 dark:border-white/5">
              <button onClick={() => setDenyModal(null)} className="px-8 py-4 text-sm md:text-lg font-black uppercase tracking-widest text-slate-500 dark:text-violet-400 hover:text-slate-900 dark:hover:text-white transition-all">
                Cancel
              </button>
              <button
                disabled={saving || !denyReason.trim()}
                onClick={() => updateStatus(denyModal.id, "rejected", { rejection_reason: denyReason })}
                className="px-10 py-4 disabled:opacity-50 text-white text-sm md:text-lg font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-2xl hover:scale-105 active:scale-95 bg-gradient-to-br from-red-500 to-red-600 dark:shadow-[0_12px_30px_rgba(239,68,68,0.4)]"
              >
                {saving ? "Saving…" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  )
}
