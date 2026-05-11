import { Check, ArrowRight, Zap, Building, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function Pricing() {
  const tiers = [
    {
      name: "Standard",
      price: "0",
      description: "Ideal for small teams and startups looking for basic structure.",
      features: [
        "Up to 20 Employees",
        "Basic Task Management",
        "Internal Messaging",
        "Shared Corporate Feed",
        "Role-Based Access",
      ],
      icon: Zap,
      color: "from-blue-500 to-blue-700",
    },
    {
      name: "Enterprise",
      price: "199",
      description: "Advanced controls and analytics for growing organizations.",
      features: [
        "Unlimited Employees",
        "Advanced Analytics",
        "Department Management",
        "Priority Support",
        "Custom Workflows",
        "Security Auditing",
      ],
      icon: Building,
      color: "from-orange-500 to-orange-700",
      popular: true,
    },
    {
      name: "Global Scale",
      price: "999",
      description: "Custom solutions for multi-national corporations.",
      features: [
        "Multi-Tenant Isolation",
        "External Partner Hub",
        "Neural Performance AI",
        "24/7 Dedicated Support",
        "On-Premise Deployment",
        "SLA Guarantee",
      ],
      icon: Crown,
      color: "from-purple-500 to-purple-700",
    },
  ];

  return (
    <section
      id="pricing"
      className="w-full bg-slate-950 relative overflow-hidden"
      style={{ padding: "10rem clamp(2rem, 6vw, 6vw)" }}
    >
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-purple-500/5 to-transparent pointer-events-none"></div>

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
            Scale at the speed of <br /> <span className="text-orange-500">Innovation.</span>
          </motion.h2>
          <p
            style={{ fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)" }}
            className="leading-relaxed text-slate-400 max-w-5xl mx-auto font-medium"
          >
            Flexible plans designed to grow with your organization. 
            No hidden fees. Total transparency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full">
          {tiers.map((tier, idx) => {
            const Icon = tier.icon;
            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className={`relative bg-white/5 border border-white/10 p-12 rounded-[3rem] backdrop-blur-2xl flex flex-col hover:border-white/20 transition-all duration-500 ${
                  tier.popular ? "ring-2 ring-orange-500 shadow-2xl shadow-orange-500/10" : ""
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-8 py-2 rounded-full text-lg font-black uppercase tracking-widest">
                    Most Popular
                  </div>
                )}
                <div className={`p-5 rounded-3xl bg-linear-to-br ${tier.color} w-fit mb-10 shadow-2xl`}>
                  <Icon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-3xl font-black text-white mb-4 tracking-tight">
                  {tier.name}
                </h3>
                <div className="flex items-baseline gap-2 mb-6 text-white">
                  <span className="text-5xl font-black">${tier.price}</span>
                  <span className="text-xl text-slate-400 font-bold">/month</span>
                </div>
                <p className="text-xl text-slate-400 mb-10 font-medium leading-relaxed">
                  {tier.description}
                </p>
                <div className="space-y-6 mb-12 flex-1">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-4 text-slate-300 font-bold text-lg">
                      <div className="p-1 rounded-full bg-emerald-500/20">
                        <Check className="h-5 w-5 text-emerald-500" />
                      </div>
                      {feature}
                    </div>
                  ))}
                </div>
                <Link
                  to="/register"
                  className={`w-full py-6 rounded-2xl text-2xl font-black text-center transition-all duration-300 transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 ${
                    tier.popular 
                      ? "bg-orange-500 text-white shadow-2xl shadow-orange-500/40 hover:bg-orange-400" 
                      : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                  }`}
                >
                  Choose {tier.name} <ArrowRight className="h-6 w-6" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

