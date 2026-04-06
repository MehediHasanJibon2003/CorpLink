import { ShieldCheck, Server, Lock, Layers } from "lucide-react";

export default function Security() {
  const securityFeatures = [
    { title: "Multi-tenant Architecture", icon: Layers, desc: "Total isolation of your corporate data in shared cloud environments." },
    { title: "Role-Based Access Control", icon: ShieldCheck, desc: "Strict granular permissions across admin, manager, HR, and employees." },
    { title: "Cloud Infrastructure", icon: Server, desc: "Powered by Supabase and scalable cloud databases for 99.9% uptime." },
    { title: "Secure Authentication", icon: Lock, desc: "Enterprise-grade credential handling and session management." },
  ];

  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Bank-grade security. <br/> Built for enterprise scale.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {securityFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.title} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col items-center text-center">
                <Icon className="h-10 w-10 text-orange-500 mb-4" />
                <h3 className="font-bold text-slate-900 mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-600">{feat.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
