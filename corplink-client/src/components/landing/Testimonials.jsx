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
    <section
      className="w-full bg-slate-50 overflow-hidden"
      style={{ padding: "6rem clamp(2rem, 6vw, 6vw)" }}
    >
      <div className="w-full">
        <div
          className="text-center mb-24 mx-auto"
          style={{ maxWidth: "1200px" }}
        >
          <p
            style={{ fontSize: "clamp(3.5rem, 5vw, 5rem)" }}
            className="font-bold tracking-tight text-slate-900"
          >
            Trusted by modern enterprises
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 w-full">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.author.handle}
              className="rounded-3xl bg-white shadow-sm border border-slate-200 p-10 transform hover:shadow-xl transition duration-300 flex flex-col"
            >
              <figure className="h-full flex flex-col justify-between">
                <blockquote className="text-slate-700 text-xl leading-relaxed mb-8">
                  <p>"{testimonial.body}"</p>
                </blockquote>
                <figcaption className="flex items-center gap-5 pt-6 border-t border-slate-100">
                  <div className="h-14 w-14 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200 shrink-0 text-xl">
                    {testimonial.author.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-lg">
                      {testimonial.author.name}
                    </div>
                    <div className="text-slate-500 text-sm leading-relaxed mt-1">
                      {testimonial.author.role}
                    </div>
                  </div>
                </figcaption>
              </figure>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
