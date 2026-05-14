import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function CTA() {
  return (
    <section className="w-full py-20 md:py-40 px-4 md:px-8 bg-slate-950 relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-orange-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-[1400px] mx-auto relative z-10"
      >
        <div className="bg-linear-to-br from-orange-500 to-orange-700 rounded-[2.5rem] md:rounded-[4rem] p-10 md:p-32 text-center shadow-2xl shadow-orange-500/20 relative overflow-hidden group">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent group-hover:scale-110 transition-transform duration-1000"></div>
          
          <div className="relative z-10">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8 md:mb-12"
            >
              <Sparkles className="h-4 w-4 md:h-6 md:w-6 text-white fill-white/20" />
              <span className="text-body md:text-heading-2 font-bold text-white tracking-wide">Ready to Scale?</span>
            </motion.div>

            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{ fontSize: "clamp(2rem, 6vw, 7rem)" }}
              className="font-black text-white mb-8 md:mb-10 leading-[1.1] md:leading-[0.95] tracking-tighter"
            >
              Take your enterprise <br className="hidden md:block" /> to the next level.
            </motion.h2>

            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{ fontSize: "clamp(1.1rem, 2vw, 2.2rem)" }}
              className="text-orange-100 mb-10 md:mb-16 max-w-4xl mx-auto font-medium leading-relaxed opacity-90 px-4 md:px-0"
            >
              Join 500+ global organizations that trust CorpLink to manage their workforce, 
              security, and organizational intelligence.
            </motion.p>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 md:gap-8 justify-center px-4 md:px-0"
            >
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-3 md:gap-4 rounded-xl md:rounded-2xl bg-white px-8 md:px-16 py-4 md:py-8 text-heading-3 md:text-heading-1 font-black text-orange-600 hover:bg-orange-50 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 shadow-2xl"
              >
                Create Account <ArrowRight className="h-6 w-6 md:h-8 md:w-8" />
              </Link>
              <a
                href="#pricing"
                className="inline-flex items-center justify-center gap-3 md:gap-4 rounded-xl md:rounded-2xl bg-orange-600/20 backdrop-blur-md border border-white/30 px-8 md:px-16 py-4 md:py-8 text-heading-3 md:text-heading-1 font-black text-white hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
              >
                View Plans
              </a>
            </motion.div>

            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.7 }}
              transition={{ delay: 1 }}
              className="mt-8 md:mt-12 text-white text-badge md:text-heading-3 font-bold tracking-widest uppercase"
            >
              No credit card required • 14-day free trial
            </motion.p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}


