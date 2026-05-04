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

  const cardCls = "rounded-3xl md:rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm dark:shadow-[0_15px_50px_rgba(0,0,0,0.2)]"

  const metrics = [
    { label: "Total Corporates", value: totals.companies, icon: Server, color: "#8b5cf6", grad: "linear-gradient(135deg, #8b5cf6, #6366f1)" },
    { label: "Platform Users",   value: totals.users,     icon: Users,  color: "#ec4899", grad: "linear-gradient(135deg, #ec4899, #f43f5e)" },
    { label: "Total Tasks",      value: totals.tasks,     icon: Activity, color: "#10b981", grad: "linear-gradient(135deg, #10b981, #059669)" },
  ]

  return (
    <SuperAdminLayout title="Platform Analytics" subtitle="Deep insights and telemetry across the entire Corporate infrastructure">
      
      {/* Top Level Metrics (Glass Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-12">
        {metrics.map(m => (
          <div key={m.label} className={cardCls}>
            <div className="absolute top-0 right-0 w-48 h-48 opacity-25 blur-[100px] -translate-y-1/2 translate-x-1/2" style={{ background: `radial-gradient(circle, ${m.color}, transparent)` }} />
            
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-violet-400 mb-3 md:mb-5">{m.label}</p>
                <p className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white dark:drop-shadow-[0_0_30px_var(--tw-shadow-color)]" style={{ '--tw-shadow-color': `${m.color}60` }}>
                  {loading ? "..." : m.value.toLocaleString()}
                </p>
              </div>
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-[2rem] flex items-center justify-center shadow-2xl transform rotate-3 scale-110" style={{ background: m.grad }}>
                <m.icon className="h-8 w-8 md:h-12 md:w-12 text-white stroke-[2.5px]" />
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 h-1.5 md:h-2" style={{ background: m.grad }} />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Corporate Growth Chart */}
        <div className={cardCls}>
          <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-10">
            <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-violet-100 dark:bg-violet-500/10 border-2 border-violet-200 dark:border-violet-500/20 shadow-md">
              <TrendingUp className="h-5 w-5 md:h-7 md:w-7 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-base md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Platform Growth (6mo)</h3>
          </div>
          
          {loading ? (
            <div className="h-56 flex items-center justify-center"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="relative h-72 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 11, fontWeight: 900, letterSpacing: 1 }} axisLine={false} tickLine={false} dy={15} />
                  <YAxis tick={{ fill: tickColor, fontSize: 11, fontWeight: 900 }} axisLine={false} tickLine={false} allowDecimals={false} dx={-15} />
                  <Tooltip {...tooltipStyle} cursor={{ stroke: 'rgba(139,92,246,0.3)', strokeWidth: 3, strokeDasharray: '4 4' }} />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    name="New Onboards" 
                    stroke="#a855f7" 
                    strokeWidth={6} 
                    dot={{ fill: "#0d0622", stroke: "#c084fc", strokeWidth: 4, r: 8 }} 
                    activeDot={{ r: 10, fill: "#c084fc", stroke: "#fff", strokeWidth: 3 }}
                    style={{ filter: "drop-shadow(0 12px 20px rgba(168,85,247,0.5))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Status Distribution Chart */}
        <div className={cardCls}>
          <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-10">
            <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-blue-50 dark:bg-blue-500/10 border-2 border-blue-100 dark:border-blue-500/20 shadow-md">
              <BarChart3 className="h-5 w-5 md:h-7 md:w-7 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="text-base md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Corporate Status Breakdown</h3>
          </div>
          
          {loading ? (
            <div className="h-56 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="relative h-72 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusDist} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1 }} axisLine={false} tickLine={false} dy={15} />
                  <YAxis tick={{ fill: tickColor, fontSize: 11, fontWeight: 900 }} axisLine={false} tickLine={false} allowDecimals={false} dx={-15} />
                  <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="count" name="Total Count" radius={[12, 12, 0, 0]}>
                    {statusDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} style={{ filter: `drop-shadow(0 0 15px ${entry.fill}80)` }} />
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
        <div className="flex items-center gap-4 md:gap-6 mb-4 md:mb-6">
          <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-100 dark:border-emerald-500/20 shadow-md">
            <PieChartIcon className="h-5 w-5 md:h-7 md:w-7 text-emerald-500 dark:text-emerald-400" />
          </div>
          <h3 className="text-base md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Active Subscription Tiers</h3>
        </div>
        
        {loading ? (
          <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : planDist.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-violet-300 gap-3">
            <PieChartIcon className="h-12 w-12 opacity-30" />
            <p className="text-sm font-bold tracking-wide">No subscription data available</p>
          </div>
        ) : (
          <div className="relative h-96 md:h-[32rem] w-full flex items-center justify-center">
            {/* Background ambient pie glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />
            
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={planDist} 
                  cx="50%" cy="50%" 
                  innerRadius={100} outerRadius={160} 
                  paddingAngle={8} 
                  dataKey="value"
                  label={({ name, percent }) => `${name.toUpperCase()} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: "rgba(167,139,250,0.6)", strokeWidth: 2 }}
                  stroke="none"
                >
                  {planDist.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.fill} style={{ filter: `drop-shadow(0 0 20px ${entry.fill}90)` }} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend 
                  verticalAlign="bottom" 
                  height={48} 
                  iconType="circle"
                  formatter={(value) => <span className="text-xs md:text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] ml-2 mr-8">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  )
}
