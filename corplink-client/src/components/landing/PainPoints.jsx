import { PieChart, Grid, SlidersHorizontal, DollarSign } from "lucide-react";

export default function PainPoints() {
  const painPoints = [
    {
      icon: Grid,
      title: "Fragmented Tools",
      description: "Teams bounce between 5 different apps just to manage a single project, losing context and hours of productivity."
    },
    {
      icon: PieChart,
      title: "Poor Collaboration",
      description: "Data exists in isolated silos. Marketing doesn't know what Development is doing, and HR is caught in the middle."
    },
    {
      icon: SlidersHorizontal,
      title: "Lack of Visibility",
      description: "Leadership has zero real-time insight into corporate performance without spending days generating manual reports."
    },
    {
      icon: DollarSign,
      title: "Expensive ERPs",
      description: "Legacy systems cost hundreds of thousands of dollars to deploy, demand certified consultants, and look like they were built in 1999."
    }
  ];

  return (
    <section className="bg-slate-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-orange-600">The Problem</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Why modern businesses are slowing down
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
            {painPoints.map((point) => {
              const Icon = point.icon;
              return (
                <div key={point.title} className="flex flex-col bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:shadow-lg transition-shadow">
                  <dt className="flex items-center gap-x-3 text-lg font-semibold leading-7 text-slate-900 mb-4">
                    <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-orange-50 text-orange-600 flex-shrink-0">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    {point.title}
                  </dt>
                  <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-slate-600">
                    <p className="flex-auto">{point.description}</p>
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </section>
  );
}
