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
    description:
      "Dedicated resources and absolute control for large corporations.",
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
    <section
      id="pricing"
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
            Scale your workspace without scaling costs
          </h2>
          <p
            style={{ fontSize: "clamp(1rem, 1.25vw, 1.125rem)" }}
            className="leading-relaxed text-slate-400"
          >
            Choose the plan that fits your corporate needs. Upgrade, downgrade,
            or cancel at any time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-xl p-6 ring-1 ring-slate-200 bg-white shadow-sm transition-all hover:shadow-md ${
                tier.mostPopular
                  ? "ring-2 ring-orange-500 shadow-xl relative"
                  : ""
              }`}
            >
              {tier.mostPopular && (
                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                  <span className="bg-orange-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3
                  className={`text-base font-semibold leading-6 ${tier.mostPopular ? "text-orange-600" : "text-slate-900"}`}
                >
                  {tier.name}
                </h3>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                {tier.description}
              </p>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-slate-900">
                  {tier.priceMonthly}
                </span>
                {tier.priceMonthly !== "Custom" && (
                  <span className="text-xs font-semibold leading-5 text-slate-600">
                    /mo
                  </span>
                )}
              </p>
              <Link
                to={tier.href}
                className={`mt-5 block rounded-lg px-3 py-2 text-center text-xs font-semibold leading-5 focus-visible:outline-2 focus-visible:outline-offset-2 w-full transition-colors ${
                  tier.mostPopular
                    ? "bg-orange-500 text-white hover:bg-orange-400 shadow-sm focus-visible:outline-orange-500"
                    : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                }`}
              >
                Get started
              </Link>
              <ul
                role="list"
                className="mt-5 space-y-2 text-xs leading-5 text-slate-600"
              >
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <Check
                      className="h-6 w-5 flex-none text-orange-500"
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
