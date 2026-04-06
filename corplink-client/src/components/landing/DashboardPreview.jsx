import { BarChart3, LineChart, Activity } from "lucide-react";

export default function DashboardPreview() {
  return (
    <div className="bg-slate-900 py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent pointer-events-none"></div>
      
      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Total Organizational Control
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Real-time analytics, performance tracking, and engagement insights tailored for enterprise leadership.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur-md p-4 sm:p-8 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Mockup cards simulating the real dashboard */}
            <div className="bg-slate-900 rounded-xl border border-white/5 p-6 transform hover:-translate-y-1 transition duration-300">
              <div className="flex items-center gap-4 mb-4 text-white">
                <div className="p-3 bg-orange-500/20 rounded-lg"><Activity className="text-orange-500 h-6 w-6"/></div>
                <h3 className="font-semibold">Task Velocity</h3>
              </div>
              <div className="h-24 bg-gradient-to-t from-orange-500/20 to-transparent rounded-lg border-b-2 border-orange-500"></div>
            </div>

            <div className="bg-slate-900 rounded-xl border border-white/5 p-6 transform hover:-translate-y-1 transition duration-300 delay-100">
              <div className="flex items-center gap-4 mb-4 text-white">
                <div className="p-3 bg-blue-500/20 rounded-lg"><BarChart3 className="text-blue-500 h-6 w-6"/></div>
                <h3 className="font-semibold">Team Performance</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-full bg-slate-800 rounded-full"><div className="h-2 bg-blue-500 rounded-full" style={{width: '80%'}}></div></div>
                  <span className="text-xs text-slate-400">80%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-full bg-slate-800 rounded-full"><div className="h-2 bg-blue-400 rounded-full" style={{width: '65%'}}></div></div>
                  <span className="text-xs text-slate-400">65%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-full bg-slate-800 rounded-full"><div className="h-2 bg-blue-300 rounded-full" style={{width: '40%'}}></div></div>
                  <span className="text-xs text-slate-400">40%</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl border border-white/5 p-6 transform hover:-translate-y-1 transition duration-300 delay-200">
              <div className="flex items-center gap-4 mb-4 text-white">
                <div className="p-3 bg-emerald-500/20 rounded-lg"><LineChart className="text-emerald-500 h-6 w-6"/></div>
                <h3 className="font-semibold">Corporate Growth</h3>
              </div>
              <div className="flex items-end h-24 gap-2">
                {[40, 60, 45, 80, 50, 90, 75].map((h, i) => (
                  <div key={i} className="flex-1 bg-emerald-500/50 rounded-t-sm" style={{height: `${h}%`}}></div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
