import { useEffect, useState, useCallback } from "react"
import { supabase } from "../../lib/supabase"
import SuperAdminLayout from "../../components/superadmin/layout/SuperAdminLayout"
import { Search, RefreshCw, Activity } from "lucide-react"

const severityStyle = {
  info:    { bg: "rgba(59,130,246,0.1)", text: "#60a5fa", border: "rgba(59,130,246,0.2)" },
  warning: { bg: "rgba(245,158,11,0.1)", text: "#fbbf24", border: "rgba(245,158,11,0.2)" },
  error:   { bg: "rgba(239,68,68,0.1)", text: "#f87171", border: "rgba(239,68,68,0.2)" },
  success: { bg: "rgba(16,185,129,0.1)", text: "#34d399", border: "rgba(16,185,129,0.2)" },
}

const PAGE_SIZE = 25

export default function SystemActivityLogs() {
  const [logs, setLogs] = useState([])
  const [companies, setCompanies] = useState([])
  const [search, setSearch] = useState("")
  const [severity, setSeverity] = useState("all")
  const [companyId, setCompanyId] = useState("all")
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from("companies").select("id, name").order("name").then(({ data }) => setCompanies(data || []))
  }, [])

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    let q = supabase.from("activity_logs").select("*, profiles(full_name), companies(name)", { count: "exact" }).order("created_at", { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
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

  return (
    <SuperAdminLayout title="Activity Logs" subtitle="Platform-wide audit telemetry">
      
      {/* Responsive Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 mb-8 md:mb-12 p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search action logs..."
            className="w-full rounded-2xl pl-14 pr-6 py-4 md:py-5 text-body md:text-heading-3 font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-black/20 border-2 border-slate-100 dark:border-violet-500/10 focus:border-violet-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-4">
          <select value={companyId} onChange={e => setCompanyId(e.target.value)} className="rounded-xl px-6 py-4 text-[10px] md:text-label font-black uppercase tracking-widest text-slate-700 dark:text-white bg-slate-50 dark:bg-black/20 border-2 border-slate-100 dark:border-violet-500/10 outline-none lg:w-48">
            <option value="all">All Companies</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={severity} onChange={e => setSeverity(e.target.value)} className="rounded-xl px-6 py-4 text-[10px] md:text-label font-black uppercase tracking-widest text-slate-700 dark:text-white bg-slate-50 dark:bg-black/20 border-2 border-slate-100 dark:border-violet-500/10 outline-none lg:w-40">
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
          <button onClick={fetchLogs} className="flex items-center justify-center p-4 rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-600/20"><RefreshCw className="h-5 w-5" /></button>
        </div>
      </div>

      {/* Responsive Table Container */}
      <div className="rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm mb-8 md:mb-12">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px] lg:min-w-full">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-violet-500/5 border-b-2 border-slate-100 dark:border-violet-500/10">
                {["Identity", "Entity", "Action", "Status", "Time"].map(h => (
                  <th key={h} className="px-8 py-6 md:py-8 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100 dark:divide-violet-500/5">
              {loading ? (
                <tr><td colSpan={5} className="py-20 text-center animate-pulse font-black uppercase text-slate-400">Syncing logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase text-label">No logs found</td></tr>
              ) : logs.map(log => {
                const sStyle = severityStyle[log.severity] || severityStyle.info;
                return (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="px-8 py-6 md:py-8">
                      <p className="text-body md:text-heading-3 font-black text-slate-900 dark:text-white uppercase truncate max-w-[150px]">{log.profiles?.full_name || "System"}</p>
                      <p className="text-[9px] md:text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{log.companies?.name || "Global"}</p>
                    </td>
                    <td className="px-8 py-6 md:py-8 text-[10px] md:text-label font-black uppercase text-slate-500 tracking-widest">{log.entity || "—"}</td>
                    <td className="px-8 py-6 md:py-8 font-black text-slate-900 dark:text-white uppercase tracking-tight text-label md:text-body truncate max-w-[200px]">{log.action}</td>
                    <td className="px-8 py-6 md:py-8">
                      <span className="px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border-2" style={{ background: sStyle.bg, color: sStyle.text, borderColor: sStyle.border }}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-8 py-6 md:py-8 text-[9px] md:text-[10px] font-black text-slate-400 uppercase whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Responsive Pagination */}
        {totalPages > 1 && (
          <div className="p-6 md:p-10 border-t-2 border-slate-100 dark:border-violet-500/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[10px] md:text-label font-black uppercase tracking-widest text-slate-500">Page {page + 1} of {totalPages}</p>
            <div className="flex gap-4 w-full sm:w-auto">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border-2 border-slate-200 dark:border-violet-500/10 font-black uppercase text-[10px] disabled:opacity-40">Prev</button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-violet-600 text-white font-black uppercase text-[10px] shadow-lg shadow-violet-600/20">Next</button>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  )
}

