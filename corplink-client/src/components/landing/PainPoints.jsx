import { PieChart, Grid, SlidersHorizontal, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

export default function PainPoints() {
  const painPoints = [
    {
      icon: Grid,
      title: "Fragmented Silos",
      description:
        "Teams bounce between dozens of disconnected apps, losing critical context and thousands of productive hours.",
    },
    {
      icon: PieChart,
      title: "Opaque Intelligence",
      description:
        "Data exists in isolation. Leadership lacks real-time insight into corporate velocity and employee engagement.",
    },
    {
      icon: SlidersHorizontal,
      title: "Deployment Friction",
      description:
        "Legacy ERP systems take months to initialize, demanding expensive consultants and outdated infrastructure.",
    },
    {
      icon: DollarSign,
      title: "Extortionate Costs",
      description:
        "Traditional enterprise software drains capital through maintenance fees and per-user licensing traps.",
    },
  ];

  return (
    <section
      className="w-full bg-slate-950 overflow-hidden relative"
      style={{ padding: "clamp(5rem, 15vw, 10rem) clamp(1rem, 5vw, 6vw)" }}
    >
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-orange-500/5 to-transparent pointer-events-none"></div>

      <div className="w-full relative z-10">
        <div
          className="text-center mb-16 md:mb-32 mx-auto"
          style={{ maxWidth: "1200px" }}
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ fontSize: "clamp(2rem, 6vw, 6.5rem)" }}
            className="font-black tracking-tight text-white leading-[1.1] md:leading-tight"
          >
            Why Legacy Systems <br className="hidden md:block" /> are <span className="text-orange-500">Failing</span> the Modern Enterprise.
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 w-full">
          {painPoints.map((point, idx) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -10 }}
                className="flex flex-col bg-white/5 rounded-3xl md:rounded-[2.5rem] p-8 md:p-12 border border-white/10 hover:bg-white/10 hover:border-orange-500/30 transition-all duration-300 backdrop-blur-xl"
              >
                <div className="h-14 w-14 md:h-20 md:w-20 flex items-center justify-center rounded-2xl md:rounded-3xl bg-orange-500/10 text-orange-500 mb-6 md:mb-8 border border-orange-500/20">
                  <Icon className="h-7 w-7 md:h-10 md:w-10" aria-hidden="true" />
                </div>
                <h3 className="text-heading-2 md:text-heading-1 font-black text-white mb-4 md:mb-6 tracking-tight">
                  {point.title}
                </h3>
                <p className="text-body md:text-heading-2 leading-relaxed text-slate-400 font-medium">
                  {point.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


