import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../../lib/supabase"
import SuperAdminLayout from "../../components/superadmin/layout/SuperAdminLayout"
import { Building2, Users, Activity, CheckCircle2, AlertTriangle, TrendingUp, Zap, ArrowRight } from "lucide-react"

const STAT_CARDS = [
  {
    key: "total",
    title: "Total Corporates",
    icon: Building2,
    gradient: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
    glow: "rgba(124,58,237,0.4)",
    bg: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.08))",
    border: "rgba(124,58,237,0.25)",
    iconBg: "linear-gradient(135deg, #7c3aed, #4f46e5)",
  },
  {
    key: "active",
    title: "Active Corporates",
    icon: CheckCircle2,
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    glow: "rgba(16,185,129,0.4)",
    bg: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.06))",
    border: "rgba(16,185,129,0.2)",
    iconBg: "linear-gradient(135deg, #10b981, #059669)",
  },
  {
    key: "users",
    title: "Platform Users",
    icon: Users,
    gradient: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
    glow: "rgba(59,130,246,0.4)",
    bg: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.06))",
    border: "rgba(59,130,246,0.2)",
    iconBg: "linear-gradient(135deg, #3b82f6, #6366f1)",
  },
  {
    key: "inactive",
    title: "Inactive Accounts",
    icon: TrendingUp,
    gradient: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
    glow: "rgba(245,158,11,0.4)",
    bg: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.06))",
    border: "rgba(245,158,11,0.2)",
    iconBg: "linear-gradient(135deg, #f59e0b, #ef4444)",
  },
]

const QUICK_LINKS = [
  { label: "Manage Corporates",  path: "/super-admin/corporates",    grad: "from-violet-600 to-indigo-600", hover: "rgba(124,58,237,0.3)" },
  { label: "Subscriptions",      path: "/super-admin/subscriptions", grad: "from-emerald-600 to-teal-600",  hover: "rgba(16,185,129,0.3)" },
  { label: "Activity Logs",      path: "/super-admin/logs",          grad: "from-rose-600 to-pink-600",     hover: "rgba(244,63,94,0.3)" },
  { label: "Announcements",      path: "/super-admin/announcements", grad: "from-fuchsia-600 to-purple-600",hover: "rgba(192,38,211,0.3)" },
]

