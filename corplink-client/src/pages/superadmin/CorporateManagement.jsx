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
        <div className="flex gap-2 flex-wrap p-1 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-violet-500/10 shadow-sm">
          {STATUS_TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all duration-300 ${
                tab === t 
                  ? "text-white shadow-lg bg-gradient-to-br from-violet-600 to-indigo-600 dark:shadow-[0_4px_12px_rgba(124,58,237,0.3)]" 
                  : "text-slate-500 dark:text-violet-400 hover:text-slate-800 dark:hover:text-violet-200 hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              {t} <span className="opacity-70 ml-1">({counts[t] || 0})</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-violet-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search corporates..."
            className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-violet-500 outline-none transition-all bg-white dark:bg-white/5 border border-slate-200 dark:border-violet-500/15 focus:border-violet-500 dark:focus:border-violet-500/50 focus:shadow-[0_0_15px_rgba(139,92,246,0.1)] shadow-sm"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-3xl overflow-hidden relative bg-white dark:bg-white/5 border border-slate-200 dark:border-violet-500/15 shadow-sm dark:shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-px dark:shadow-[0_0_20px_rgba(139,92,246,0.5)]" style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent)" }} />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-slate-50 dark:bg-violet-500/5 border-b border-slate-200 dark:border-violet-500/10">
                {["Company", "Plan", "Status", "Registered", "Actions"].map(h => (
                  <th key={h} className="px-6 py-4 text-xs font-black text-slate-500 dark:text-violet-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-violet-500/5">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-500 dark:text-violet-500 font-medium">Loading companies...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-500 dark:text-violet-500 font-medium">No companies found</td></tr>
              ) : filtered.map((company, i) => {
                const sStyle = statusStyle[company.status] || statusStyle.pending
                const pStyle = planStyle[company.plan] || planStyle.basic
                return (
                  <tr key={company.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-md"
                          style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                          {company.name?.charAt(0)?.toUpperCase() || "C"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white tracking-wide">{company.name}</p>
                          <p className="text-xs text-slate-500 dark:text-violet-400/80 mt-0.5">{company.email || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                        style={{ background: pStyle.bg, color: pStyle.text, border: `1px solid ${pStyle.border}` }}>
                        {company.plan || "basic"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                        style={{ background: sStyle.bg, color: sStyle.text, border: `1px solid ${sStyle.border}` }}>
                        {sStyle.label || company.status}
                      </span>
                      {company.rejection_reason && (
                        <p className="text-[10px] text-red-600 dark:text-red-400 mt-1 max-w-[150px] truncate" title={company.rejection_reason}>
                          Reason: {company.rejection_reason}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-violet-400/80">
                      {new Date(company.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {company.status !== "active" && (
                          <button
                            disabled={saving}
                            onClick={() => updateStatus(company.id, "active")}
                            className="group flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
                            style={{ background: "rgba(16,185,129,0.1)", color: "#34d399", border: "1px solid rgba(16,185,129,0.2)" }}
                            onMouseOver={e => { if(!saving) { e.currentTarget.style.background = "rgba(16,185,129,0.2)"; e.currentTarget.style.boxShadow = "0 0 10px rgba(16,185,129,0.3)" } }}
                            onMouseOut={e => { e.currentTarget.style.background = "rgba(16,185,129,0.1)"; e.currentTarget.style.boxShadow = "none" }}
                          >
                            <CheckCircle className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" /> Approve
                          </button>
                        )}
                        {company.status !== "rejected" && (
                          <button
                            disabled={saving}
                            onClick={() => { setDenyModal(company); setDenyReason("") }}
                            className="group flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
                            style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
                            onMouseOver={e => { if(!saving) { e.currentTarget.style.background = "rgba(239,68,68,0.2)"; e.currentTarget.style.boxShadow = "0 0 10px rgba(239,68,68,0.3)" } }}
                            onMouseOut={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.boxShadow = "none" }}
                          >
                            <XCircle className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" /> Deny
                          </button>
                        )}
                        {company.status === "active" && (
                          <button
                            disabled={saving}
                            onClick={() => updateStatus(company.id, "inactive")}
                            className="group flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
                            style={{ background: "rgba(148,163,184,0.1)", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.2)" }}
                            onMouseOver={e => { if(!saving) { e.currentTarget.style.background = "rgba(148,163,184,0.2)" } }}
                            onMouseOut={e => { e.currentTarget.style.background = "rgba(148,163,184,0.1)" }}
                          >
                            <PauseCircle className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" /> Deactivate
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/80 backdrop-blur-md transition-opacity">
          <div className="rounded-3xl p-6 w-full max-w-md relative overflow-hidden bg-white dark:bg-[#0d0622] border border-slate-200 dark:border-violet-500/30 shadow-2xl">
            
            {/* Modal Ambient Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10 dark:opacity-20 -translate-y-10 translate-x-10 blur-2xl" style={{ background: "radial-gradient(circle, #ef4444, transparent)" }} />

            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                Reject Corporate
              </h3>
              <button onClick={() => setDenyModal(null)} className="text-slate-500 dark:text-violet-400 hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 p-2 rounded-xl">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-violet-300 mb-4 relative z-10">
              You are rejecting <strong className="text-slate-900 dark:text-white font-black">{denyModal.name}</strong>. Please provide a reason to notify them.
            </p>
            
            <textarea
              value={denyReason}
              onChange={e => setDenyReason(e.target.value)}
              rows={4}
              placeholder="Enter rejection reason…"
              className="w-full rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-violet-500/70 outline-none transition-all resize-none relative z-10 mb-6 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-violet-500/20 focus:border-violet-500 dark:focus:border-violet-500/50 focus:shadow-[0_0_15px_rgba(139,92,246,0.1)]"
            />
            
            <div className="flex gap-3 justify-end relative z-10">
              <button onClick={() => setDenyModal(null)} className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-violet-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                Cancel
              </button>
              <button
                disabled={saving || !denyReason.trim()}
                onClick={() => updateStatus(denyModal.id, "rejected", { rejection_reason: denyReason })}
                className="px-6 py-2.5 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-lg bg-gradient-to-br from-red-500 to-red-600 dark:shadow-[0_4px_15px_rgba(239,68,68,0.4)]"
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
