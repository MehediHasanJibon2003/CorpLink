import { useEffect, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { BarChart3, TrendingUp, Users, Target, Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6'];

export default function Analytics() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    completionRate: 0,
    statusData: [],
    priorityData: [],
    projectData: []
  });

  const fetchAnalyticsData = async () => {
    if (!profile) return;
    setLoading(true);

    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("*, projects(name)")
      .eq("company_id", profile.company_id);

    if (!error && tasks) {
      const total = tasks.length;
      const finished = tasks.filter(t => t.status === 'finished').length;
      const pending = tasks.filter(t => t.status === 'pending').length;
      
      // Status Distribution
      const statusCounts = tasks.reduce((acc, t) => {
        const label = t.status.replace("_", " ").toUpperCase();
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      }, {});
      const statusData = Object.keys(statusCounts).map(name => ({ name, value: statusCounts[name] }));

      // Priority Breakdown
      const priorityCounts = tasks.reduce((acc, t) => {
        const label = t.priority.toUpperCase();
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      }, {});
      const priorityData = Object.keys(priorityCounts).map(name => ({ name, value: priorityCounts[name] }));

      // Project Velocity
      const projectCounts = tasks.reduce((acc, t) => {
        const name = t.projects?.name || "Global Inbox";
        if (!acc[name]) acc[name] = { name, total: 0, done: 0 };
        acc[name].total++;
        if (t.status === 'finished') acc[name].done++;
        return acc;
      }, {});
      const projectData = Object.values(projectCounts);

      setStats({
        totalTasks: total,
        completedTasks: finished,
        pendingTasks: pending,
        completionRate: total > 0 ? Math.round((finished / total) * 100) : 0,
        statusData,
        priorityData,
        projectData
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [profile]);

  if (loading) return (
    <AppLayout title="Advanced Analytics" subtitle="Synthesizing organizational intelligence...">
      <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
         <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
         <p className="text-xl font-black text-slate-400 uppercase tracking-widest animate-pulse">Decrypting Corporate Data...</p>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout title="Advanced Analytics" subtitle="Deep dive into organizational performance">
      
      {/* Top Stats HUD */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 md:gap-10 mb-12 md:mb-16">
        {[
          { title: "Mission Velocity", value: `${stats.completionRate}%`, icon: TrendingUp, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30", desc: "Overall task completion rate" },
          { title: "Active Agents", value: stats.totalTasks, icon: Users, color: "text-purple-600 bg-purple-50 dark:bg-purple-900/30", desc: "Total lifecycle tasks tracked" },
          { title: "Field Success", value: stats.completedTasks, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30", desc: "Successfully finished operations" },
          { title: "Open Objectives", value: stats.pendingTasks, icon: Clock, color: "text-amber-600 bg-amber-50 dark:bg-amber-900/30", desc: "Tasks awaiting initial engagement" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-[2.5rem] md:rounded-[3rem] shadow-sm border-2 border-slate-100 dark:border-white/5 p-10 md:p-12 flex flex-col gap-8 transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] ${stat.color} shadow-inner`}>
                  <Icon className="h-10 w-10 md:h-12 md:w-12" />
                </div>
                <div className="text-right">
                  <p className="text-base md:text-xl font-black text-slate-400 uppercase tracking-widest">{stat.title}</p>
                  <h3 className="text-4xl md:text-6xl font-black text-slate-800 dark:text-slate-100 mt-2 tracking-tighter">{stat.value}</h3>
                </div>
              </div>
              <p className="text-base md:text-xl text-slate-500 dark:text-slate-400 font-medium italic border-t-2 border-slate-50 dark:border-white/5 pt-4">{stat.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-12 mb-12">
        {/* Status Distribution - Pie Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-12 border-2 border-slate-100 dark:border-white/5 shadow-sm">
           <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-10 flex items-center gap-4">
             <div className="w-4 h-4 rounded-full bg-blue-500" /> Operational Status Hub
           </h3>
           <div className="h-[400px] w-full flex items-center justify-center overflow-hidden">
              {stats.statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
                  <PieChart>
                    <Pie data={stats.statusData} cx="50%" cy="50%" innerRadius={80} outerRadius={140} paddingAngle={5} dataKey="value">
                      {stats.statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-400 font-bold uppercase tracking-widest animate-pulse">Waiting for Field Data...</p>
              )}
           </div>
           <div className="grid grid-cols-2 gap-4 mt-8">
              {stats.statusData.map((d, i) => (
                <div key={i} className="flex items-center gap-3 px-6 py-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{d.name}: {d.value}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Priority Breakdown - Bar Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-12 border-2 border-slate-100 dark:border-white/5 shadow-sm">
           <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-10 flex items-center gap-4">
             <div className="w-4 h-4 rounded-full bg-amber-500" /> Strategic Priority Load
           </h3>
           <div className="h-[400px] w-full flex items-center justify-center overflow-hidden">
              {stats.priorityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
                  <BarChart data={stats.priorityData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#94a3b8' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-400 font-bold uppercase tracking-widest animate-pulse">Calculating Priority Metrics...</p>
              )}
           </div>
        </div>
      </div>

      {/* Project Performance - Area Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-12 md:p-16 border-2 border-slate-100 dark:border-white/5 shadow-sm mb-32">
         <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-12 flex items-center gap-4">
           <div className="w-4 h-4 rounded-full bg-emerald-500" /> Enterprise Project Velocity
         </h3>
         <div className="h-[500px] w-full flex items-center justify-center">
            {stats.projectData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.projectData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDone" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
                  <Area type="monotone" dataKey="done" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorDone)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center">
                <BarChart3 className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest">No Active Project Velocity Detected</p>
              </div>
            )}
         </div>
      </div>
    </AppLayout>
  );
}

