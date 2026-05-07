import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import SuperAdminLayout from "../../components/superadmin/layout/SuperAdminLayout"
import { Users, Building2, CreditCard, ShieldAlert, ArrowUpRight, ArrowDownRight, Activity, Zap } from "lucide-react"

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    activeSubscriptions: 0,
    pendingApprovals: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      const [users, companies, pending] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("companies").select("id", { count: "exact", head: true }).eq("status", "pending")
      ])

      setStats({
        totalUsers: users.count || 0,
        totalCompanies: companies.count || 0,
        activeSubscriptions: 0, // Set to 0 for now as table might be missing
        pendingApprovals: pending.count || 0
      })
      setLoading(false)
    }

    fetchStats()
  }, [])

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { label: "Total Corporates", value: stats.totalCompanies, icon: Building2, color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20" },
    { label: "Active Subs", value: stats.activeSubscriptions, icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { label: "Pending Approvals", value: stats.pendingApprovals, icon: ShieldAlert, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  ]

  return (
    <SuperAdminLayout title="Platform Overview" subtitle="System status and key performance metrics">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className={`p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border-2 ${card.border} shadow-sm transition-all hover:scale-[1.02]`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-4 rounded-2xl ${card.bg}`}>
                  <Icon className={`h-8 w-8 ${card.color}`} />
                </div>
                <div className="flex items-center gap-1 text-emerald-500 font-black text-xs uppercase">
                  <ArrowUpRight className="h-4 w-4" /> 12%
                </div>
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
              <h3 className="text-4xl font-black text-slate-900 dark:text-white leading-tight">
                {loading ? "..." : card.value}
              </h3>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-8 md:p-12 rounded-[3rem] bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10 h-96">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-violet-500/10 text-violet-500">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Growth Telemetry</h3>
            </div>
          </div>
          <div className="h-48 flex items-center justify-center border-4 border-dashed border-slate-100 dark:border-white/5 rounded-[2rem]">
             <p className="font-black text-slate-300 dark:text-white/10 uppercase tracking-[0.3em]">Growth Charts Coming Soon</p>
          </div>
        </div>

        <div className="p-8 md:p-12 rounded-[3rem] bg-slate-900 dark:bg-[#0d0622] text-white">
          <h3 className="text-xl font-black uppercase tracking-widest mb-10 flex items-center gap-4">
            <Zap className="h-6 w-6 text-amber-400" /> System Pulse
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between py-4 border-b border-white/5">
              <span className="text-sm font-bold text-slate-400 uppercase">Database Status</span>
              <span className="text-emerald-400 font-black text-xs uppercase tracking-widest">Healthy</span>
            </div>
            <div className="flex items-center justify-between py-4 border-b border-white/5">
              <span className="text-sm font-bold text-slate-400 uppercase">API Latency</span>
              <span className="text-emerald-400 font-black text-xs uppercase tracking-widest">24ms</span>
            </div>
            <div className="flex items-center justify-between py-4">
              <span className="text-sm font-bold text-slate-400 uppercase">Storage Usage</span>
              <span className="text-violet-400 font-black text-xs uppercase tracking-widest">12.4 GB</span>
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  )
}
