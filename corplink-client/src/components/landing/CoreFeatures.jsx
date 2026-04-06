import { Users, CheckSquare, MessageCircle, BarChart3, Network, Columns3 } from "lucide-react";

export default function CoreFeatures() {
  const features = [
    {
      name: "Employee Management",
      description: "Maintain comprehensive profiles, track designations, and organize teams efficiently without the spreadsheet chaos.",
      icon: Users,
    },
    {
      name: "Task & Project Tracking",
      description: "Assign responsibilities, monitor real-time progress, and never miss a deadline with dynamic Kanban and list views.",
      icon: CheckSquare,
    },
    {
      name: "Corporate Collaboration",
      description: "Unite teams around shared goals. Share files securely and brainstorm seamlessly across departments.",
      icon: Network,
    },
    {
      name: "Smart Messaging System",
      description: "Instant peer-to-peer and group communication without leaving the workspace. Secure and fast.",
      icon: MessageCircle,
    },
    {
      name: "Role-Based Access Control",
      description: "Granular permissions ensure employees only see what they need to, protecting sensitive corporate data.",
      icon: Columns3,
    },
    {
      name: "Analytics Dashboard",
      description: "Beautiful visual metrics and automated reports give leadership instant insight into organizational performance.",
      icon: BarChart3,
    },
  ];

  return (
    <div className="bg-white py-24 sm:py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-orange-600">Unified Architecture</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Everything your company needs
          </p>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            CorpLink combines the structural rigidity of an ERP with the fluid user experience of modern collaborative SaaS.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.name} className="relative pl-16 group">
                  <dt className="text-lg font-semibold leading-7 text-slate-900">
                    <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 group-hover:bg-orange-500 transition-colors">
                      <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-slate-600">
                    {feature.description}
                  </dd>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
