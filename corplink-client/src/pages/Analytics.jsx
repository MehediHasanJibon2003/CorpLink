import AppLayout from "../components/layout/AppLayout";
import { BarChart3, TrendingUp, Users, Target } from "lucide-react";

export default function Analytics() {
  return (
    <AppLayout
      title="Advanced Analytics"
      subtitle="Deep dive into organizational performance"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 md:gap-10 mb-12 md:mb-16">
        {[
          {
            title: "Performance Velocity",
            value: "85%",
            icon: TrendingUp,
            color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30",
            desc: "Active task progress rate"
          },
          {
            title: "Task Finalization",
            value: "92%",
            icon: Target,
            color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30",
            desc: "Quarterly goal completion"
          },
          {
            title: "User Engagement",
            value: "64%",
            icon: Users,
            color: "text-purple-600 bg-purple-50 dark:bg-purple-900/30",
            desc: "Daily active contributors"
          },
          {
            title: "Resource Load",
            value: "98%",
            icon: BarChart3,
            color: "text-amber-600 bg-amber-50 dark:bg-amber-900/30",
            desc: "Cloud infrastructure usage"
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 rounded-[2.5rem] md:rounded-[3rem] shadow-sm border-2 border-slate-200 dark:border-slate-700 p-10 md:p-12 flex flex-col gap-8 transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] ${stat.color} shadow-inner`}>
                  <Icon className="h-10 w-10 md:h-12 md:w-12" />
                </div>
                <div className="text-right">
                  <p className="text-base md:text-xl font-black text-slate-400 uppercase tracking-widest">
                    {stat.title}
                  </p>
                  <h3 className="text-4xl md:text-6xl font-black text-slate-800 dark:text-slate-100 mt-2 tracking-tighter">
                    {stat.value}
                  </h3>
                </div>
              </div>
              <p className="text-base md:text-xl text-slate-500 dark:text-slate-400 font-medium italic border-t-2 border-slate-50 dark:border-slate-700/50 pt-4">
                {stat.desc}
              </p>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] shadow-sm border-2 border-slate-200 dark:border-slate-700 p-16 md:p-32 flex flex-col items-center justify-center text-center">
        <div className="w-32 h-32 md:w-48 md:h-48 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mb-10 shadow-inner">
           <BarChart3 className="h-16 w-16 md:h-24 md:w-24 text-slate-300 dark:text-slate-600" />
        </div>
        <h2 className="text-3xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
          Advanced Predictive Hub
        </h2>
        <p className="text-xl md:text-3xl text-slate-500 dark:text-slate-400 mt-2 max-w-4xl font-medium leading-relaxed">
          The full advanced analytics engine is currently being calibrated.
          Our next-generation AI will soon provide predictive performance analysis, 
          automated risk detection, and dynamic reporting for your enterprise.
        </p>
        <button className="mt-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-12 py-5 md:py-6 rounded-2xl md:rounded-3xl text-xl md:text-2xl font-black shadow-xl hover:-translate-y-1 transition-all">
           Request Early Access
        </button>
      </div>
    </AppLayout>
  );
}
