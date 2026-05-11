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
      style={{ padding: "10rem clamp(2rem, 6vw, 6vw)" }}
    >
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-orange-500/5 to-transparent pointer-events-none"></div>

      <div className="w-full relative z-10">
        <div
          className="text-center mb-32 mx-auto"
          style={{ maxWidth: "1200px" }}
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ fontSize: "clamp(3.5rem, 6vw, 6.5rem)" }}
            className="font-black tracking-tight text-white mb-6 leading-tight"
          >
            Trusted by the <br /> <span className="text-orange-500">Global Elite.</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 w-full">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={testimonial.author.handle}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              whileHover={{ y: -10 }}
              className="rounded-[3rem] bg-white/5 border border-white/10 p-12 backdrop-blur-xl flex flex-col hover:bg-white/10 hover:border-white/20 transition-all duration-500"
            >
              <figure className="h-full flex flex-col justify-between">
                <blockquote className="text-slate-300 text-2xl font-medium leading-relaxed mb-12 italic">
                  <p>"{testimonial.body}"</p>
                </blockquote>
                <figcaption className="flex items-center gap-6 pt-10 border-t border-white/10">
                  <div className="h-16 w-16 flex items-center justify-center rounded-2xl bg-orange-500 text-white font-black border border-white/10 shrink-0 text-2xl shadow-2xl shadow-orange-500/40">
                    {testimonial.author.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-black text-white text-xl tracking-tight">
                      {testimonial.author.name}
                    </div>
                    <div className="text-slate-500 text-base font-bold uppercase tracking-widest mt-1">
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

