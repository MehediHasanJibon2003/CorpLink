import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import SuperAdminLayout from "../../components/superadmin/layout/SuperAdminLayout"
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from "recharts"
import { TrendingUp, Users, Server, Activity, PieChart as PieChartIcon, DollarSign, LayoutDashboard, Wallet, Clock } from "lucide-react"
import { useTheme } from "../../context/ThemeContext"

const VIOLET_COLORS = ["#8b5cf6", "#c084fc", "#e879f9", "#f472b6", "#fb7185"]
const PLAN_COLORS = { "basic": "#94a3b8", "standard": "#60a5fa", "enterprise": "#a855f7" }
const STATUS_COLORS = { "active": "#34d399", "pending": "#fbbf24", "inactive": "#94a3b8", "rejected": "#f87171" }

export default function PlatformAnalytics() {
  const { theme } = useTheme()
  const [planDist, setPlanDist] = useState([])
  const [statusDist, setStatusDist] = useState([])
  const [growthData, setGrowthData] = useState([])
  const [revenueData, setRevenueData] = useState([])
  const [moduleUsage, setModuleUsage] = useState([])
  const [totals, setTotals] = useState({ companies: 0, users: 0, revenue: 0, pendingRev: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [{ data: comps }, { data: profiles }, { data: revLogs }, { data: usageLogs }] = await Promise.all([
        supabase.from("companies").select("status, plan, created_at"),
        supabase.from("profiles").select("id").neq("role", "super_admin"),
        supabase.from("revenue_logs").select("*").order("payment_date", { ascending: true }),
        supabase.from("module_usage_logs").select("module_name, corporate_id")
      ])

      const cs = comps || []; const rs = revLogs || []; const us = usageLogs || []
      const plans = {}; cs.forEach(c => { plans[c.plan || "basic"] = (plans[c.plan || "basic"] || 0) + 1 })
      setPlanDist(Object.entries(plans).map(([name, value]) => ({ name, value, fill: PLAN_COLORS[name] || "#a855f7" })))

      const statuses = { active: 0, pending: 0, inactive: 0, rejected: 0 }
      cs.forEach(c => { statuses[c.status] = (statuses[c.status] || 0) + 1 })
      setStatusDist(Object.entries(statuses).map(([name, count]) => ({ name, count, fill: STATUS_COLORS[name] || "#a855f7" })))

      const now = new Date(); const monthMap = {}; const revMap = {}
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
        monthMap[key] = 0; revMap[key] = 0
      }

      cs.forEach(c => {
        const key = new Date(c.created_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
        if (key in monthMap) monthMap[key]++
      })

      let totalRev = 0; let pendingRev = 0
      rs.forEach(r => {
        if (r.status === 'paid') {
          totalRev += Number(r.amount)
          const key = new Date(r.payment_date).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
          if (key in revMap) revMap[key] += Number(r.amount)
        } else if (r.status === 'pending') {
          pendingRev += Number(r.amount)
        }
      })

      setGrowthData(Object.entries(monthMap).map(([month, count]) => ({ month, count })))
      setRevenueData(Object.entries(revMap).map(([month, amount]) => ({ month, amount })))
      const usageMap = {}; us.forEach(u => { usageMap[u.module_name] = (usageMap[u.module_name] || 0) + 1 })
      setModuleUsage(Object.entries(usageMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count))
      setTotals({ companies: cs.length, users: profiles?.length || 0, revenue: totalRev, pendingRev: pendingRev })
      setLoading(false)
    }
    load()
  }, [])

  const gridColor = theme === "dark" ? "rgba(139,92,246,0.08)" : "rgba(139,92,246,0.15)"
  const tickColor = theme === "dark" ? "#a78bfa" : "#64748b"
  const tooltipStyle = {
    contentStyle: {
      background: theme === "dark" ? "#0d0622" : "#ffffff",
      borderRadius: "16px", border: "1px solid rgba(139,92,246,0.2)",
      boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
    }
  }

  const metrics = [
    { label: "Revenue", value: `$${totals.revenue.toLocaleString()}`, icon: DollarSign, color: "#10b981", grad: "from-emerald-500 to-emerald-600" },
    { label: "Pending", value: `$${totals.pendingRev.toLocaleString()}`, icon: Clock, color: "#f59e0b", grad: "from-amber-500 to-amber-600" },
    { label: "Companies", value: totals.companies, icon: Server, color: "#8b5cf6", grad: "from-violet-500 to-violet-600" },
    { label: "Users", value: totals.users, icon: Users, color: "#ec4899", grad: "from-pink-500 to-pink-600" },
  ]

  return (
    <SuperAdminLayout title="Analytics" subtitle="System insights and revenue telemetry">
      {/* Metrics Grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-8 md:mb-12">
        {metrics.map(m => (
          <div key={m.label} className="p-6 md:p-8 rounded-3xl md:rounded-[2rem] bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 relative overflow-hidden group">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${m.grad} mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
              <m.icon className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <p className="text-badge md:text-label font-black uppercase tracking-widest text-slate-500 dark:text-violet-400 mb-1">{m.label}</p>
            <p className="text-heading-2 md:text-heading-1 font-black text-slate-900 dark:text-white">{loading ? "..." : m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8">
        {/* Revenue Timeline */}
        <div className="p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm">
          <h3 className="text-heading-3 md:text-heading-2 font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-3"><Wallet className="h-5 w-5 text-emerald-500" /> Revenue Timeline</h3>
          <div className="h-[250px] md:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="amount" stroke="#10b981" fill="#10b98120" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Growth */}
        <div className="p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm">
          <h3 className="text-heading-3 md:text-heading-2 font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-3"><TrendingUp className="h-5 w-5 text-violet-500" /> Platform Growth</h3>
          <div className="h-[250px] md:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={5} dot={{ r: 6, fill: "#a855f7" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Module Usage */}
        <div className="p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm">
          <h3 className="text-heading-3 md:text-heading-2 font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-3"><LayoutDashboard className="h-5 w-5 text-blue-500" /> Module Popularity</h3>
          <div className="h-[250px] md:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moduleUsage} layout="vertical" margin={{ left: -10, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fill: tickColor, fontSize: 8, fontWeight: 900 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" radius={[0, 10, 10, 0]}>
                  {moduleUsage.map((entry, index) => <Cell key={index} fill={VIOLET_COLORS[index % VIOLET_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Distribution */}
        <div className="p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm">
          <h3 className="text-heading-3 md:text-heading-2 font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-3"><PieChartIcon className="h-5 w-5 text-pink-500" /> Subscriptions</h3>
          <div className="h-[250px] md:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={planDist} 
                  innerRadius={window.innerWidth < 768 ? 50 : 70} 
                  outerRadius={window.innerWidth < 768 ? 70 : 100} 
                  paddingAngle={5} 
                  dataKey="value"
                >
                  {planDist.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 900, paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  )
}

