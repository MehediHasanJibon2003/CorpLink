import { CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Workflow() {
  const steps = [
    {
      title: "Establish Identity",
      description:
        "Initialize your secure corporate instance in under 120 seconds.",
    },
    {
      title: "Map Organization",
      description:
        "Define departments, hierarchy, and bulk-sync your global workforce.",
    },
    {
      title: "Deploy Workflows",
      description:
        "Launch mission-critical projects and track real-time task velocity.",
    },
    {
      title: "Infinite Scale",
      description:
        "Leverage unified data to grow your enterprise without friction.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="w-full bg-slate-950 overflow-hidden relative"
      style={{ padding: "10rem clamp(2rem, 6vw, 6vw)" }}
    >
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-orange-500/5 to-transparent pointer-events-none"></div>

      <div className="w-full relative z-10">
        <div
          className="text-center mb-32 mx-auto"
          style={{ maxWidth: "1200px" }}
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ fontSize: "clamp(3.5rem, 6vw, 6.5rem)" }}
            className="font-black tracking-tight text-white mb-10 leading-tight"
          >
            Enterprise Velocity. <br /> <span className="text-orange-500">Simplified Deployment.</span>
          </motion.h2>
          <p
            style={{ fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)" }}
            className="leading-relaxed text-slate-400 max-w-5xl mx-auto font-medium"
          >
            No consultants. No legacy bottlenecks. Seamlessly migrate your entire 
            organization to the future of work.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-16 w-full">
          {steps.map((step, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              className="relative group"
            >
              {idx !== steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-full h-[2px] bg-linear-to-r from-orange-500/50 to-transparent"></div>
              )}
              <div className="relative flex flex-col items-center text-center z-10">
                <div className="w-24 h-24 rounded-[2rem] bg-orange-500/10 flex items-center justify-center border border-orange-500/20 mb-8 shadow-2xl shadow-orange-500/5 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500">
                  <span className="font-black text-4xl text-orange-500 group-hover:text-white">
                    0{idx + 1}
                  </span>
                </div>
                <h3 className="text-3xl font-black text-white mb-6 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-xl text-slate-400 leading-relaxed font-medium">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

