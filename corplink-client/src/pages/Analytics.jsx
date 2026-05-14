import { useEffect, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Loader2,
  CheckCircle2,
  MessageSquare,
  Zap,
  Award,
  Layout,
  MousePointer2,
} from "lucide-react";

const COLORS = [
  "#2563eb",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#6366f1",
  "#ef4444",
];

export default function Analytics() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    overview: {},
    performance: [],
    engagement: [],
    collaboration: [],
  });

  const fetchAnalytics = async () => {
    if (!profile?.company_id) return;
    setLoading(true);

    try {
      // 1. Fetch Tasks & Projects
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*, projects(name), profiles:assigned_to(full_name)")
        .eq("company_id", profile.company_id);
      const { data: messages } = await supabase
        .from("internal_messages")
        .select("created_at, sender_id")
        .gte(
          "created_at",
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        );
      const { data: employees } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("company_id", profile.company_id);

      // --- OVERVIEW LOGIC ---
      const finished =
        tasks?.filter(
          (t) => t.status === "finished" || t.status === "completed",
        ).length || 0;
      const total = tasks?.length || 0;

      const overview = {
        velocity: total > 0 ? Math.round((finished / total) * 100) : 0,
        totalTasks: total,
        activeProjects: new Set(tasks?.map((t) => t.project_id).filter(Boolean))
          .size,
        engagementScore: Math.min(
          100,
          Math.round(((messages?.length || 0) / (employees?.length || 1)) * 10),
        ),
      };

      // --- PERFORMANCE LOGIC ---
      const perfMap = {};
      tasks?.forEach((t) => {
        const name = t.profiles?.full_name || "Unassigned";
        if (!perfMap[name]) perfMap[name] = { name, completed: 0, total: 0 };
        perfMap[name].total++;
        if (t.status === "finished" || t.status === "completed")
          perfMap[name].completed++;
      });
      const performance = Object.values(perfMap)
        .sort((a, b) => b.completed - a.completed)
        .slice(0, 5);

      // --- ENGAGEMENT LOGIC ---
      const engagementMap = {};
      messages?.forEach((m) => {
        const date = new Date(m.created_at).toLocaleDateString("en-US", {
          weekday: "short",
        });
        engagementMap[date] = (engagementMap[date] || 0) + 1;
      });
      const engagement = Object.keys(engagementMap).map((day) => ({
        day,
        count: engagementMap[day],
      }));

      // --- COLLABORATION LOGIC ---
      const collabData = [
        {
          subject: "Communication",
          A: overview.engagementScore,
          fullMark: 100,
        },
        { subject: "Task Speed", A: overview.velocity, fullMark: 100 },
        {
          subject: "Project Density",
          A: Math.min(100, overview.activeProjects * 20),
          fullMark: 100,
        },
        { subject: "Team Synergy", A: 85, fullMark: 100 },
        { subject: "Consistency", A: 78, fullMark: 100 },
      ];

      setData({ overview, performance, engagement, collaboration: collabData });
    } catch (err) {
      console.error("Analytics Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [profile]);

  if (loading)
    return (
      <AppLayout
        title="Analytics Hub"
        subtitle="Processing organizational intelligence..."
      >
        <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
          <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
          <p className="text-heading-2 font-black text-slate-400 uppercase tracking-widest animate-pulse">
            Scanning Enterprise Metrics...
          </p>
        </div>
      </AppLayout>
    );

  return (
    <AppLayout
      title="Enterprise Insights"
      subtitle="Real-time organizational performance monitoring"
    >
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-4 mb-12 bg-slate-100 dark:bg-slate-900/50 p-2 rounded-3xl w-fit border-2 border-slate-200 dark:border-white/5">
        {[
          { id: "overview", label: "Overview", icon: Layout },
          { id: "performance", label: "Performance", icon: Award },
          { id: "engagement", label: "Engagement", icon: MessageSquare },
          { id: "collaboration", label: "Collaboration", icon: Zap },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-body font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20 scale-105" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"}`}
          >
            <tab.icon className="h-5 w-5" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {[
              {
                label: "Mission Velocity",
                value: `${data.overview.velocity}%`,
                icon: TrendingUp,
                color: "text-blue-500",
              },
              {
                label: "Total Objectives",
                value: data.overview.totalTasks,
                icon: Target,
                color: "text-purple-500",
              },
              {
                label: "Active Sectors",
                value: data.overview.activeProjects,
                icon: Layout,
                color: "text-emerald-500",
              },
              {
                label: "Engagement Score",
                value: `${data.overview.engagementScore}%`,
                icon: MessageSquare,
                color: "text-orange-500",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-800 p-10 rounded-[2.5rem] border-2 border-slate-100 dark:border-white/5 shadow-sm"
              >
                <stat.icon className={`h-10 w-10 ${stat.color} mb-6`} />
                <p className="text-label font-black text-slate-400 uppercase tracking-widest mb-2">
                  {stat.label}
                </p>
                <h3 className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter">
                  {stat.value}
                </h3>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-800 p-12 rounded-[3rem] border-2 border-slate-100 dark:border-white/5 shadow-sm">
            <h3 className="text-heading-2 font-black uppercase tracking-tight text-slate-800 dark:text-white mb-10 flex items-center gap-4">
              <div className="w-4 h-4 rounded-full bg-blue-500" />{" "}
              Organizational Pulse (7-Day Interaction Trend)
            </h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.engagement}>
                  <defs>
                    <linearGradient
                      id="colorEngagement"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fontWeight: "bold" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fontWeight: "bold" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "20px",
                      border: "none",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={4}
                    fill="url(#colorEngagement)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === "performance" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-slate-800 p-12 rounded-[3rem] border-2 border-slate-100 dark:border-white/5 shadow-sm">
            <h3 className="text-heading-2 font-black uppercase tracking-tight text-slate-800 dark:text-white mb-10">
              Top Performer Leaderboard
            </h3>
            <div className="space-y-6">
              {data.performance.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-6 p-6 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/5"
                >
                  <div className="h-14 w-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-heading-2 shadow-lg shadow-blue-500/20">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-heading-3 font-black text-slate-800 dark:text-white uppercase tracking-tight">
                      {p.name}
                    </p>
                    <p className="text-label font-bold text-slate-400 uppercase tracking-widest">
                      {p.completed} Operations Completed
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-heading-1 font-black text-blue-600 tracking-tighter">
                      {Math.round((p.completed / p.total) * 100)}%
                    </p>
                    <p className="text-[10px] font-black text-slate-400 uppercase">
                      Success Rate
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-12 rounded-[3rem] border-2 border-slate-100 dark:border-white/5 shadow-sm">
            <h3 className="text-heading-2 font-black uppercase tracking-tight text-slate-800 dark:text-white mb-10 text-center">
              Efficiency Distribution
            </h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.performance}
                    dataKey="completed"
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                  >
                    {data.performance.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: "20px", border: "none" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === "collaboration" && (
        <div className="bg-white dark:bg-slate-800 p-12 md:p-20 rounded-[4rem] border-2 border-slate-100 dark:border-white/5 shadow-sm flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-heading-1 font-black uppercase tracking-widest text-slate-800 dark:text-white mb-16">
            Enterprise Synergy Map
          </h3>
          <div className="h-[500px] w-full max-w-4xl">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="80%"
                data={data.collaboration}
              >
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fontSize: 12, fontWeight: "black", fill: "#94a3b8" }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="Synergy"
                  dataKey="A"
                  stroke="#2563eb"
                  fill="#3b82f6"
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-16 grid grid-cols-2 md:grid-cols-5 gap-8 w-full">
            {data.collaboration.map((c, i) => (
              <div key={i} className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  {c.subject}
                </p>
                <p className="text-heading-1 font-black text-slate-800 dark:text-white">
                  {c.A}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "engagement" && (
        <div className="bg-white dark:bg-slate-800 p-12 rounded-[3rem] border-2 border-slate-100 dark:border-white/5 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-12">
            <h3 className="text-heading-2 font-black uppercase tracking-tight text-slate-800 dark:text-white">
              Communication Density
            </h3>
            <div className="flex items-center gap-3 px-6 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600 border border-blue-100 dark:border-blue-800/30">
              <MousePointer2 className="h-5 w-5" />
              <span className="text-label font-black uppercase tracking-widest">
                Real-time usage active
              </span>
            </div>
          </div>
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.engagement}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fontWeight: "bold" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fontWeight: "bold" }}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{ borderRadius: "20px", border: "none" }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
