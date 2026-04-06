export default function Testimonials() {
  const testimonials = [
    {
      body: "CorpLink replaced five different software packages we were paying for. It’s exactly what our SME needed to finally establish a mature corporate structure.",
      author: {
        name: "Sarah Jenkins",
        handle: "@sarah_tech",
        role: "Operations Director, TechFlow",
      },
    },
    {
      body: "The task management combined with role-based access control means I can finally delegate without losing oversight. A game changer for executive management.",
      author: {
        name: "David Chen",
        handle: "@davidchenX",
        role: "CEO, Innovate Corp",
      },
    },
    {
      body: "The B2B networking feature allowed us to connect seamlessly with our primary vendors. Everything stays inside the corporate ecosystem.",
      author: {
        name: "Emily R.",
        handle: "@emrob_HR",
        role: "VP of HR, GlobalLink",
      },
    },
  ];

  return (
    <div className="bg-slate-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-xl text-center mb-16">
          <h2 className="text-lg font-semibold leading-8 tracking-tight text-orange-600">Testimonials</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Trusted by modern enterprises
          </p>
        </div>
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-8 text-sm leading-6 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div key={testimonial.author.handle} className="rounded-3xl bg-white shadow-sm border border-slate-100 p-8 transform hover:scale-105 transition duration-300">
              <figure className="h-full flex flex-col justify-between">
                <blockquote className="text-slate-700 italic">
                  <p>“{testimonial.body}”</p>
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-x-4">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
                    {testimonial.author.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{testimonial.author.name}</div>
                    <div className="text-slate-500 text-xs">{testimonial.author.role}</div>
                  </div>
                </figcaption>
              </figure>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
