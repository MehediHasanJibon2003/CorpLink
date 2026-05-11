import {
  Users,
  CheckSquare,
  MessageCircle,
  BarChart3,
  Network,
  ShieldAlert,
  BellRing,
  History,
  Globe,
} from "lucide-react";
import { motion } from "framer-motion";

export default function CoreFeatures() {
  const features = [
    {
      name: "Workforce Architecture",
      description:
        "Define complex organizational structures with departments, teams, and dynamic reporting lines.",
      icon: Users,
      color: "bg-orange-500",
    },
    {
      name: "Strategic Tasking",
      description:
        "Enterprise-grade Kanban and Gantt tracking with automated priority escalation and resource mapping.",
      icon: CheckSquare,
      color: "bg-blue-500",
    },
    {
      name: "Global Announcements",
      description:
        "Instantly broadcast mission-critical updates across the entire organization with read-receipt tracking.",
      icon: BellRing,
      color: "bg-emerald-500",
    },
    {
      name: "Secure Communication",
      description:
        "End-to-end encrypted messaging for teams and departments. Instant, secure, and fully archived.",
      icon: MessageCircle,
      color: "bg-purple-500",
    },
    {
      name: "Real-time Auditing",
      description:
        "Every action is logged. Complete transparency with system-wide activity logs and security auditing.",
      icon: History,
      color: "bg-pink-500",
    },
    {
      name: "Predictive Analytics",
      description:
        "Leverage organizational data to predict project delays and employee performance trends.",
      icon: BarChart3,
      color: "bg-cyan-500",
    },
    {
      name: "Threat Management",
      description:
        "Advanced security protocols monitor for unusual activity, protecting your corporate IP 24/7.",
      icon: ShieldAlert,
      color: "bg-red-500",
    },
    {
      name: "Inter-Corporate Hub",
      description:
        "Seamlessly collaborate with external partners while maintaining total data sovereignty.",
      icon: Globe,
      color: "bg-indigo-500",
    },
    {
      name: "Neural Networking",
      description:
        "An internal corporate feed that fosters engagement and builds a unified company culture.",
      icon: Network,
      color: "bg-amber-500",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section
      id="features"
      className="w-full bg-slate-950 relative overflow-hidden text-white"
      style={{ padding: "10rem clamp(2rem, 6vw, 6vw)" }}
    >
      <div className="absolute inset-0 bg-linear-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none"></div>

      <div className="relative z-10 w-full">
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
            The Operating System <br /> for <span className="text-orange-500">Modern Industry.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)" }}
            className="leading-relaxed text-slate-400 max-w-4xl mx-auto font-medium"
          >
            Built on a multi-tenant cloud architecture, CorpLink provides the security 
            and scale required by global enterprises.
          </motion.p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 w-full"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div 
                key={feature.name} 
                variants={itemVariants}
                whileHover={{ y: -10 }}
                className="relative pl-28 group"
              >
                <dt className="text-3xl font-black leading-tight text-white mb-4">
                  <div className={`absolute left-0 top-0 flex h-20 w-20 items-center justify-center rounded-[1.5rem] ${feature.color} shadow-2xl shadow-${feature.color.split('-')[1]}-500/30 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-10 w-10 text-white" aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="text-xl leading-relaxed text-slate-400 font-medium">
                  {feature.description}
                </dd>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

