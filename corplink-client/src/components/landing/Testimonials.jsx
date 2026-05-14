import { motion } from "framer-motion";

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
      className="w-full bg-slate-950 overflow-hidden relative"
      id="reviews"
      style={{ padding: "clamp(5rem, 15vw, 10rem) clamp(1rem, 5vw, 6vw)" }}
    >
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-orange-500/5 to-transparent pointer-events-none"></div>

      <div className="w-full relative z-10">
        <div
          className="text-center mb-16 md:mb-32 mx-auto"
          style={{ maxWidth: "1200px" }}
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ fontSize: "clamp(2.2rem, 6vw, 6.5rem)" }}
            className="font-black tracking-tight text-white mb-6 leading-[1.1] md:leading-tight px-4 md:px-0"
          >
            Trusted by the <br className="hidden md:block" /> <span className="text-orange-500">Global Elite.</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 w-full">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={testimonial.author.handle}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              whileHover={{ y: -10 }}
              className="rounded-3xl md:rounded-[3rem] bg-white/5 border border-white/10 p-8 md:p-12 backdrop-blur-xl flex flex-col hover:bg-white/10 hover:border-white/20 transition-all duration-500"
            >
              <figure className="h-full flex flex-col justify-between">
                <blockquote className="text-slate-300 text-heading-2 md:text-heading-1 font-medium leading-relaxed mb-8 md:mb-12 italic">
                  <p>"{testimonial.body}"</p>
                </blockquote>
                <figcaption className="flex items-center gap-4 md:gap-6 pt-6 md:pt-10 border-t border-white/10">
                  <div className="h-12 w-12 md:h-16 md:w-16 flex items-center justify-center rounded-xl md:rounded-2xl bg-orange-500 text-white font-black border border-white/10 shrink-0 text-heading-3 md:text-heading-1 shadow-2xl shadow-orange-500/40">
                    {testimonial.author.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-black text-white text-heading-3 md:text-heading-2 tracking-tight">
                      {testimonial.author.name}
                    </div>
                    <div className="text-slate-500 text-badge md:text-body font-bold uppercase tracking-widest mt-0.5 md:mt-1">
                      {testimonial.author.role}
                    </div>
                  </div>
                </figcaption>
              </figure>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


