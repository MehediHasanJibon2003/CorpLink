import { ShieldCheck, Server, Lock, Layers } from "lucide-react";

export default function Security() {
  const securityFeatures = [
    {
      title: "Multi-tenant Architecture",
      icon: Layers,
      desc: "Total isolation of your corporate data in shared cloud environments.",
    },
    {
      title: "Role-Based Access Control",
      icon: ShieldCheck,
      desc: "Strict granular permissions across admin, manager, HR, and employees.",
    },
    {
      title: "Cloud Infrastructure",
      icon: Server,
      desc: "Powered by Supabase and scalable cloud databases for 99.9% uptime.",
    },
    {
      title: "Secure Authentication",
      icon: Lock,
      desc: "Enterprise-grade credential handling and session management.",
    },
  ];

  return (
    <section
      className="w-full bg-white overflow-hidden"
      style={{ padding: "6rem clamp(2rem, 6vw, 6vw)" }}
    >
      <div className="w-full">
        <div
          className="text-center mb-24 mx-auto"
          style={{ maxWidth: "1200px" }}
        >
          <h2
            style={{ fontSize: "clamp(3.5rem, 5vw, 5rem)" }}
            className="font-bold tracking-tight text-slate-900"
          >
            Bank-grade security. <br /> Built for enterprise scale.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 w-full">
          {securityFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="bg-slate-50 p-10 rounded-3xl border-2 border-slate-100 flex flex-col items-center text-center hover:shadow-xl transition-shadow"
              >
                <Icon className="h-14 w-14 text-orange-500 mb-6" />
                <h3 className="font-bold text-slate-900 mb-4 text-2xl">
                  {feat.title}
                </h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
