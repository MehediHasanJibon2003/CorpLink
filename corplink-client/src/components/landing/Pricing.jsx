import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const tiers = [
  {
    name: "Basic",
    id: "tier-basic",
    href: "/register",
    priceMonthly: "$0",
    description: "The essentials to get small teams coordinated.",
    features: [
      "Up to 10 employees",
      "Basic Task Management",
      "Community Feed",
      "Standard Support",
    ],
    mostPopular: false,
  },
  {
    name: "Standard",
    id: "tier-standard",
    href: "/register",
    priceMonthly: "$49",
    description: "A comprehensive platform for growing mid-size organizations.",
    features: [
      "Up to 100 employees",
      "Advanced Kanban & Tasks",
      "Corporate Collaboration",
      "Role-Based Access Control",
      "Email & Chat Support",
    ],
    mostPopular: true,
  },
  {
    name: "Enterprise",
    id: "tier-enterprise",
    href: "/register",
    priceMonthly: "Custom",
    description: "Dedicated resources and absolute control for large corporations.",
    features: [
      "Unlimited employees",
      "B2B Networking & Vendors",
      "Advanced Analytics & Reports",
      "Dedicated Account Manager",
      "Custom Integrations",
      "24/7 Phone Support",
    ],
    mostPopular: false,
  },
];

export default function Pricing() {
  return (
    <div className="bg-slate-50 py-24 sm:py-32" id="pricing">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-orange-600">Pricing</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Scale your workspace without scaling costs
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-slate-600">
          Choose the plan that fits your corporate needs. Upgrade, downgrade, or cancel at any time.
        </p>

        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 xl:gap-x-12">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-3xl p-8 ring-1 ring-slate-200 xl:p-10 bg-white shadow-sm transition-transform hover:-translate-y-1 ${
                tier.mostPopular ? "ring-2 ring-orange-500 shadow-xl relative" : ""
              }`}
            >
              {tier.mostPopular && (
                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                  <span className="bg-orange-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-x-4">
                <h3 className={`text-lg font-semibold leading-8 ${tier.mostPopular ? 'text-orange-600' : 'text-slate-900'}`}>
                  {tier.name}
                </h3>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">{tier.description}</p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-slate-900">{tier.priceMonthly}</span>
                {tier.priceMonthly !== "Custom" && <span className="text-sm font-semibold leading-6 text-slate-600">/mo</span>}
              </p>
              <Link
                to={tier.href}
                className={`mt-6 block rounded-xl px-3 py-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-full ${
                  tier.mostPopular
                    ? "bg-orange-500 text-white hover:bg-orange-400 shadow-sm focus-visible:outline-orange-500"
                    : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                }`}
              >
                Get started
              </Link>
              <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-slate-600">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <Check className="h-6 w-5 flex-none text-orange-500" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
