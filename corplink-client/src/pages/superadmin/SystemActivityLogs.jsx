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
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 mb-8 md:mb-12 p-4 md:p-6 rounded-3xl md:rounded-[2.5rem] relative overflow-hidden bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-lg dark:shadow-[0_15px_40px_rgba(0,0,0,0.2)]">
        
        <div className="absolute top-0 right-1/4 w-48 h-48 opacity-10 blur-3xl" style={{ background: "radial-gradient(circle, #ec4899, transparent)" }} />
        
        <div className="relative flex-1 min-w-[200px] z-10">
          <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 h-5 w-5 md:h-6 md:w-6 text-slate-400 dark:text-violet-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search action logs..."
            className="w-full rounded-2xl md:rounded-[2rem] pl-12 md:pl-16 pr-6 md:pr-8 py-4 md:py-6 text-base md:text-xl font-black text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-violet-500/70 outline-none transition-all bg-slate-50 dark:bg-black/20 border-2 border-slate-200 dark:border-violet-500/20 focus:border-violet-500 dark:focus:border-violet-500/50 shadow-inner"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4 z-10">
          <select 
            value={companyId} 
            onChange={e => setCompanyId(e.target.value)} 
            className="rounded-xl md:rounded-2xl px-6 md:px-8 py-4 md:py-6 text-xs md:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white outline-none transition-all appearance-none cursor-pointer md:w-64 bg-slate-50 dark:bg-black/20 border-2 border-slate-200 dark:border-violet-500/20 focus:border-violet-500 dark:focus:border-violet-500/50"
          >
            <option value="all" className="bg-white dark:bg-[#0d0622]">All Companies</option>
            {companies.map(c => <option key={c.id} value={c.id} className="bg-white dark:bg-[#0d0622]">{c.name}</option>)}
          </select>

          <select 
            value={severity} 
            onChange={e => setSeverity(e.target.value)} 
            className="rounded-xl md:rounded-2xl px-6 md:px-8 py-4 md:py-6 text-xs md:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white outline-none transition-all appearance-none cursor-pointer md:w-48 bg-slate-50 dark:bg-black/20 border-2 border-slate-200 dark:border-violet-500/20 focus:border-violet-500 dark:focus:border-violet-500/50"
          >
            <option value="all" className="bg-white dark:bg-[#0d0622]">All Severities</option>
            <option value="info" className="bg-white dark:bg-[#0d0622]">Info</option>
            <option value="warning" className="bg-white dark:bg-[#0d0622]">Warning</option>
            <option value="error" className="bg-white dark:bg-[#0d0622]">Error</option>
            <option value="success" className="bg-white dark:bg-[#0d0622]">Success</option>
          </select>

          <button onClick={fetchLogs} className="px-6 md:px-10 py-4 md:py-6 rounded-xl md:rounded-2xl transition-all flex items-center justify-center hover:scale-105 active:scale-95 shadow-xl"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 8px 25px rgba(124,58,237,0.4)" }}>
            <RefreshCw className="h-5 w-5 md:h-6 md:w-6 text-white font-black" />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-3xl md:rounded-[3rem] overflow-hidden relative bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm dark:shadow-[0_10px_40px_rgba(0,0,0,0.2)] mb-12">
        
        <div className="absolute top-0 left-1/3 right-1/3 h-1 dark:shadow-[0_0_30px_rgba(236,72,153,0.6)]" style={{ background: "linear-gradient(90deg, transparent, rgba(236,72,153,0.6), transparent)" }} />

        <div className="px-8 md:px-12 py-6 md:py-8 flex items-center justify-between border-b-2 border-slate-100 dark:border-violet-500/10 bg-slate-50/50 dark:bg-violet-500/5">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center bg-pink-100 dark:bg-pink-500/10 border-2 border-pink-200 dark:border-pink-500/20 shadow-md">
              <Activity className="h-5 w-5 md:h-6 md:w-6 text-pink-500 dark:text-pink-400" />
            </div>
            <p className="text-base md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">{total.toLocaleString()} <span className="text-slate-500 dark:text-violet-400 font-black opacity-60 ml-2">Total Logs</span></p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="text-left border-b-2 border-slate-100 dark:border-violet-500/10 bg-slate-50/50 dark:bg-transparent">
                {["User", "Company", "Action", "Entity", "Severity", "Timestamp"].map(h => (
                  <th key={h} className="px-8 md:px-12 py-6 md:py-8 text-xs md:text-sm font-black text-slate-500 dark:text-violet-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100 dark:divide-violet-500/5">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-20">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-violet-400 font-black uppercase tracking-widest">Fetching logs...</span>
                  </div>
                </td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-20 text-violet-500 font-black text-xl uppercase tracking-widest opacity-60">No matching logs found</td></tr>
              ) : logs.map(log => {
                const sStyle = severityStyle[log.severity] || severityStyle.info;
                return (
                <tr key={log.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                  <td className="px-8 md:px-12 py-6 md:py-8">
                    <p className="text-base md:text-lg text-slate-900 dark:text-white font-black uppercase tracking-wide truncate max-w-[200px]">
                      {log.profiles?.full_name || "System"}
                    </p>
                    <p className="text-[10px] md:text-xs text-slate-500 dark:text-violet-500 mt-1 font-bold truncate max-w-[200px]">
                      ID: {log.user_id?.slice(0, 12)}...
                    </p>
                  </td>
                  <td className="px-8 md:px-12 py-6 md:py-8 text-xs md:text-sm font-black text-slate-600 dark:text-violet-300 uppercase tracking-widest">
                    {log.companies?.name ? (
                       <span className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-violet-500/10 border-2 border-slate-200 dark:border-violet-500/20 shadow-sm">
                         {log.companies.name}
                       </span>
                    ) : "—"}
                  </td>
                  <td className="px-8 md:px-12 py-6 md:py-8 text-base md:text-lg text-slate-900 dark:text-white font-black uppercase tracking-widest">{log.action}</td>
                  <td className="px-8 md:px-12 py-6 md:py-8 text-xs md:text-sm text-slate-500 dark:text-violet-400 font-bold uppercase tracking-widest">{log.entity || "—"}</td>
                  <td className="px-8 md:px-12 py-6 md:py-8">
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border-2"
                      style={{ background: sStyle.bg, borderColor: sStyle.border }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sStyle.text, boxShadow: `0 0 10px ${sStyle.glow}` }} />
                      <span className="text-[10px] md:text-xs font-black uppercase tracking-widest" style={{ color: sStyle.text }}>
                        {log.severity || "info"}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 md:px-12 py-6 md:py-8 text-xs md:text-sm text-slate-500 dark:text-violet-400/80 font-black uppercase tracking-widest whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-8 md:px-12 py-6 md:py-8 flex items-center justify-between border-t-2 border-slate-200 dark:border-violet-500/10 bg-slate-50/50 dark:bg-violet-500/5">
            <p className="text-xs md:text-sm font-black text-slate-500 dark:text-violet-400 uppercase tracking-widest">Page <span className="text-slate-900 dark:text-white">{page + 1}</span> of <span className="text-slate-900 dark:text-white">{totalPages}</span></p>
            <div className="flex gap-4 md:gap-6">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="px-6 md:px-10 py-3 md:py-4 text-xs md:text-sm font-black uppercase tracking-widest text-slate-600 dark:text-violet-300 rounded-xl md:rounded-2xl disabled:opacity-40 transition-all hover:bg-slate-200 dark:hover:bg-white/10 bg-slate-100 dark:bg-white/5 border-2 border-slate-200 dark:border-violet-500/20 shadow-md">
                Previous
              </button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                className="px-6 md:px-10 py-3 md:py-4 text-xs md:text-sm font-black uppercase tracking-widest text-white rounded-xl md:rounded-2xl disabled:opacity-40 transition-all shadow-xl hover:scale-105 active:scale-95 bg-gradient-to-br from-violet-600 to-indigo-600">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  )
}
