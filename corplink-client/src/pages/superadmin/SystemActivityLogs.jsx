import { useEffect, useState, useCallback } from "react"
import { supabase } from "../../lib/supabase"
import SuperAdminLayout from "../../components/superadmin/layout/SuperAdminLayout"
import { Search, RefreshCw, Activity, ChevronDown } from "lucide-react"

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
  const [isCoDropdownOpen, setIsCoDropdownOpen] = useState(false)
  const [isSevDropdownOpen, setIsSevDropdownOpen] = useState(false)

  useEffect(() => {
    supabase.from("companies").select("id, name").order("name").then(({ data }) => setCompanies(data || []))
  }, [])

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    let q = supabase.from("activity_logs").select("*, profiles(full_name), companies(name)", { count: "exact" }).order("created_at", { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    if (severity !== "all") q = q.eq("severity", severity)
    if (companyId !== "all") q = q.eq("company_id", companyId)
    if (search) q = q.ilike("action", `%${search}%`)
    const { data, count, error } = await q
    console.log("Fetched activity logs:", { data, count, error })
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
            className="w-full rounded-xl md:rounded-2xl pl-14 pr-6 py-4 md:py-5 text-badge md:text-heading-3 font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-black/20 border-2 border-slate-100 dark:border-violet-500/10 focus:border-violet-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 lg:flex gap-3 md:gap-4 items-start">
          {/* Company Dropdown */}
          <div className="relative group w-full lg:w-48">
            <button 
              onClick={() => { setIsCoDropdownOpen(!isCoDropdownOpen); setIsSevDropdownOpen(false); }}
              className="w-full flex items-center justify-between gap-2 rounded-xl px-4 md:px-6 py-3.5 md:py-4 text-[9px] md:text-label font-black uppercase tracking-widest text-slate-700 dark:text-white bg-slate-50 dark:bg-black/20 border-2 border-slate-100 dark:border-violet-500/10 outline-none transition-all"
            >
              <span className="truncate">{companyId === 'all' ? 'Companies' : companies.find(c => c.id === companyId)?.name}</span>
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isCoDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isCoDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-violet-500/20 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="max-h-[250px] overflow-y-auto no-scrollbar">
                  <button 
                    onClick={() => { setCompanyId('all'); setIsCoDropdownOpen(false); }}
                    className="w-full text-left px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/5 text-[9px] font-black uppercase text-slate-500 border-b border-slate-100 dark:border-white/5"
                  >
                    All Companies
                  </button>
                  {companies.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setCompanyId(c.id); setIsCoDropdownOpen(false); }}
                      className={`w-full text-left px-5 py-3 hover:bg-violet-50 dark:hover:bg-violet-500/10 text-[9px] font-black uppercase transition-all ${companyId === c.id ? 'text-violet-600 bg-violet-50/50' : 'text-slate-600 dark:text-violet-300'}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Severity Dropdown */}
          <div className="relative group w-full lg:w-40">
            <button 
              onClick={() => { setIsSevDropdownOpen(!isSevDropdownOpen); setIsCoDropdownOpen(false); }}
              className="w-full flex items-center justify-between gap-2 rounded-xl px-4 md:px-6 py-3.5 md:py-4 text-[9px] md:text-label font-black uppercase tracking-widest text-slate-700 dark:text-white bg-slate-50 dark:bg-black/20 border-2 border-slate-100 dark:border-violet-500/10 outline-none transition-all"
            >
              <span className="truncate">{severity === 'all' ? 'Levels' : severity}</span>
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isSevDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isSevDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-violet-500/20 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="max-h-[250px] overflow-y-auto">
                  {['all', 'info', 'warning', 'error', 'success'].map(level => (
                    <button
                      key={level}
                      onClick={() => { setSeverity(level); setIsSevDropdownOpen(false); }}
                      className={`w-full text-left px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/5 text-[9px] font-black uppercase transition-all ${severity === level ? 'text-violet-600 bg-violet-50/50' : 'text-slate-600 dark:text-violet-300'}`}
                    >
                      {level === 'all' ? 'All Levels' : level}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={fetchLogs} className="flex items-center justify-center p-4 rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-600/20 col-span-2 lg:col-auto"><RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
      </div>

      {/* Responsive Table/Cards Container */}
      <div className="rounded-3xl md:rounded-[3rem] overflow-hidden bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm mb-8 md:mb-12">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-violet-500/5 border-b-2 border-slate-100 dark:border-violet-500/10">
                {["Identity", "Entity", "Action", "Status", "Time"].map(h => (
                  <th key={h} className="px-10 py-8 text-badge font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100 dark:divide-violet-500/5">
              {loading ? (
                <tr><td colSpan={5} className="py-20 text-center animate-pulse font-black uppercase text-slate-400 tracking-widest text-badge">Decrypting Logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase text-badge tracking-widest">No Logs Found</td></tr>
              ) : logs.map(log => {
                const sStyle = severityStyle[log.severity] || severityStyle.info;
                return (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] group">
                    <td className="px-10 py-8">
                      <p className="text-heading-3 font-black text-slate-900 dark:text-white uppercase truncate max-w-[150px]">{log.profiles?.full_name || "System"}</p>
                      <p className="text-badge font-bold text-slate-400 truncate max-w-[150px]">{log.companies?.name || "Global"}</p>
                    </td>
                    <td className="px-10 py-8 text-badge font-black uppercase text-slate-500 tracking-widest">{log.entity || "—"}</td>
                    <td className="px-10 py-8 font-black text-slate-900 dark:text-white uppercase tracking-tight text-body truncate max-w-[200px]">{log.action}</td>
                    <td className="px-10 py-8">
                      <span className="px-4 py-1.5 rounded-full text-badge font-black uppercase tracking-widest border-2" style={{ background: sStyle.bg, color: sStyle.text, borderColor: sStyle.border }}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-badge font-black text-slate-400 uppercase whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y-2 divide-slate-100 dark:divide-violet-500/5">
           {loading ? (
             <div className="py-20 text-center animate-pulse font-black uppercase text-slate-400 tracking-widest text-badge">Loading...</div>
           ) : logs.length === 0 ? (
             <div className="py-20 text-center text-slate-400 font-bold uppercase text-badge tracking-widest">No Logs</div>
           ) : logs.map(log => {
             const sStyle = severityStyle[log.severity] || severityStyle.info;
             return (
               <div key={log.id} className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-heading-3 font-black text-slate-900 dark:text-white uppercase tracking-tight">{log.action}</p>
                      <p className="text-badge font-bold text-slate-400 uppercase mt-0.5">{log.entity || "General"}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-2" style={{ background: sStyle.bg, color: sStyle.text, borderColor: sStyle.border }}>
                      {log.severity}
                    </span>
                  </div>
                  <div className="flex justify-between items-end pt-2">
                    <div>
                      <p className="text-badge font-black text-slate-900 dark:text-white uppercase">{log.profiles?.full_name || "System"}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">{log.companies?.name || "Global"}</p>
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">
                      {new Date(log.created_at).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
               </div>
             )
           })}
        </div>

        {/* Responsive Pagination */}
        {totalPages > 1 && (
          <div className="p-6 md:p-10 border-t-2 border-slate-100 dark:border-violet-500/10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-badge font-black uppercase tracking-widest text-slate-500">Page {page + 1} of {totalPages}</p>
            <div className="flex gap-3 w-full sm:w-auto">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="flex-1 sm:flex-none px-8 py-4 rounded-xl bg-slate-100 dark:bg-white/5 border-2 border-slate-200 dark:border-violet-500/10 font-black uppercase text-badge disabled:opacity-40 transition-all">Prev</button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="flex-1 sm:flex-none px-8 py-4 rounded-xl bg-violet-600 text-white font-black uppercase text-badge shadow-lg shadow-violet-600/20 active:scale-95 transition-all">Next</button>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  )
}

