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
      style={{ padding: "clamp(5rem, 15vw, 10rem) clamp(1rem, 5vw, 6vw)" }}
    >
      <div className="absolute inset-0 bg-linear-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none"></div>

      <div className="relative z-10 w-full">
        <div
          className="text-center mb-16 md:mb-32 mx-auto"
          style={{ maxWidth: "1200px" }}
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ fontSize: "clamp(2rem, 6vw, 6.5rem)" }}
            className="font-black tracking-tight text-white mb-6 md:mb-10 leading-[1.1] md:leading-tight"
          >
            The Operating System <br className="hidden md:block" /> for <span className="text-orange-500">Modern Industry.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            style={{ fontSize: "clamp(1.1rem, 2.5vw, 2rem)" }}
            className="leading-relaxed text-slate-400 max-w-4xl mx-auto font-medium px-4 md:px-0"
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16 w-full px-4 md:px-0"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div 
                key={feature.name} 
                variants={itemVariants}
                whileHover={{ y: -10 }}
                className="relative group flex flex-col items-center text-center md:items-start md:text-left md:pl-28"
              >
                <dt className="text-heading-2 md:text-heading-1 font-black leading-tight text-white mb-4 flex flex-col items-center md:items-start">
                  <div className={`relative md:absolute md:left-0 md:top-0 flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-2xl md:rounded-[1.5rem] ${feature.color} shadow-2xl shadow-${feature.color.split('-')[1]}-500/30 group-hover:scale-110 transition-transform duration-300 mb-5 md:mb-0`}>
                    <Icon className="h-8 w-8 md:h-10 md:w-10 text-white" aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="text-body md:text-heading-2 leading-relaxed text-slate-400 font-medium max-w-sm md:max-w-none">
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


