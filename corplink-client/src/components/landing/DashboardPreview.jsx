import { BarChart3, LineChart, Activity, Zap, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardPreview() {
  return (
    <section
      className="w-full bg-slate-950 relative overflow-hidden"
      style={{ padding: "10rem clamp(2rem, 6vw, 6vw)" }}
    >
      <div className="absolute inset-0 bg-linear-to-br from-orange-500/10 via-transparent to-blue-500/5 pointer-events-none"></div>

      <div className="relative z-10 w-full">
        <div
          className="text-center mb-32 mx-auto"
          style={{ maxWidth: "1200px" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 font-bold mb-8 uppercase tracking-widest text-body"
          >
            <Zap className="h-4 w-4 fill-orange-500" /> Command Center
          </motion.div>
          <h2
            style={{ fontSize: "clamp(3.5rem, 6vw, 6rem)" }}
            className="font-black tracking-tighter text-white mb-8 leading-tight"
          >
            Total Organizational Control
          </h2>
          <p
            style={{ fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)" }}
            className="leading-relaxed text-slate-400 max-w-5xl mx-auto font-medium"
          >
            Real-time analytics, performance tracking, and engagement insights
            tailored for global enterprise leadership.
          </p>
        </div>

        <div className="rounded-[3rem] border border-white/10 bg-white/5 backdrop-blur-3xl p-10 sm:p-20 shadow-2xl w-full relative overflow-hidden group">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-500/10 blur-[100px] rounded-full group-hover:bg-orange-500/20 transition-colors duration-1000"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
            {/* Task Velocity Card */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-slate-900/50 rounded-3xl border border-white/10 p-10 hover:border-orange-500/50 transition-all duration-500"
            >
              <div className="flex items-center justify-between mb-10 text-white">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-orange-500/20 rounded-2xl">
                    <Activity className="text-orange-500 h-10 w-10" />
                  </div>
                  <h3 className="font-black text-heading-1 tracking-tight">Task Velocity</h3>
                </div>
                <div className="text-orange-500 font-bold flex items-center gap-1">
                  <TrendingUp className="h-5 w-5" /> +12%
                </div>
              </div>
              <div className="h-48 flex items-end gap-2 px-2">
                {[30, 45, 35, 60, 40, 75, 55, 90, 65].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    transition={{ duration: 1, delay: i * 0.05 }}
                    className="flex-1 bg-linear-to-t from-orange-600/80 to-orange-400/20 rounded-t-lg"
                  ></motion.div>
                ))}
              </div>
            </motion.div>

            {/* Team Performance Card */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-slate-900/50 rounded-3xl border border-white/10 p-10 hover:border-blue-500/50 transition-all duration-500"
            >
              <div className="flex items-center gap-5 mb-12 text-white">
                <div className="p-4 bg-blue-500/20 rounded-2xl">
                  <BarChart3 className="text-blue-500 h-10 w-10" />
                </div>
                <h3 className="font-black text-heading-1 tracking-tight">Team Performance</h3>
              </div>
              <div className="space-y-8">
                {[
                  { name: "Engineering", val: 92, color: "bg-blue-500" },
                  { name: "Product Design", val: 78, color: "bg-blue-400" },
                  { name: "Marketing", val: 64, color: "bg-blue-300" },
                ].map((item, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex justify-between text-heading-3 font-bold text-slate-300">
                      <span>{item.name}</span>
                      <span>{item.val}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.val}%` }}
                        transition={{ duration: 1.5, delay: 0.5 + (i * 0.2) }}
                        className={`h-full ${item.color} rounded-full`}
                      ></motion.div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Corporate Growth Card */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-slate-900/50 rounded-3xl border border-white/10 p-10 hover:border-emerald-500/50 transition-all duration-500"
            >
              <div className="flex items-center gap-5 mb-10 text-white">
                <div className="p-4 bg-emerald-500/20 rounded-2xl">
                  <LineChart className="text-emerald-500 h-10 w-10" />
                </div>
                <h3 className="font-black text-heading-1 tracking-tight">Enterprise Growth</h3>
              </div>
              <div className="relative h-48 w-full mt-12">
                 <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <motion.path
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                      d="M0,80 Q20,70 40,50 T80,20 T100,10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-emerald-500"
                    />
                    <motion.path
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 0.2 }}
                      transition={{ delay: 1 }}
                      d="M0,80 Q20,70 40,50 T80,20 T100,10 L100,100 L0,100 Z"
                      fill="currentColor"
                      className="text-emerald-500"
                    />
                 </svg>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-5xl font-black text-white">+342%</div>
                 </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}


