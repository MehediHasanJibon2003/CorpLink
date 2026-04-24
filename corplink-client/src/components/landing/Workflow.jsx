import { CheckCircle2 } from "lucide-react";

export default function Workflow() {
  const steps = [
    {
      title: "Create your corporate workspace",
      description:
        "Sign up and set up your company profile in under 2 minutes.",
    },
    {
      title: "Add employees & departments",
      description:
        "Bulk invite your team and structure them into functional departments.",
    },
    {
      title: "Manage tasks & projects",
      description:
        "Deploy workflows instantly. Track deadlines, assignees, and progress.",
    },
    {
      title: "Connect & Grow",
      description:
        "Collaborate seamlessly through the corporate feed and messaging system.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="w-full bg-slate-50 overflow-hidden"
      style={{ padding: "6rem clamp(2rem, 6vw, 6vw)" }}
    >
      <div className="w-full">
        <div
          className="text-center mb-16 mx-auto"
          style={{ maxWidth: "800px" }}
        >
          <h2
            style={{ fontSize: "clamp(2rem, 3.5vw, 3.2rem)" }}
            className="font-bold tracking-tight text-slate-900 mb-3"
          >
            From zero to enterprise in 4 steps
          </h2>
          <p
            style={{ fontSize: "clamp(1rem, 1.25vw, 1.125rem)" }}
            className="leading-relaxed text-slate-600"
          >
            No expensive deployment consultants. No months-long onboarding. Move
            your company to the cloud today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
          {steps.map((step, idx) => (
            <div key={idx} className="relative">
              {idx !== steps.length - 1 && (
                <div className="hidden lg:block absolute top-6 left-1/2 w-full h-0.5 bg-slate-200"></div>
              )}
              <div className="relative flex flex-col items-center text-center z-10">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center border-4 border-slate-50 mb-4 shadow-sm">
                  <span className="text-orange-600 font-bold text-lg">
                    {idx + 1}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
