import { useEffect, useState, useCallback } from "react"
import { supabase } from "../../lib/supabase"
import SuperAdminLayout from "../../components/superadmin/layout/SuperAdminLayout"
import { Search, RefreshCw, Activity } from "lucide-react"

const severityStyle = {
  info:    { bg: "rgba(59,130,246,0.1)", text: "#60a5fa", border: "rgba(59,130,246,0.2)", glow: "rgba(59,130,246,0.4)" },
  warning: { bg: "rgba(245,158,11,0.1)", text: "#fbbf24", border: "rgba(245,158,11,0.2)", glow: "rgba(245,158,11,0.4)" },
  error:   { bg: "rgba(239,68,68,0.1)", text: "#f87171", border: "rgba(239,68,68,0.2)", glow: "rgba(239,68,68,0.4)" },
  success: { bg: "rgba(16,185,129,0.1)", text: "#34d399", border: "rgba(16,185,129,0.2)", glow: "rgba(16,185,129,0.4)" },
}

const PAGE_SIZE = 25

export default function SystemActivityLogs() {
  const [logs, setLogs]         = useState([])
  const [companies, setCompanies] = useState([])
  const [search, setSearch]     = useState("")
  const [severity, setSeverity] = useState("all")
  const [companyId, setCompanyId] = useState("all")
  const [page, setPage]         = useState(0)
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    supabase.from("companies").select("id, name").order("name")
      .then(({ data }) => setCompanies(data || []))
  }, [])

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from("activity_logs")
      .select("*, profiles(full_name), companies(name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (severity !== "all") q = q.eq("severity", severity)
    if (companyId !== "all") q = q.eq("company_id", companyId)
    if (search) q = q.ilike("action", `%${search}%`)

    const { data, count } = await q
    setLogs(data || [])
    setTotal(count || 0)
    setLoading(false)
  }, [page, severity, companyId, search])

  useEffect(() => { setPage(0) }, [severity, companyId, search])
  useEffect(() => { fetchLogs() }, [fetchLogs])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const inputCls = "rounded-xl px-4 py-2.5 text-sm text-white placeholder-violet-500/70 outline-none transition-all appearance-none cursor-pointer"
  const inputStyle = { background: "rgba(0,0,0,0.2)", border: "1px solid rgba(139,92,246,0.2)" }

  return (
    <SuperAdminLayout title="System Activity Logs" subtitle="Monitor all user actions across every corporate account in real-time">
      
      {/* Filters Bar (Glassmorphism) */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 p-3 rounded-2xl relative overflow-hidden bg-white dark:bg-white/5 border border-slate-200 dark:border-violet-500/15 shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
        
        <div className="absolute top-0 right-1/4 w-32 h-32 opacity-10 blur-2xl" style={{ background: "radial-gradient(circle, #ec4899, transparent)" }} />
        
        <div className="relative flex-1 min-w-[200px] z-10">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-violet-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search action logs..."
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-violet-500/70 outline-none transition-all bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-violet-500/20 focus:border-violet-500 dark:focus:border-violet-500/50"
          />
        </div>

        <select 
          value={companyId} 
          onChange={e => setCompanyId(e.target.value)} 
          className="rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition-all appearance-none cursor-pointer z-10 md:w-64 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-violet-500/20 focus:border-violet-500 dark:focus:border-violet-500/50"
        >
          <option value="all" className="bg-white dark:bg-[#0d0622]">All Companies</option>
          {companies.map(c => <option key={c.id} value={c.id} className="bg-white dark:bg-[#0d0622]">{c.name}</option>)}
        </select>

        <select 
          value={severity} 
          onChange={e => setSeverity(e.target.value)} 
          className="rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition-all appearance-none cursor-pointer z-10 md:w-48 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-violet-500/20 focus:border-violet-500 dark:focus:border-violet-500/50"
        >
          <option value="all" className="bg-white dark:bg-[#0d0622]">All Severities</option>
          <option value="info" className="bg-white dark:bg-[#0d0622]">Info</option>
          <option value="warning" className="bg-white dark:bg-[#0d0622]">Warning</option>
          <option value="error" className="bg-white dark:bg-[#0d0622]">Error</option>
          <option value="success" className="bg-white dark:bg-[#0d0622]">Success</option>
        </select>

        <button onClick={fetchLogs} className="px-4 py-2.5 rounded-xl transition-all z-10 flex items-center justify-center hover:scale-105 active:scale-95"
          style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 4px 15px rgba(124,58,237,0.3)" }}>
          <RefreshCw className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* Table Container */}
      <div className="rounded-3xl overflow-hidden relative bg-white dark:bg-white/5 border border-slate-200 dark:border-violet-500/15 shadow-sm dark:shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
        
        <div className="absolute top-0 left-1/3 right-1/3 h-px dark:shadow-[0_0_20px_rgba(236,72,153,0.5)]" style={{ background: "linear-gradient(90deg, transparent, rgba(236,72,153,0.5), transparent)" }} />

        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-violet-500/10 bg-slate-50 dark:bg-violet-500/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-pink-100 dark:bg-pink-500/10 border border-pink-200 dark:border-pink-500/20">
              <Activity className="h-4 w-4 text-pink-500 dark:text-pink-400" />
            </div>
            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">{total.toLocaleString()} <span className="text-slate-500 dark:text-violet-400 font-semibold">Total Logs</span></p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-200 dark:border-violet-500/10 bg-slate-50 dark:bg-transparent">
                {["User", "Company", "Action", "Entity", "Severity", "Timestamp"].map(h => (
                  <th key={h} className="px-6 py-4 text-[11px] font-black text-slate-500 dark:text-violet-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-violet-500/5">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-violet-400 font-medium">Fetching logs...</span>
                  </div>
                </td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-violet-500 font-medium text-lg">No matching logs found</td></tr>
              ) : logs.map(log => {
                const sStyle = severityStyle[log.severity] || severityStyle.info;
                return (
                <tr key={log.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                  <td className="px-6 py-3.5">
                    <p className="text-sm text-slate-900 dark:text-white font-bold tracking-wide truncate max-w-[150px]">
                      {log.profiles?.full_name || "System"}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-violet-500 mt-0.5 truncate max-w-[150px]">
                      {log.user_id?.slice(0, 12)}...
                    </p>
                  </td>
                  <td className="px-6 py-3.5 text-xs font-semibold text-slate-600 dark:text-violet-300">
                    {log.companies?.name ? (
                       <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-violet-500/10 border border-slate-200 dark:border-violet-500/20">
                         {log.companies.name}
                       </span>
                    ) : "—"}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-slate-900 dark:text-white font-medium">{log.action}</td>
                  <td className="px-6 py-3.5 text-xs text-slate-500 dark:text-violet-400">{log.entity || "—"}</td>
                  <td className="px-6 py-3.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full"
                      style={{ background: sStyle.bg, border: `1px solid ${sStyle.border}` }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sStyle.text, boxShadow: `0 0 6px ${sStyle.glow}` }} />
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: sStyle.text }}>
                        {log.severity || "info"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-xs text-slate-500 dark:text-violet-400/80 font-medium whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                    })}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-slate-200 dark:border-violet-500/10 bg-slate-50 dark:bg-violet-500/5">
            <p className="text-xs font-semibold text-slate-500 dark:text-violet-400">Page <span className="text-slate-900 dark:text-white">{page + 1}</span> of <span className="text-slate-900 dark:text-white">{totalPages}</span></p>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-violet-300 rounded-xl disabled:opacity-40 transition-all hover:bg-slate-200 dark:hover:bg-white/10 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-violet-500/20">
                Previous
              </button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 text-xs font-bold text-white rounded-xl disabled:opacity-40 transition-all shadow-lg hover:scale-105 active:scale-95 bg-gradient-to-br from-violet-600 to-indigo-600">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  )
}
