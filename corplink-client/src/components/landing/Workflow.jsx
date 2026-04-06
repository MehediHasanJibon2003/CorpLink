import { CheckCircle2 } from "lucide-react";

export default function Workflow() {
  const steps = [
    {
      title: "Create your corporate workspace",
      description: "Sign up and set up your company profile in under 2 minutes."
    },
    {
      title: "Add employees & departments",
      description: "Bulk invite your team and structure them into functional departments."
    },
    {
      title: "Manage tasks & projects",
      description: "Deploy workflows instantly. Track deadlines, assignees, and progress."
    },
    {
      title: "Connect & Grow",
      description: "Collaborate seamlessly through the corporate feed and messaging system."
    }
  ];

  return (
    <div className="bg-slate-50 py-24 sm:py-32" id="how-it-works">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-orange-600">Workflow</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            From zero to enterprise in 4 steps
          </p>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            No expensive deployment consultants. No months-long onboarding. Move your company to the cloud today.
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            {steps.map((step, idx) => (
              <div key={idx} className="relative">
                {idx !== steps.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-1/2 w-full h-[2px] bg-slate-200"></div>
                )}
                <div className="relative flex flex-col items-center text-center z-10">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center border-4 border-slate-50 mb-4 shadow-sm">
                    <span className="text-orange-600 font-bold text-lg">{idx + 1}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
