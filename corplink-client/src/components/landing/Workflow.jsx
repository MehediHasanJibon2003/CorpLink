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
          className="text-center mb-24 mx-auto"
          style={{ maxWidth: "1200px" }}
        >
          <h2
            style={{ fontSize: "clamp(3.5rem, 5vw, 5rem)" }}
            className="font-bold tracking-tight text-slate-900 mb-6"
          >
            From zero to enterprise in 4 steps
          </h2>
          <p
            style={{ fontSize: "clamp(1.5rem, 2vw, 2rem)" }}
            className="leading-relaxed text-slate-600 max-w-4xl mx-auto"
          >
            No expensive deployment consultants. No months-long onboarding. Move
            your company to the cloud today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 w-full">
          {steps.map((step, idx) => (
            <div key={idx} className="relative">
              {idx !== steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-1/2 w-full h-1 bg-slate-200"></div>
              )}
              <div className="relative flex flex-col items-center text-center z-10">
                <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center border-8 border-slate-50 mb-6 shadow-sm">
                  <span className="text-orange-600 font-bold text-3xl">
                    {idx + 1}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  {step.title}
                </h3>
                <p className="text-xl text-slate-600 leading-relaxed">
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
