import { BarChart3, LineChart, Activity } from "lucide-react";

export default function DashboardPreview() {
  return (
    <section
      className="w-full bg-slate-900 relative overflow-hidden"
      style={{ padding: "6rem clamp(2rem, 6vw, 6vw)" }}
    >
      <div className="absolute inset-0 bg-linear-to-br from-orange-500/10 to-transparent pointer-events-none"></div>

      <div className="relative z-10 w-full">
        <div
          className="text-center mb-24 mx-auto"
          style={{ maxWidth: "1200px" }}
        >
          <h2
            style={{ fontSize: "clamp(3.5rem, 5vw, 5rem)" }}
            className="font-bold tracking-tight text-white mb-6"
          >
            Total Organizational Control
          </h2>
          <p
            style={{ fontSize: "clamp(1.5rem, 2vw, 2rem)" }}
            className="leading-relaxed text-slate-400 max-w-4xl mx-auto"
          >
            Real-time analytics, performance tracking, and engagement insights
            tailored for enterprise leadership.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-800/50 backdrop-blur-md p-10 sm:p-12 shadow-2xl w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-slate-900 rounded-2xl border border-white/5 p-8 transform hover:-translate-y-1 transition duration-300">
              <div className="flex items-center gap-4 mb-6 text-white">
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <Activity className="text-orange-500 h-8 w-8" />
                </div>
                <h3 className="font-semibold text-xl">Task Velocity</h3>
              </div>
              <div className="h-32 bg-linear-to-t from-orange-500/20 to-transparent rounded-xl border-b-[3px] border-orange-500"></div>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-white/5 p-8 transform hover:-translate-y-1 transition duration-300 delay-100">
              <div className="flex items-center gap-4 mb-6 text-white">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <BarChart3 className="text-blue-500 h-8 w-8" />
                </div>
                <h3 className="font-semibold text-xl">Team Performance</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-full bg-slate-800 rounded-full">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: "80%" }}
                    ></div>
                  </div>
                  <span className="text-base text-slate-400 whitespace-nowrap">
                    80%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-full bg-slate-800 rounded-full">
                    <div
                      className="h-2 bg-blue-400 rounded-full"
                      style={{ width: "65%" }}
                    ></div>
                  </div>
                  <span className="text-base text-slate-400 whitespace-nowrap">
                    65%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-full bg-slate-800 rounded-full">
                    <div
                      className="h-2 bg-blue-300 rounded-full"
                      style={{ width: "40%" }}
                    ></div>
                  </div>
                  <span className="text-base text-slate-400 whitespace-nowrap">
                    40%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-white/5 p-8 transform hover:-translate-y-1 transition duration-300 delay-200">
              <div className="flex items-center gap-4 mb-6 text-white">
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <LineChart className="text-emerald-500 h-8 w-8" />
                </div>
                <h3 className="font-semibold text-xl">Corporate Growth</h3>
              </div>
              <div className="flex items-end h-32 gap-1.5">
                {[40, 60, 45, 80, 50, 90, 75].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-emerald-500/50 rounded-t-sm"
                    style={{ height: `${h}%` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
