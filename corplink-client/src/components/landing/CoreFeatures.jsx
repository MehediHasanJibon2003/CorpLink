import {
  Users,
  CheckSquare,
  MessageCircle,
  BarChart3,
  Network,
  Columns3,
} from "lucide-react";

export default function CoreFeatures() {
  const features = [
    {
      name: "Employee Management",
      description:
        "Maintain comprehensive profiles, track designations, and organize teams efficiently without the spreadsheet chaos.",
      icon: Users,
    },
    {
      name: "Task & Project Tracking",
      description:
        "Assign responsibilities, monitor real-time progress, and never miss a deadline with dynamic Kanban and list views.",
      icon: CheckSquare,
    },
    {
      name: "Corporate Collaboration",
      description:
        "Unite teams around shared goals. Share files securely and brainstorm seamlessly across departments.",
      icon: Network,
    },
    {
      name: "Smart Messaging System",
      description:
        "Instant peer-to-peer and group communication without leaving the workspace. Secure and fast.",
      icon: MessageCircle,
    },
    {
      name: "Role-Based Access Control",
      description:
        "Granular permissions ensure employees only see what they need to, protecting sensitive corporate data.",
      icon: Columns3,
    },
    {
      name: "Analytics Dashboard",
      description:
        "Beautiful visual metrics and automated reports give leadership instant insight into organizational performance.",
      icon: BarChart3,
    },
  ];

  return (
    <section
      id="features"
      className="w-full bg-slate-900 relative overflow-hidden text-white"
      style={{ padding: "6rem clamp(2rem, 6vw, 6vw)" }}
    >
      <div className="absolute inset-0 bg-linear-to-br from-orange-500/5 to-transparent pointer-events-none"></div>

      <div className="relative z-10 w-full">
        <div
          className="text-center mb-16 mx-auto"
          style={{ maxWidth: "800px" }}
        >
          <h2
            style={{ fontSize: "clamp(2rem, 3.5vw, 3.2rem)" }}
            className="font-bold tracking-tight text-white mb-3"
          >
            Everything your company needs
          </h2>
          <p
            style={{ fontSize: "clamp(1rem, 1.25vw, 1.125rem)" }}
            className="leading-relaxed text-slate-400"
          >
            CorpLink combines the structural rigidity of an ERP with the fluid
            user experience of modern collaborative SaaS.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.name} className="relative pl-16 group">
                <dt className="text-lg font-semibold leading-7 text-white">
                  <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 group-hover:bg-orange-400 transition-colors">
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
    </section>
  );
}
