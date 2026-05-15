import { useEffect, useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
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
  ChevronDown,
} from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: Layout },
  { id: "performance", label: "Performance", icon: Award },
  { id: "engagement", label: "Engagement", icon: MessageSquare },
  { id: "collaboration", label: "Collaboration", icon: Zap },
];

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentTab = TABS.find((t) => t.id === activeTab);
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
      {/* Responsive Tab Navigation */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-[2.5rem] border-2 border-slate-200 dark:border-slate-700 p-2 md:p-4 shadow-sm mb-6 md:mb-12">
        {/* Mobile Dropdown */}
        <div className="md:hidden relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-4 text-[13px] font-black uppercase tracking-widest outline-none focus:ring-2 ring-blue-500/20 shadow-sm"
          >
            <div className="flex items-center gap-3">
              {currentTab && <currentTab.icon className="h-5 w-5" />}
              {currentTab?.label}
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isDropdownOpen ? "rotate-180 text-blue-600" : "text-slate-400"}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-4 text-[13px] font-black uppercase tracking-widest transition-all border-b last:border-0 border-slate-100 dark:border-slate-700/50 ${
                    activeTab === tab.id
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Tabs */}
        <div className="hidden md:flex flex-wrap gap-4 md:gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-6 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl text-[14px] md:text-body font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20 scale-105"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              <tab.icon className="h-5 w-5" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-8 md:mb-12">
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
                className="bg-white dark:bg-slate-800 p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] border-2 border-slate-100 dark:border-white/5 shadow-sm"
              >
                <stat.icon className={`h-8 w-8 md:h-10 md:w-10 ${stat.color} mb-4 md:mb-6`} />
                <p className="text-[10px] md:text-label font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">
                  {stat.label}
                </p>
                <h3 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tighter">
                  {stat.value}
                </h3>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 md:p-12 rounded-2xl md:rounded-[3rem] border-2 border-slate-100 dark:border-white/5 shadow-sm">
            <h3 className="text-[14px] md:text-heading-2 font-black uppercase tracking-tight text-slate-800 dark:text-white mb-6 md:mb-10 flex items-center gap-3 md:gap-4">
              <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-blue-500 shrink-0" />{" "}
              Organizational Pulse <span className="hidden sm:inline">(7-Day Trend)</span>
            </h3>
            <div className="h-[250px] md:h-[400px]">
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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 md:gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-slate-800 p-6 md:p-12 rounded-2xl md:rounded-[3rem] border-2 border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
            <h3 className="text-[16px] md:text-heading-2 font-black uppercase tracking-tight text-slate-800 dark:text-white mb-6 md:mb-10 truncate">
              Top Performer Leaderboard
            </h3>
            <div className="space-y-4 md:space-y-6">
              {data.performance.map((p, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6 p-4 md:p-6 bg-slate-50 dark:bg-white/5 rounded-xl md:rounded-[2rem] border border-slate-100 dark:border-white/5"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-[18px] md:text-heading-2 shadow-lg shadow-blue-500/20 shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] md:text-heading-3 font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">
                        {p.name}
                      </p>
                      <p className="text-[9px] md:text-label font-bold text-slate-400 uppercase tracking-widest">
                        {p.completed} Operations
                      </p>
                    </div>
                  </div>
                  <div className="sm:text-right flex sm:block items-center justify-between sm:justify-end border-t sm:border-t-0 border-slate-200 dark:border-slate-700/50 pt-3 sm:pt-0 mt-1 sm:mt-0">
                    <p className="text-[10px] sm:hidden font-black text-slate-400 uppercase">Rate</p>
                    <div>
                      <p className="text-[20px] md:text-heading-1 font-black text-blue-600 tracking-tighter leading-none">
                        {Math.round((p.completed / p.total) * 100)}%
                      </p>
                      <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase mt-1 hidden sm:block">
                        Success Rate
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 md:p-12 rounded-2xl md:rounded-[3rem] border-2 border-slate-100 dark:border-white/5 shadow-sm">
            <h3 className="text-[16px] md:text-heading-2 font-black uppercase tracking-tight text-slate-800 dark:text-white mb-6 md:mb-10 text-center">
              Efficiency Distribution
            </h3>
            <div className="h-[250px] md:h-[400px]">
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
        <div className="bg-white dark:bg-slate-800 p-6 md:p-12 lg:p-20 rounded-2xl md:rounded-[4rem] border-2 border-slate-100 dark:border-white/5 shadow-sm flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-[16px] md:text-heading-1 font-black uppercase tracking-widest text-slate-800 dark:text-white mb-8 md:mb-16 text-center">
            Enterprise Synergy Map
          </h3>
          <div className="h-[300px] md:h-[500px] w-full max-w-4xl">
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
                  tick={{ fontSize: 10, fontWeight: "black", fill: "#94a3b8" }}
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
          <div className="mt-8 md:mt-16 grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-8 w-full">
            {data.collaboration.map((c, i) => (
              <div key={i} className="text-center">
                <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  {c.subject}
                </p>
                <p className="text-[20px] md:text-heading-1 font-black text-slate-800 dark:text-white">
                  {c.A}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "engagement" && (
        <div className="bg-white dark:bg-slate-800 p-6 md:p-12 rounded-2xl md:rounded-[3rem] border-2 border-slate-100 dark:border-white/5 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-12 gap-4">
            <h3 className="text-[16px] md:text-heading-2 font-black uppercase tracking-tight text-slate-800 dark:text-white">
              Communication Density
            </h3>
            <div className="flex items-center gap-3 px-4 py-2.5 md:px-6 md:py-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl md:rounded-2xl text-blue-600 border border-blue-100 dark:border-blue-800/30 w-fit">
              <MousePointer2 className="h-4 w-4 md:h-5 md:w-5" />
              <span className="text-[9px] md:text-label font-black uppercase tracking-widest">
                Real-time active
              </span>
            </div>
          </div>
          <div className="h-[250px] md:h-[450px]">
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
