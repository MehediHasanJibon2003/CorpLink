import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import SuperAdminLayout from "../../components/superadmin/layout/SuperAdminLayout"
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts"
import { BarChart3, TrendingUp, Users, Server, Activity, PieChart as PieChartIcon } from "lucide-react"
import { useTheme } from "../../context/ThemeContext"

// Premium color palette
const VIOLET_COLORS = ["#8b5cf6", "#c084fc", "#e879f9", "#f472b6", "#fb7185"]
const PLAN_COLORS = { "basic": "#94a3b8", "standard": "#60a5fa", "enterprise": "#a855f7" }
const STATUS_COLORS = { "active": "#34d399", "pending": "#fbbf24", "inactive": "#94a3b8", "rejected": "#f87171" }

export default function PlatformAnalytics() {
  const { theme } = useTheme()
  const [planDist, setPlanDist]     = useState([])
  const [statusDist, setStatusDist] = useState([])
  const [growthData, setGrowthData] = useState([])
  const [totals, setTotals]         = useState({ companies: 0, users: 0, tasks: 0 })
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    const load = async () => {
      const [{ data: comps }, { data: profiles }, { data: tasks }] = await Promise.all([
        supabase.from("companies").select("status, plan, created_at"),
        supabase.from("profiles").select("id").neq("role", "super_admin"),
        supabase.from("tasks").select("id"),
      ])
      const cs = comps || []
      
      const plans = {}
      cs.forEach(c => { plans[c.plan || "basic"] = (plans[c.plan || "basic"] || 0) + 1 })
      setPlanDist(Object.entries(plans).map(([name, value]) => ({ name, value, fill: PLAN_COLORS[name] || "#a855f7" })))

      const statuses = { active: 0, pending: 0, inactive: 0, rejected: 0 }
      cs.forEach(c => { statuses[c.status] = (statuses[c.status] || 0) + 1 })
      setStatusDist(Object.entries(statuses).map(([name, count]) => ({ name, count, fill: STATUS_COLORS[name] || "#a855f7" })))

      const now = new Date()
      const monthMap = {}
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
        monthMap[key] = 0
      }
      cs.forEach(c => {
        const key = new Date(c.created_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
        if (key in monthMap) monthMap[key]++
      })
      setGrowthData(Object.entries(monthMap).map(([month, count]) => ({ month, count })))
      setTotals({ companies: cs.length, users: profiles?.length || 0, tasks: tasks?.length || 0 })
      setLoading(false)
    }
    load()
  }, [])

  const isDark = theme === "dark" || true // Enforcing dark style for premium look
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

  const cardCls = "rounded-3xl p-6 relative overflow-hidden bg-white dark:bg-white/5 border border-slate-200 dark:border-violet-500/12 shadow-sm dark:shadow-[0_10px_40px_rgba(0,0,0,0.15)]"

  const metrics = [
    { label: "Total Corporates", value: totals.companies, icon: Server, color: "#8b5cf6", grad: "linear-gradient(135deg, #8b5cf6, #6366f1)" },
    { label: "Platform Users",   value: totals.users,     icon: Users,  color: "#ec4899", grad: "linear-gradient(135deg, #ec4899, #f43f5e)" },
    { label: "Total Tasks",      value: totals.tasks,     icon: Activity, color: "#10b981", grad: "linear-gradient(135deg, #10b981, #059669)" },
  ]

  return (
    <SuperAdminLayout title="Platform Analytics" subtitle="Deep insights and telemetry across the entire Corporate infrastructure">
      
      {/* Top Level Metrics (Glass Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {metrics.map(m => (
          <div key={m.label} className={cardCls}>
            <div className="absolute top-0 right-0 w-32 h-32 opacity-20 blur-3xl -translate-y-10 translate-x-10" style={{ background: `radial-gradient(circle, ${m.color}, transparent)` }} />
            
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-violet-400/80 mb-2">{m.label}</p>
                <p className="text-4xl font-black text-slate-900 dark:text-white dark:drop-shadow-[0_0_20px_var(--tw-shadow-color)]" style={{ '--tw-shadow-color': `${m.color}80` }}>
                  {loading ? "..." : m.value.toLocaleString()}
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transform rotate-3" style={{ background: m.grad }}>
                <m.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: m.grad }} />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Corporate Growth Chart */}
        <div className={cardCls}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20">
              <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Platform Growth (6mo)</h3>
          </div>
          
          {loading ? (
            <div className="h-56 flex items-center justify-center"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="relative h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fill: tickColor, fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} allowDecimals={false} dx={-10} />
                  <Tooltip {...tooltipStyle} cursor={{ stroke: 'rgba(139,92,246,0.2)', strokeWidth: 2, strokeDasharray: '4 4' }} />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    name="New Onboards" 
                    stroke="#a855f7" 
                    strokeWidth={4} 
                    dot={{ fill: "#0d0622", stroke: "#c084fc", strokeWidth: 3, r: 6 }} 
                    activeDot={{ r: 8, fill: "#c084fc", stroke: "#fff", strokeWidth: 2 }}
                    style={{ filter: "drop-shadow(0 8px 10px rgba(168,85,247,0.4))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Status Distribution Chart */}
        <div className={cardCls}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
              <BarChart3 className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Corporate Status Breakdown</h3>
          </div>
          
          {loading ? (
            <div className="h-56 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="relative h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusDist} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 10, fontWeight: 700, textTransform: "capitalize" }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fill: tickColor, fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} allowDecimals={false} dx={-10} />
                  <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="count" name="Total Count" radius={[6, 6, 0, 0]}>
                    {statusDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} style={{ filter: `drop-shadow(0 0 10px ${entry.fill}80)` }} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Plan Distribution (Wide Pie Chart) */}
      <div className={cardCls}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
            <PieChartIcon className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Active Subscription Tiers</h3>
        </div>
        
        {loading ? (
          <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : planDist.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-violet-300 gap-3">
            <PieChartIcon className="h-12 w-12 opacity-30" />
            <p className="text-sm font-bold tracking-wide">No subscription data available</p>
          </div>
        ) : (
          <div className="relative h-72 w-full flex items-center justify-center">
            {/* Background ambient pie glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={planDist} 
                  cx="50%" cy="50%" 
                  innerRadius={70} outerRadius={110} 
                  paddingAngle={5} 
                  dataKey="value"
                  label={({ name, percent }) => `${name.toUpperCase()} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: "rgba(167,139,250,0.5)", strokeWidth: 1.5 }}
                  stroke="none"
                >
                  {planDist.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.fill} style={{ filter: `drop-shadow(0 0 12px ${entry.fill}80)` }} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest ml-1 mr-4">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  )
}