const severityStyle = {
  info:    { bg: "rgba(59,130,246,0.1)",  text: "#60a5fa", border: "rgba(59,130,246,0.2)"  },
  warning: { bg: "rgba(245,158,11,0.1)", text: "#fbbf24", border: "rgba(245,158,11,0.2)" },
  error:   { bg: "rgba(239,68,68,0.1)",  text: "#f87171", border: "rgba(239,68,68,0.2)"  },
  success: { bg: "rgba(16,185,129,0.1)", text: "#34d399", border: "rgba(16,185,129,0.2)" },
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({ total: 0, pending: 0, active: 0, inactive: 0, users: 0 })
  const [logs, setLogs]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [{ data: companies }, { data: profiles }, { data: activity }] = await Promise.all([
        supabase.from("companies").select("status"),
        supabase.from("profiles").select("id").neq("role", "super_admin"),
        supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(8),
      ])
      const cs = companies || []
      setStats({
        total:    cs.length,
        pending:  cs.filter(c => c.status === "pending").length,
        active:   cs.filter(c => c.status === "active").length,
        inactive: cs.filter(c => c.status === "inactive").length,
        users:    profiles?.length || 0,
      })
      setLogs(activity || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <SuperAdminLayout title="Platform Overview" subtitle="Real-time health and activity across all corporate accounts">

      {/* Pending Alert Banner */}
      {stats.pending > 0 && (
        <div className="mb-8 md:mb-12 flex items-center gap-4 md:gap-6 px-6 md:px-10 py-5 md:py-8 rounded-3xl md:rounded-[2.5rem] relative overflow-hidden bg-amber-50 dark:bg-amber-500/10 border-2 border-amber-200 dark:border-amber-500/25 shadow-lg shadow-amber-500/10">
          <div className="absolute inset-0 opacity-5 dark:opacity-10 bg-gradient-to-r from-amber-500 to-red-500" />
          <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-amber-500 dark:text-amber-400 shrink-0 relative z-10 dark:drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
          <p className="text-sm md:text-lg font-black relative z-10 text-amber-800 dark:text-amber-200 uppercase tracking-widest">
            <span className="text-amber-600 dark:text-amber-400">{stats.pending} corporate{stats.pending > 1 ? "s" : ""}</span> awaiting approval
          </p>
          <Link to="/super-admin/corporates"
            className="ml-auto flex items-center gap-2 text-xs md:text-sm font-black relative z-10 hover:gap-3 transition-all text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 uppercase tracking-widest">
            Review Now <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
          </Link>
        </div>
      )}

      {/* Gradient Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10 mb-10 md:mb-16">
        {STAT_CARDS.map(card => (
          <div key={card.key} className="relative rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 overflow-hidden group cursor-default bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 shadow-sm hover:shadow-xl transition-all duration-300">
            {/* Corner glow */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 dark:opacity-30 transition-opacity group-hover:opacity-25 dark:group-hover:opacity-60 blur-xl"
              style={{ background: `radial-gradient(circle, ${card.glow}, transparent 70%)` }} />
 
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-[10px] md:text-xs font-black text-slate-500 dark:text-white/50 uppercase tracking-widest mb-3 md:mb-4">{card.title}</p>
                <p className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white dark:drop-shadow-[0_0_30px_var(--glow)]" style={{ "--glow": card.glow }}>
                  {loading ? "—" : stats[card.key]}
                </p>
                {card.key === "total" && !loading && (
                  <p className="text-[10px] md:text-xs mt-2 md:mt-3 font-black uppercase tracking-wider" style={{ color: "var(--glow-text)" }}>
                    <span style={{ "--glow-text": card.glow.replace("0.4", "0.9") }} className="dark:inline hidden">{stats.pending} pending approval</span>
                    <span className="dark:hidden text-violet-600 font-bold">{stats.pending} pending approval</span>
                  </p>
                )}
              </div>
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg dark:shadow-[0_8px_30px_var(--glow)] transition-transform group-hover:scale-110 duration-300"
                style={{ background: card.iconBg, "--glow": card.glow }}>
                <card.icon className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
            </div>
 
            {/* Bottom gradient bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 md:h-1.5 opacity-100 dark:opacity-60"
              style={{ background: card.gradient }} />
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10 md:mb-16">
        {QUICK_LINKS.map(item => (
          <Link key={item.path} to={item.path}
            className="group relative flex items-center justify-between px-6 md:px-8 py-5 md:py-8 rounded-2xl md:rounded-[1.5rem] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm">
            {/* Hover glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 dark:group-hover:opacity-100 transition-opacity"
              style={{ background: `linear-gradient(135deg, ${item.hover}, transparent)` }} />
            <span className="text-sm md:text-lg font-black text-slate-700 dark:text-white/70 group-hover:text-slate-900 dark:group-hover:text-white transition-colors relative z-10 uppercase tracking-widest">{item.label}</span>
            <ArrowRight className="h-5 w-5 text-slate-400 dark:text-white/30 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all relative z-10" />
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="rounded-3xl md:rounded-[3rem] overflow-hidden bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm">
        {/* Header */}
        <div className="px-8 md:px-12 py-6 md:py-8 flex items-center justify-between relative overflow-hidden border-b-2 border-slate-100 dark:border-violet-500/15 bg-slate-50/50 dark:bg-transparent">
          <div className="absolute inset-0 opacity-0 dark:opacity-100" style={{ background: "linear-gradient(90deg, rgba(124,58,237,0.08), transparent)" }} />
          <div className="flex items-center gap-4 md:gap-6 relative z-10">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow-lg dark:shadow-[0_0_20px_rgba(124,58,237,0.4)]"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
              <Activity className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <h2 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Recent Platform Activity</h2>
          </div>
          <Link to="/super-admin/logs"
            className="text-sm md:text-lg font-black flex items-center gap-2 hover:gap-3 transition-all text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 relative z-10 uppercase tracking-widest">
            View all <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
 
        {/* Log rows */}
        <div className="divide-y-2 divide-slate-100 dark:divide-violet-500/10">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex gap-2">
                {[0,1,2].map(i => (
                  <div key={i} className="w-3 h-3 rounded-full bg-violet-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-20">
              <Zap className="h-12 w-12 text-violet-800 mx-auto mb-4 opacity-50" />
              <p className="text-violet-600 text-lg font-black uppercase tracking-widest">No activity yet</p>
            </div>
          ) : logs.map((log) => {
            const sv = severityStyle[log.severity] || severityStyle.info
            return (
                <div key={log.id}
                className="px-8 md:px-12 py-5 md:py-8 flex items-center justify-between gap-6 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                <div className="flex items-center gap-4 md:gap-6 min-w-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 border-2"
                    style={{ background: sv.bg, borderColor: sv.border }}>
                    <Activity className="h-5 w-5 md:h-6 md:w-6" style={{ color: sv.text }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base md:text-xl text-slate-800 dark:text-white font-black truncate uppercase tracking-wide">{log.action}</p>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-violet-500 truncate font-bold uppercase tracking-wider mt-1">{log.entity || "system"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 md:gap-6 shrink-0">
                  <span className="text-[10px] md:text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest border-2"
                    style={{ background: sv.bg, color: sv.text, borderColor: sv.border }}>
                    {log.severity || "info"}
                  </span>
                  <span className="text-[10px] md:text-xs text-slate-400 dark:text-violet-600 font-black uppercase tracking-widest">
                    {new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </SuperAdminLayout>
  )
}
