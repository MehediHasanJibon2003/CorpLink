import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import SuperAdminLayout from "../../components/superadmin/layout/SuperAdminLayout"
import { Users, Building2, CreditCard, ShieldAlert, ArrowUpRight, Activity, Zap } from "lucide-react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

const MOCK_GROWTH_DATA = [
  { month: "Jan", companies: 12, users: 400 },
  { month: "Feb", companies: 18, users: 650 },
  { month: "Mar", companies: 15, users: 800 },
  { month: "Apr", companies: 25, users: 1200 },
  { month: "May", companies: 32, users: 1800 },
  { month: "Jun", companies: 28, users: 2100 },
  { month: "Jul", companies: 45, users: 2800 },
]

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    activeSubscriptions: 0,
    pendingApprovals: 0,
    activeThreats: 0
  })
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const [users, companies, pending, threats] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("companies").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("threat_alerts").select("id", { count: "exact", head: true }).eq("resolved", false)
      ])

      setStats({
        totalUsers: users.count || 0,
        totalCompanies: companies.count || 0,
        activeSubscriptions: 0, 
        pendingApprovals: pending.count || 0,
        activeThreats: threats.count || 0
      })
    } catch (err) {
      console.error("Error fetching stats:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { label: "Total Corporates", value: stats.totalCompanies, icon: Building2, color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20" },
    { label: "Security Threats", value: stats.activeThreats, icon: ShieldAlert, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", path: "/super-admin/threats" },
    { label: "Active Subs", value: stats.activeSubscriptions, icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { label: "Pending Approvals", value: stats.pendingApprovals, icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  ]

  return (
    <SuperAdminLayout title="Platform Overview" subtitle="System status and key performance metrics">
      
      {/* Red Alert Banner */}
      {stats.activeThreats > 0 && (
        <div className="mb-10 p-8 rounded-[2.5rem] bg-gradient-to-r from-red-600 to-red-700 text-white flex flex-col md:flex-row items-center justify-between animate-pulse shadow-[0_20px_50px_rgba(220,38,38,0.3)] border-2 border-red-500/50">
          <div className="flex items-center gap-6 mb-4 md:mb-0">
            <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <ShieldAlert className="h-9 w-9 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Security Alert: {stats.activeThreats} Threats Detected</h3>
              <p className="text-red-100 font-bold text-lg opacity-90">Multiple security violations flagged. Review the threat logs immediately.</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.href = '/super-admin/threats'}
            className="px-10 py-4 bg-white text-red-600 rounded-2xl font-black uppercase tracking-[0.1em] text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
          >
            Manage Threats
          </button>
        </div>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8 mb-12">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div 
              key={card.label} 
              onClick={() => card.path && (window.location.href = card.path)}
              className={`p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border-2 ${card.border} shadow-sm transition-all hover:scale-[1.02] cursor-pointer group`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-4 rounded-2xl ${card.bg} group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-8 w-8 ${card.color}`} />
                </div>
                <div className="flex items-center gap-1 text-emerald-500 font-black text-xs uppercase bg-emerald-500/10 px-3 py-1 rounded-full">
                  <ArrowUpRight className="h-4 w-4" /> 12%
                </div>
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{card.label}</p>
              <h3 className="text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                {loading ? "..." : card.value}
              </h3>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Growth Chart Section */}
        <div className="lg:col-span-2 p-8 md:p-12 rounded-[3rem] bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
                <Activity className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Growth Telemetry</h3>
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">Global performance metrics</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/5 px-6 py-3 rounded-2xl border border-slate-100 dark:border-white/5">
              <div className="w-3 h-3 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.6)]" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Companies Joined</span>
            </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_GROWTH_DATA}>
                <defs>
                  <linearGradient id="colorCompanies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#8b5cf620" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}
                  dy={10}
                />
                <YAxis 
                  hide 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0d0622', 
                    border: '2px solid rgba(139,92,246,0.2)', 
                    borderRadius: '24px',
                    padding: '20px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                  }}
                  itemStyle={{ 
                    color: '#fff', 
                    fontSize: '14px', 
                    fontWeight: '900', 
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                  }}
                  cursor={{ stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: '5 5' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="companies" 
                  stroke="#8b5cf6" 
                  strokeWidth={5}
                  fillOpacity={1} 
                  fill="url(#colorCompanies)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Pulse Section */}
        <div className="p-8 md:p-12 rounded-[3.5rem] bg-slate-900 dark:bg-[#0d0622] text-white relative overflow-hidden shadow-2xl border-2 border-violet-500/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          
          <h3 className="text-2xl font-black uppercase tracking-tight mb-12 flex items-center gap-5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 flex items-center justify-center">
              <Zap className="h-6 w-6 text-amber-400 animate-pulse" />
            </div>
            System Pulse
          </h3>
          
          <div className="space-y-8 relative z-10">
            {[
              { label: "Database Status", value: "Healthy", color: "text-emerald-400" },
              { label: "API Latency", value: "24ms", color: "text-emerald-400" },
              { label: "Storage Usage", value: "12.4 GB", color: "text-violet-400" },
              { label: "Server Load", value: "18%", color: "text-blue-400" },
              { label: "Uptime", value: "99.99%", color: "text-emerald-400" }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-5 border-b border-white/5 last:border-0 group hover:translate-x-2 transition-transform duration-300">
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                <span className={`${item.color} font-black text-sm uppercase tracking-[0.2em] bg-white/5 px-4 py-1.5 rounded-full`}>{item.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm relative z-10">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Network Integrity</p>
             <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="w-[85%] h-full bg-gradient-to-r from-emerald-500 to-blue-500" />
             </div>
          </div>
        </div>
      </div>

      {/* ── Section 1: Recent System Activity ── */}
      <div className="p-8 md:p-12 rounded-[3.5rem] bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10 mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Activity className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Recent System Activity</h3>
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">Real-time platform audit log</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.href = '/super-admin/logs'}
            className="text-xs font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-2 group"
          >
            View Full Audit Log <ArrowUpRight className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>

        <div className="space-y-6">
          {[
            { action: "New Corporate Registered", details: "TechFlow Solutions applied for Enterprise Plan", time: "2 mins ago", icon: Building2, color: "text-blue-500", bg: "bg-blue-500/10" },
            { action: "Security Threat Detected", details: "Multiple failed login attempts on admin@xyz.com", time: "15 mins ago", icon: ShieldAlert, color: "text-red-500", bg: "bg-red-500/10" },
            { action: "Subscription Renewed", details: "Global Media Ltd. renewed Standard Plan", time: "1 hour ago", icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { action: "New Super Admin Added", details: "New admin account created for mehedi777@gmail.com", time: "3 hours ago", icon: Users, color: "text-violet-500", bg: "bg-violet-500/10" },
            { action: "Platform Update", details: "System maintenance and patch v4.2.2 applied", time: "5 hours ago", icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
          ].map((log, i) => (
            <div key={i} className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 hover:scale-[1.01] transition-all">
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl ${log.bg} ${log.color} flex items-center justify-center shrink-0 shadow-sm`}>
                  <log.icon className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{log.action}</h4>
                  <p className="text-slate-500 dark:text-slate-400 font-bold mt-0.5">{log.details}</p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-xs font-black text-slate-400 dark:text-violet-400 uppercase tracking-widest bg-white dark:bg-white/5 px-4 py-1.5 rounded-full border border-slate-100 dark:border-white/10">
                  {log.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SuperAdminLayout>
  )
}
