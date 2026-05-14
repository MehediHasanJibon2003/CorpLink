import { ShieldCheck, Server, Lock, Layers } from "lucide-react";
import { motion } from "framer-motion";

export default function Security() {
  const securityFeatures = [
    {
      title: "Data Sovereignty",
      icon: Layers,
      desc: "Multi-tenant isolation ensures your corporate data remains strictly partitioned and private.",
    },
    {
      title: "Granular RBAC",
      icon: ShieldCheck,
      desc: "Military-grade access controls from Super Admin to general staff with audit logging.",
    },
    {
      title: "Quantum-Ready Infra",
      icon: Server,
      desc: "Distributed cloud infrastructure with 99.99% uptime and instant failover protection.",
    },
    {
      title: "Encrypted Auth",
      icon: Lock,
      desc: "Sophisticated session management and end-to-end encryption for all sensitive operations.",
    },
  ];

  return (
    <section
      className="w-full bg-slate-950 overflow-hidden relative"
      id="security"
      style={{ padding: "10rem clamp(2rem, 6vw, 6vw)" }}
    >
      <div className="absolute inset-0 bg-linear-to-t from-orange-500/5 to-transparent pointer-events-none"></div>
      
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
            className="font-black tracking-tight text-white leading-tight"
          >
            Bank-grade Security. <br /> <span className="text-orange-500">Zero Compromise.</span>
          </motion.h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 w-full">
          {securityFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -10 }}
                className="bg-white/5 p-12 rounded-[2.5rem] border border-white/10 flex flex-col items-center text-center backdrop-blur-xl hover:bg-white/10 hover:border-orange-500/30 transition-all duration-300"
              >
                <div className="p-5 bg-orange-500/20 rounded-3xl mb-8">
                  <Icon className="h-14 w-14 text-orange-500" />
                </div>
                <h3 className="font-black text-white mb-6 text-heading-1 tracking-tight">
                  {feat.title}
                </h3>
                <p className="text-heading-2 text-slate-400 leading-relaxed font-medium">
                  {feat.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


