import { useEffect, useState, useCallback } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts'
import { 
  TrendingUp, Target, Zap, Clock, Shield, 
  Award, BarChart3, CheckCircle2 
} from "lucide-react"

export default function PerformanceInsight() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    completionRate: 0,
    totalTasks: 0,
    completedTasks: 0,
    engagementScore: 0
  })
  const [activities, setActivities] = useState([])
  const [radarData, setRadarData] = useState([])
  const [chartData, setChartData] = useState([])

  const fetchPerformance = useCallback(async () => {
    if (!profile?.company_id) return
    setLoading(true)

    try {
      // 1. Fetch User's Tasks
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("assigned_to", profile?.employee_id || user?.id)
        .eq("company_id", profile.company_id)

      const total = tasks?.length || 0
      const completed = tasks?.filter(t => ['finished', 'completed'].includes(t.status)).length || 0
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0

      // 2. Fetch User's Activity
      const { data: logs } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", user?.id)
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false })
        .limit(20)

      setActivities(logs || [])

      // 3. Prepare Radar Data (Mocking some values based on real counts)
      const engagement = Math.min(100, (logs?.length || 0) * 5)
      setRadarData([
        { subject: 'Operational Speed', A: Math.min(100, rate + 10), fullMark: 100 },
        { subject: 'Mission Success', A: rate, fullMark: 100 },
        { subject: 'Enterprise Synergy', A: engagement, fullMark: 100 },
        { subject: 'Strategic Impact', A: 85, fullMark: 100 },
        { subject: 'Consistency', A: 92, fullMark: 100 },
      ])

      // 4. Prepare Bar Chart Data (Tasks per month/week - for now simple summary)
      setChartData([
        { name: 'Pending', count: total - completed },
        { name: 'Completed', count: completed },
      ])

      setStats({
        completionRate: rate,
        totalTasks: total,
        completedTasks: completed,
        engagementScore: engagement
      })

    } catch (err) {
      console.error("Performance Insight Error:", err)
    } finally {
      setLoading(false)
    }
  }, [user?.id, profile?.company_id, profile?.employee_id])

  useEffect(() => {
    if (!profile) {
      // Set a timeout to stop loading if profile takes too long
      const timer = setTimeout(() => {
        setLoading(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    fetchPerformance();
  }, [profile, fetchPerformance]);

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
       <div className="h-20 w-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
       <p className="text-heading-2 font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Individual Performance Metrics...</p>
    </div>
  );

  if (!profile) return (
    <div className="p-20 text-center">
       <h2 className="text-heading-1 font-black text-slate-800 dark:text-white uppercase tracking-tighter">Profile Authorization Required</h2>
       <p className="text-slate-500 mt-4 font-bold uppercase tracking-widest">Please wait while we establish your security context.</p>
    </div>
  );

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: "Mission Success", value: `${stats.completionRate}%`, icon: Award, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Ops Completed", value: stats.completedTasks, icon: Target, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "Total Directives", value: stats.totalTasks, icon: CheckCircle2, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
          { label: "Synergy Score", value: `${stats.engagementScore}%`, icon: Zap, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border-2 border-slate-100 dark:border-white/5 shadow-sm">
             <div className={`h-16 w-16 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6`}>
                <stat.icon className="h-8 w-8" />
             </div>
             <p className="text-label font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
             <h3 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        {/* Radar Map */}
        <div className="bg-white dark:bg-slate-800 p-12 rounded-[3rem] border-2 border-slate-100 dark:border-white/5 shadow-sm flex flex-col items-center">
           <h3 className="text-heading-1 font-black uppercase tracking-tight text-slate-800 dark:text-white mb-12 flex items-center gap-4 w-full">
              <TrendingUp className="h-8 w-8 text-blue-600" /> Operational Skill Map
           </h3>
           <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 'black', fill: '#94a3b8' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Performance" dataKey="A" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.6} />
                 </RadarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Task Contribution */}
        <div className="bg-white dark:bg-slate-800 p-12 rounded-[3rem] border-2 border-slate-100 dark:border-white/5 shadow-sm">
           <h3 className="text-heading-1 font-black uppercase tracking-tight text-slate-800 dark:text-white mb-12 flex items-center gap-4">
              <BarChart3 className="h-8 w-8 text-purple-600" /> Directive Contribution
           </h3>
           <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 14, fontWeight: 'black' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 14, fontWeight: 'black' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="count" fill="#6366f1" radius={[10, 10, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white dark:bg-slate-800 rounded-[3rem] border-2 border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="p-10 border-b-2 border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-slate-900/30">
          <h3 className="text-heading-1 font-black uppercase tracking-tight text-slate-800 dark:text-white flex items-center gap-4">
            <Zap className="h-8 w-8 text-orange-500" /> Operational Protocol Log
          </h3>
          <Shield className="h-8 w-8 text-emerald-500" />
        </div>
        
        <div className="divide-y-2 divide-slate-100 dark:divide-slate-800">
           {activities.length === 0 ? (
             <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest italic">No operational records found.</div>
           ) : (
             activities.map(act => (
               <div key={act.id} className="p-10 flex items-center gap-8 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-all group">
                  <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0 border-2 border-transparent group-hover:border-blue-500/20 transition-all">
                     <Clock className="h-8 w-8 text-slate-400" />
                  </div>
                  <div className="flex-1">
                     <div className="flex items-center gap-4 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{act.entity}</span>
                        <span className="text-label font-bold text-slate-400">{new Date(act.created_at).toLocaleString()}</span>
                     </div>
                     <p className="text-heading-2 font-black text-slate-700 dark:text-slate-200 tracking-tight">{act.action}</p>
                  </div>
                  <div className="hidden md:block">
                     <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  </div>
               </div>
             ))
           )}
        </div>
      </div>

    </div>
  )
}

