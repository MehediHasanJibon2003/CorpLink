import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import SuperAdminLayout from "../../components/superadmin/layout/SuperAdminLayout"
import { Users, Building2, CreditCard, ShieldAlert, ArrowUpRight, Activity, Zap } from "lucide-react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts"

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
  const [topCompanies, setTopCompanies] = useState([])
  const [pendingList, setPendingList] = useState([])
  const [subscriptionStats, setSubscriptionStats] = useState([
    { name: "Basic", value: 1, color: "#94a3b8" },
    { name: "Standard", value: 0, color: "#3b82f6" },
    { name: "Enterprise", value: 0, color: "#8b5cf6" },
  ])
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

      const { data: companiesData } = await supabase.from("companies").select("id, name, status, plan").limit(200)
      const activeComps = (companiesData || []).filter(c => c.status === "active")

      const subs = { Basic: 0, Standard: 0, Enterprise: 0 }
      activeComps.forEach(c => { if (subs[c.plan] !== undefined) subs[c.plan]++ })
      
      setSubscriptionStats([
        { name: "Basic", value: subs.Basic || 1, color: "#94a3b8" },
        { name: "Standard", value: subs.Standard || 0, color: "#3b82f6" },
        { name: "Enterprise", value: subs.Enterprise || 0, color: "#8b5cf6" },
      ])

      const companiesWithCounts = await Promise.all(activeComps.slice(0, 15).map(async (corp) => {
        const { count } = await supabase.from("employees").select("id", { count: "exact", head: true }).eq("company_id", corp.id)
        return { ...corp, employees: count || 0 }
      }))

      const { data: pendingData } = await supabase.from("companies").select("id, name, plan").eq("status", "pending").limit(5)

      setPendingList(pendingData || [])
      setTopCompanies(companiesWithCounts.sort((a, b) => b.employees - a.employees).slice(0, 4))
      
      const prices = { Basic: 49, Standard: 99, Enterprise: 299 }
      const totalMRR = activeComps.reduce((acc, curr) => acc + (prices[curr.plan] || 0), 0)

      setStats({
        totalUsers: users.count || 0,
        totalCompanies: companies.count || 0,
        activeSubscriptions: activeComps.length, 
        pendingApprovals: pending.count || 0,
        activeThreats: threats.count || 0,
        totalMRR: totalMRR
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [])

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { label: "Total Companies", value: stats.totalCompanies, icon: Building2, color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20" },
    { label: "Security Threats", value: stats.activeThreats, icon: ShieldAlert, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", path: "/super-admin/threats" },
    { label: "Active Subs", value: stats.activeSubscriptions, icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { label: "Pending Approvals", value: stats.pendingApprovals, icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  ]

  return (
    <SuperAdminLayout title="Platform Overview" subtitle="System status and key performance metrics">
      
      {/* Red Alert Banner - Responsive */}
      {stats.activeThreats > 0 && (
        <div className="mb-6 md:mb-10 p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] bg-gradient-to-r from-red-600 to-red-700 text-white flex flex-col md:flex-row items-center justify-between animate-pulse shadow-xl border-2 border-red-500/50 gap-6">
          <div className="flex items-center gap-4 md:gap-6 text-center md:text-left flex-col md:flex-row w-full md:w-auto">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shrink-0">
              <ShieldAlert className="h-6 w-6 md:h-9 md:w-9 text-white" />
            </div>
            <div>
              <h3 className="text-heading-3 md:text-heading-1 font-black uppercase tracking-tight">Security Alert: {stats.activeThreats} Threats</h3>
              <p className="text-red-100 font-bold text-label md:text-heading-3 opacity-90">Review the threat logs immediately.</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.href = '/super-admin/threats'}
            className="w-full md:w-auto px-6 md:px-8 py-3 md:py-4 bg-white text-red-600 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-badge md:text-body hover:scale-105 active:scale-95 transition-all shadow-xl"
          >
            Manage Threats
          </button>
        </div>
      )}

      {/* Stat Cards Grid - Responsive columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 lg:gap-8 mb-8 md:mb-12">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className={`p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] bg-white dark:bg-white/5 border-2 ${card.border} shadow-sm transition-all hover:scale-[1.02] cursor-pointer`}>
              <div className="flex items-center justify-between mb-4 md:mb-5">
                <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${card.bg}`}>
                  <Icon className={`h-5 w-5 md:h-8 md:w-8 ${card.color}`} />
                </div>
                <div className="flex items-center gap-1 text-emerald-500 font-black text-badge md:text-label uppercase bg-emerald-500/10 px-2 py-0.5 md:px-3 md:py-1 rounded-full">
                  <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4" /> 12%
                </div>
              </div>
              <p className="text-badge md:text-label font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
              <h3 className="text-heading-2 md:text-heading-1 font-black text-slate-900 dark:text-white leading-tight">
                {loading ? "..." : card.value}
              </h3>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12">
        {/* Growth Chart Section - Responsive Height */}
        <div className="lg:col-span-2 p-6 md:p-12 rounded-3xl md:rounded-[3rem] bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10 shadow-sm">
          <div className="flex items-center gap-4 md:gap-5 mb-8 md:mb-10">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
              <Activity className="h-5 w-5 md:h-7 md:w-7" />
            </div>
            <h3 className="text-heading-3 md:text-heading-1 font-black text-slate-900 dark:text-white uppercase tracking-tight">Growth Telemetry</h3>
          </div>
          <div className="h-[200px] sm:h-[250px] md:h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={MOCK_GROWTH_DATA}>
                <defs>
                  <linearGradient id="colorCompanies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#8b5cf620" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                <YAxis hide />
                <Tooltip contentStyle={{ backgroundColor: '#0d0622', border: 'none', borderRadius: '16px' }} />
                <Area type="monotone" dataKey="companies" stroke="#8b5cf6" strokeWidth={3} fill="url(#colorCompanies)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Pulse Section */}
        <div className="p-6 md:p-12 rounded-3xl md:rounded-[3rem] bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10 shadow-sm">
          <h3 className="text-heading-3 md:text-heading-1 font-black uppercase tracking-tight mb-8 md:mb-12 flex items-center gap-4 md:gap-5 text-slate-900 dark:text-white">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 md:h-6 md:w-6 text-amber-500 animate-pulse" />
            </div>
            Pulse
          </h3>
          <div className="space-y-4 md:space-y-6">
            {[
              { label: "DB Status", value: "Healthy", color: "text-emerald-500" },
              { label: "API Latency", value: "24ms", color: "text-emerald-500" },
              { label: "Server Load", value: "18%", color: "text-blue-500" },
              { label: "Uptime", value: "99.9%", color: "text-emerald-500" }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 md:py-4 border-b border-slate-50 dark:border-white/5 last:border-0">
                <span className="text-badge md:text-label font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                <span className={`${item.color} font-black text-badge md:text-label uppercase tracking-widest bg-slate-50 dark:bg-white/5 px-3 md:px-4 py-1 rounded-full`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 1: Activity & Companies - Side-by-side on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12 mb-8 md:mb-12">
        <div className="p-6 md:p-10 rounded-3xl md:rounded-[3rem] bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10 h-[380px] md:h-[512px] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h3 className="text-heading-3 md:text-heading-2 font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
              <Activity className="h-5 w-5 md:h-6 md:w-6 text-blue-500" /> Recent
            </h3>
            <div className="relative group/btn">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg blur opacity-20 group-hover/btn:opacity-100 transition duration-1000 animate-pulse"></div>
              <button onClick={() => window.location.href = '/super-admin/logs'} className="relative px-3 md:px-4 py-1.5 md:py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-badge font-black uppercase tracking-widest text-blue-500">View</button>
            </div>
          </div>
          <div className="space-y-3 md:space-y-4 overflow-y-auto pr-1 custom-scrollbar">
            {[
              { action: "Registration", time: "2m", icon: Building2, color: "text-blue-500", bg: "bg-blue-500/10" },
              { action: "Threat", time: "15m", icon: ShieldAlert, color: "text-red-500", bg: "bg-red-500/10" },
              { action: "Subscription", time: "1h", icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { action: "System Update", time: "5h", icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
            ].map((log, i) => (
              <div key={i} className="flex items-center justify-between p-4 md:p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl ${log.bg} ${log.color} flex items-center justify-center shrink-0`}><log.icon className="h-4 w-4 md:h-5 md:w-5" /></div>
                  <span className="text-badge md:text-label font-black uppercase text-slate-900 dark:text-white line-clamp-1">{log.action}</span>
                </div>
                <span className="text-[9px] md:text-[10px] font-black text-slate-400 shrink-0">{log.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 md:p-10 rounded-3xl md:rounded-[3rem] bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10 h-[380px] md:h-[512px] flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <Building2 className="h-5 w-5 md:h-6 w-6 text-orange-500" />
            <h3 className="text-heading-3 md:text-heading-2 font-black text-slate-900 dark:text-white uppercase tracking-tight">Top Companies</h3>
          </div>
          <div className="space-y-4 md:space-y-6 flex-1 overflow-y-auto pr-1">
            {topCompanies.length === 0 ? (
              <div className="py-10 text-center opacity-40 font-black uppercase text-badge">No Data</div>
            ) : (
              topCompanies.map((corp, i) => {
                const maxEmps = Math.max(...topCompanies.map(c => c.employees)) || 1
                const colors = ["bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500"]
                return (
                  <div key={i}>
                    <div className="flex justify-between mb-2">
                      <span className="text-badge md:text-label font-black uppercase text-slate-900 dark:text-white truncate max-w-[150px]">{corp.name}</span>
                      <span className="text-[9px] md:text-[10px] font-black text-slate-400">{corp.employees} Emps</span>
                    </div>
                    <div className="w-full h-1.5 md:h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${colors[i % colors.length]}`} style={{ width: `${(corp.employees / maxEmps) * 100}%` }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
          <div className="relative group/btn mt-4 md:mt-6">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl blur opacity-20 group-hover/btn:opacity-100 transition duration-1000 animate-pulse"></div>
            <button onClick={() => window.location.href = '/super-admin/companies'} className="relative w-full py-3 md:py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-badge md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">View Directory</button>
          </div>
        </div>
      </div>

      {/* Row 2: Approvals & Subscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12 mb-8 md:mb-12">
        <div className="p-6 md:p-10 rounded-3xl md:rounded-[3rem] bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10 h-[380px] md:h-[512px] overflow-hidden flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h3 className="text-heading-3 md:text-heading-2 font-black uppercase tracking-tight flex items-center gap-3 text-slate-900 dark:text-white">
              <Zap className="h-5 w-5 md:h-6 md:w-6 text-amber-500" /> Pending
            </h3>
            <span className="text-badge md:text-[10px] font-black uppercase tracking-widest bg-amber-500 text-black px-2 md:px-3 py-1 rounded-full shrink-0">{stats.pendingApprovals} NEW</span>
          </div>
          <div className="space-y-3 md:space-y-4 overflow-y-auto pr-1 flex-1">
            {pendingList.length === 0 ? (
              <p className="text-badge font-black uppercase text-slate-500 text-center py-20 tracking-widest">Clear</p>
            ) : (
              pendingList.map((item, i) => (
                <div key={i} className="p-4 md:p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <div className="truncate pr-4">
                    <h4 className="text-badge md:text-label font-black uppercase text-slate-900 dark:text-white truncate">{item.name}</h4>
                    <p className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest">{item.plan}</p>
                  </div>
                  <button onClick={() => window.location.href = '/super-admin/companies'} className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0"><ArrowUpRight className="h-4 w-4" /></button>
                </div>
              ))
            )}
          </div>
          <div className="relative group/btn mt-4 md:mt-6">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-xl blur opacity-20 group-hover/btn:opacity-100 transition duration-1000 animate-pulse"></div>
            <button onClick={() => window.location.href = '/super-admin/companies'} className="relative w-full py-3 md:py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-badge md:text-[10px] font-black uppercase tracking-widest text-amber-500">Manage All</button>
          </div>
        </div>

        <div className="p-6 md:p-10 rounded-3xl md:rounded-[3rem] bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10 h-[380px] md:h-[512px] flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-violet-500" />
            <h3 className="text-heading-3 md:text-heading-2 font-black text-slate-900 dark:text-white uppercase tracking-tight">Subscriptions</h3>
          </div>
          <div className="h-[180px] sm:h-[220px] md:h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie data={subscriptionStats} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={8} dataKey="value">
                  {subscriptionStats.map((entry, index) => <Cell key={index} fill={entry.color} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0d0622', border: 'none', borderRadius: '12px' }} />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-4 mt-4">
             <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-white/5 text-center">
                <p className="text-body md:text-heading-3 font-black text-slate-900 dark:text-white">{stats.activeSubscriptions}</p>
                <p className="text-badge md:text-[10px] font-black uppercase text-slate-400">Active</p>
             </div>
             <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-emerald-500/5 text-center">
                <p className="text-body md:text-heading-3 font-black text-emerald-500">${(stats.totalMRR || 0).toLocaleString()}</p>
                <p className="text-badge md:text-[10px] font-black uppercase text-slate-400">MRR</p>
             </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  )
}

