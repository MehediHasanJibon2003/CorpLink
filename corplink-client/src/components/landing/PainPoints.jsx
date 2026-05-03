import { PieChart, Grid, SlidersHorizontal, DollarSign } from "lucide-react";

export default function PainPoints() {
  const painPoints = [
    {
      icon: Grid,
      title: "Fragmented Tools",
      description:
        "Teams bounce between 5 different apps just to manage a single project, losing context and hours of productivity.",
    },
    {
      icon: PieChart,
      title: "Poor Collaboration",
      description:
        "Data exists in isolated silos. Marketing doesn't know what Development is doing, and HR is caught in the middle.",
    },
    {
      icon: SlidersHorizontal,
      title: "Lack of Visibility",
      description:
        "Leadership has zero real-time insight into corporate performance without spending days generating manual reports.",
    },
    {
      icon: DollarSign,
      title: "Expensive ERPs",
      description:
        "Legacy systems cost hundreds of thousands of dollars to deploy, demand certified consultants, and look like they were built in 1999.",
    },
  ];

  return (
    <section
      className="w-full bg-slate-50 overflow-hidden"
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
            Why modern businesses are slowing down
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
          {painPoints.map((point) => {
            const Icon = point.icon;
            return (
              <div
                key={point.title}
                className="flex flex-col bg-white rounded-3xl p-10 shadow-sm border border-slate-200 hover:shadow-xl transition-shadow duration-300"
              >
                <dt className="flex items-center gap-4 text-2xl font-bold leading-8 text-slate-900 mb-6">
                  <div className="h-16 w-16 flex items-center justify-center rounded-2xl bg-orange-50 text-orange-600 shrink-0">
                    <Icon className="h-8 w-8" aria-hidden="true" />
                  </div>
                  {point.title}
                </dt>
                <dd className="flex flex-auto flex-col text-xl leading-relaxed text-slate-600">
                  <p className="flex-auto">{point.description}</p>
                </dd>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
