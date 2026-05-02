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
        <div className="mb-6 flex items-center gap-3 px-5 py-3.5 rounded-2xl relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.08))", border: "1px solid rgba(245,158,11,0.25)" }}>
          <div className="absolute inset-0 opacity-5"
            style={{ background: "linear-gradient(90deg, #f59e0b, #ef4444)" }} />
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 relative z-10" style={{ filter: "drop-shadow(0 0 6px rgba(245,158,11,0.6))" }} />
          <p className="text-sm font-medium relative z-10" style={{ color: "#fcd34d" }}>
            <span className="font-black">{stats.pending} corporate{stats.pending > 1 ? "s" : ""}</span> awaiting your approval
          </p>
          <Link to="/super-admin/corporates"
            className="ml-auto flex items-center gap-1 text-xs font-bold relative z-10 hover:gap-2 transition-all"
            style={{ color: "#fbbf24" }}>
            Review Now <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Gradient Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map(card => (
          <div key={card.key} className="relative rounded-2xl p-5 overflow-hidden group cursor-default"
            style={{ background: card.bg, border: `1px solid ${card.border}` }}>
            {/* Corner glow */}
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-30 transition-opacity group-hover:opacity-50"
              style={{ background: `radial-gradient(circle, ${card.glow}, transparent 70%)` }} />

            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">{card.title}</p>
                <p className="text-3xl font-black text-white"
                  style={{ textShadow: `0 0 30px ${card.glow}` }}>
                  {loading ? "—" : stats[card.key]}
                </p>
                {card.key === "total" && !loading && (
                  <p className="text-xs mt-1" style={{ color: card.glow.replace("0.4", "0.9") }}>
                    {stats.pending} pending
                  </p>
                )}
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: card.iconBg, boxShadow: `0 4px 16px ${card.glow}` }}>
                <card.icon className="h-5 w-5 text-white" />
              </div>
            </div>

            {/* Bottom gradient bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-60"
              style={{ background: card.gradient }} />
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {QUICK_LINKS.map(item => (
          <Link key={item.path} to={item.path}
            className="group relative flex items-center justify-between px-4 py-3.5 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(139,92,246,0.15)" }}>
            {/* Hover glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: `linear-gradient(135deg, ${item.hover}, transparent)` }} />
            <span className="text-sm font-semibold text-white/70 group-hover:text-white transition-colors relative z-10">{item.label}</span>
            <ArrowRight className="h-3.5 w-3.5 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all relative z-10" />
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(139,92,246,0.12)" }}>
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between relative overflow-hidden"
          style={{ borderBottom: "1px solid rgba(139,92,246,0.12)", background: "linear-gradient(90deg, rgba(124,58,237,0.08), transparent)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 12px rgba(124,58,237,0.4)" }}>
              <Activity className="h-3.5 w-3.5 text-white" />
            </div>
            <h2 className="text-sm font-bold text-white">Recent Platform Activity</h2>
          </div>
          <Link to="/super-admin/logs"
            className="text-xs font-bold flex items-center gap-1 hover:gap-1.5 transition-all"
            style={{ color: "#a78bfa" }}>
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Log rows */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-violet-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="h-8 w-8 text-violet-800 mx-auto mb-2" />
              <p className="text-violet-600 text-sm">No activity yet</p>
            </div>
          ) : logs.map((log, i) => {
            const sv = severityStyle[log.severity] || severityStyle.info
            return (
              <div key={log.id}
                className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors group"
                style={{ borderBottom: i < logs.length - 1 ? "1px solid rgba(139,92,246,0.06)" : "none" }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: sv.bg, border: `1px solid ${sv.border}` }}>
                    <Activity className="h-3.5 w-3.5" style={{ color: sv.text }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{log.action}</p>
                    <p className="text-xs text-violet-500 truncate">{log.entity || "system"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                    style={{ background: sv.bg, color: sv.text, border: `1px solid ${sv.border}` }}>
                    {log.severity || "info"}
                  </span>
                  <span className="text-[10px] text-violet-600">
                    {new Date(log.created_at).toLocaleDateString()}
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
