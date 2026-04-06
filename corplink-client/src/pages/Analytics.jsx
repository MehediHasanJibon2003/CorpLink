import AppLayout from "../components/layout/AppLayout";
import { BarChart3, TrendingUp, Users, Target } from "lucide-react";

export default function Analytics() {
  return (
    <AppLayout title="Advanced Analytics" subtitle="Deep dive into organizational performance">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: "Team Velocity", value: "85%", icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
          { title: "Task Completion", value: "92%", icon: Target, color: "text-emerald-600 bg-emerald-50" },
          { title: "Engagement Rate", value: "64%", icon: Users, color: "text-purple-600 bg-purple-50" },
          { title: "System Utilization", value: "98%", icon: BarChart3, color: "text-amber-600 bg-amber-50" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 flex flex-col items-center justify-center text-center">
        <BarChart3 className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Advanced Analytics Hub</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-lg">
          The full advanced analytics dashboard is currently under construction. Future updates will bring predictive performance analysis and automated reporting generated from your workspace data.
        </p>
      </div>
    </AppLayout>
  )
}
