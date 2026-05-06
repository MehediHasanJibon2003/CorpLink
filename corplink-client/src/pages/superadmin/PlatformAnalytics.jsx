import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import SuperAdminLayout from "../../components/superadmin/layout/SuperAdminLayout"
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from "recharts"
import { BarChart3, TrendingUp, Users, Server, Activity, PieChart as PieChartIcon, DollarSign, LayoutDashboard, Wallet, Clock } from "lucide-react"
import { useTheme } from "../../context/ThemeContext"

const VIOLET_COLORS = ["#8b5cf6", "#c084fc", "#e879f9", "#f472b6", "#fb7185"]
const PLAN_COLORS = { "basic": "#94a3b8", "standard": "#60a5fa", "enterprise": "#a855f7" }
const STATUS_COLORS = { "active": "#34d399", "pending": "#fbbf24", "inactive": "#94a3b8", "rejected": "#f87171" }

export default function PlatformAnalytics() {
  const { theme } = useTheme()
  const [planDist, setPlanDist]     = useState([])
  const [statusDist, setStatusDist] = useState([])
  const [growthData, setGrowthData] = useState([])
  const [revenueData, setRevenueData] = useState([])
  const [moduleUsage, setModuleUsage] = useState([])
  const [totals, setTotals]         = useState({ companies: 0, users: 0, tasks: 0, revenue: 0, pendingRev: 0 })
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    const load = async () => {
      const [
        { data: comps }, 
        { data: profiles }, 
        { data: tasks },
        { data: revLogs },
        { data: usageLogs }
      ] = await Promise.all([
        supabase.from("companies").select("status, plan, created_at"),
        supabase.from("profiles").select("id").neq("role", "super_admin"),
        supabase.from("tasks").select("id"),
        supabase.from("revenue_logs").select("*").order("payment_date", { ascending: true }),
        supabase.from("module_usage_logs").select("module_name, corporate_id")
      ])

      const cs = comps || []
      const rs = revLogs || []
      const us = usageLogs || []
      
      const plans = {}
      cs.forEach(c => { plans[c.plan || "basic"] = (plans[c.plan || "basic"] || 0) + 1 })
      setPlanDist(Object.entries(plans).map(([name, value]) => ({ name, value, fill: PLAN_COLORS[name] || "#a855f7" })))

      const statuses = { active: 0, pending: 0, inactive: 0, rejected: 0 }
      cs.forEach(c => { statuses[c.status] = (statuses[c.status] || 0) + 1 })
      setStatusDist(Object.entries(statuses).map(([name, count]) => ({ name, count, fill: STATUS_COLORS[name] || "#a855f7" })))

      const now = new Date()
      const monthMap = {}
      const revMap = {}
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
        monthMap[key] = 0
        revMap[key] = 0
      }

      cs.forEach(c => {
        const key = new Date(c.created_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
        if (key in monthMap) monthMap[key]++
      })

      let totalRev = 0
      let pendingRev = 0
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

      const usageMap = {}
      us.forEach(u => { usageMap[u.module_name] = (usageMap[u.module_name] || 0) + 1 })
      setModuleUsage(Object.entries(usageMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count))

      setTotals({ 
        companies: cs.length, 
        users: profiles?.length || 0, 
        tasks: tasks?.length || 0,
        revenue: totalRev,
        pendingRev: pendingRev
      })
      setLoading(false)
    }
    load()
  }, [])

  const gridColor    = theme === "dark" ? "rgba(139,92,246,0.08)" : "rgba(139,92,246,0.15)"
  const tickColor    = theme === "dark" ? "#a78bfa" : "#64748b"
  const tooltipStyle = {
    contentStyle: {
      background: theme === "dark" ? "rgba(13,6,34,0.9)" : "rgba(255,255,255,0.9)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(139,92,246,0.3)",
      borderRadius: "16px",
      color: theme === "dark" ? "#e9d5ff" : "#1e293b",
      boxShadow: theme === "dark" ? "0 10px 40px rgba(0,0,0,0.3)" : "0 10px 40px rgba(0,0,0,0.1)",
    },
    labelStyle: { color: theme === "dark" ? "#c4b5fd" : "#8b5cf6", fontWeight: 900, textTransform: "uppercase", fontSize: "11px", letterSpacing: "1px", marginBottom: "4px" },
    itemStyle: { fontSize: "13px", fontWeight: 700 }
  }

  const cardCls = "rounded-3xl md:rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm dark:shadow-[0_15px_50px_rgba(0,0,0,0.2)]"

  const metrics = [
    { label: "Gross Revenue", value: `$${totals.revenue.toLocaleString()}`, icon: DollarSign, color: "#10b981", grad: "linear-gradient(135deg, #10b981, #059669)" },
    { label: "Pending Payments", value: `$${totals.pendingRev.toLocaleString()}`, icon: Clock, color: "#f59e0b", grad: "linear-gradient(135deg, #f59e0b, #d97706)" },
    { label: "Total Corporates", value: totals.companies, icon: Server, color: "#8b5cf6", grad: "linear-gradient(135deg, #8b5cf6, #6366f1)" },
    { label: "Platform Users",   value: totals.users,     icon: Users,  color: "#ec4899", grad: "linear-gradient(135deg, #ec4899, #f43f5e)" },
  ]

  return (
    <SuperAdminLayout title="Platform Analytics" subtitle="Revenue, telemetry, and growth insights across the entire infrastructure">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {metrics.map(m => (
          <div key={m.label} className={cardCls + " !p-8 md:!p-10"}>
            <div className="absolute top-0 right-0 w-32 h-32 opacity-20 blur-[60px]" style={{ background: m.color }} />
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-violet-400 mb-3">{m.label}</p>
                <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">{loading ? "..." : m.value}</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ background: m.grad }}>
                <m.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <div className={cardCls}>
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/20">
              <Wallet className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Revenue Timeline (6mo)</h3>
          </div>
          <div className="h-80 md:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 11, fontWeight: 900 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: tickColor, fontSize: 11, fontWeight: 900 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="amount" name="Revenue ($)" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={cardCls}>
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 rounded-xl bg-violet-500/10 border-2 border-violet-500/20">
              <TrendingUp className="h-6 w-6 text-violet-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Platform Growth</h3>
          </div>
          <div className="h-80 md:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 11, fontWeight: 900 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: tickColor, fontSize: 11, fontWeight: 900 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="count" name="New Corporates" stroke="#a855f7" strokeWidth={5} dot={{ r: 6, fill: "#a855f7" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <div className={cardCls}>
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 rounded-xl bg-blue-500/10 border-2 border-blue-500/20">
              <LayoutDashboard className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Module Popularity</h3>
          </div>
          {moduleUsage.length === 0 ? (
            <div className="h-80 flex flex-col items-center justify-center text-slate-400">
               <Activity className="h-12 w-12 mb-4 opacity-20" />
               <p className="font-bold">No usage data tracked yet</p>
            </div>
          ) : (
            <div className="h-80 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moduleUsage} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{ fill: tickColor, fontSize: 11, fontWeight: 900 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="count" name="Usage Count" radius={[0, 10, 10, 0]}>
                    {moduleUsage.map((entry, index) => (
                      <Cell key={index} fill={VIOLET_COLORS[index % VIOLET_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className={cardCls}>
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 rounded-xl bg-pink-500/10 border-2 border-pink-500/20">
              <PieChartIcon className="h-6 w-6 text-pink-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Subscription Tiers</h3>
          </div>
          <div className="h-80 md:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={planDist} 
                  innerRadius={80} outerRadius={120} 
                  paddingAngle={5} 
                  dataKey="value"
                  label={({ name, percent }) => `${name.toUpperCase()} ${(percent * 100).toFixed(0)}%`}
                >
                  {planDist.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={cardCls}>
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 rounded-xl bg-orange-500/10 border-2 border-orange-500/20">
            <Activity className="h-6 w-6 text-orange-500" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Corporate Status Breakdown</h3>
        </div>
        <div className="h-80 md:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusDist}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 11, fontWeight: 900 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: tickColor, fontSize: 11, fontWeight: 900 }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" name="Total Count" radius={[10, 10, 0, 0]}>
                {statusDist.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SuperAdminLayout>
  )
}
