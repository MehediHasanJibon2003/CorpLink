import { Link } from "react-router-dom";
import { ArrowRight, Play, CheckCircle, Users, BarChart3, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <div
      className="relative w-full min-h-screen overflow-hidden bg-slate-950 text-white pt-28 md:pt-40 pb-16 md:pb-20"
      style={{ padding: "clamp(1.5rem, 8vw, 10vw) clamp(1rem, 5vw, 6vw)" }}
    >
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-linear-to-b from-orange-500/30 via-transparent to-transparent blur-[120px]"></div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full flex flex-col items-center text-center"
      >
        <motion.div 
          variants={itemVariants}
          className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 rounded-full bg-white/5 border border-white/10 mb-8 md:mb-12 backdrop-blur-xl shadow-2xl shadow-orange-500/10"
        >
          <span className="flex h-2 w-2 md:h-3 md:w-3 rounded-full bg-orange-500 animate-pulse"></span>
          <span className="text-label md:text-heading-2 font-semibold tracking-wide text-orange-100">
            CorpLink v2.5 Enterprise is now live
          </span>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          style={{ fontSize: "clamp(2.5rem, 8vw, 8.5rem)" }}
          className="font-black tracking-tighter mb-6 md:mb-10 leading-[1.1] md:leading-[0.95] max-w-7xl"
        >
          Unified Corporate <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 via-orange-500 to-orange-700 animate-gradient">
            Intelligence.
          </span>
        </motion.h1>

        <motion.p
          variants={itemVariants}
          style={{ fontSize: "clamp(1.1rem, 2.5vw, 2.2rem)" }}
          className="text-slate-400 leading-relaxed mb-10 md:mb-16 max-w-5xl font-medium px-4 md:px-0"
        >
          Empowering the modern enterprise with a single, seamless ecosystem for 
          workforce management, real-time collaboration, and global analytics.
        </motion.p>

        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 md:gap-8 justify-center mb-12 md:mb-16 w-full sm:w-auto px-4 md:px-0"
        >
          <Link
            to="/register"
            className="group relative inline-flex justify-center items-center gap-3 md:gap-4 rounded-xl md:rounded-2xl bg-orange-500 px-8 md:px-12 py-4 md:py-6 text-heading-3 md:text-heading-1 font-bold text-white shadow-2xl shadow-orange-500/40 hover:bg-orange-400 transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
          >
            Deploy Now <ArrowRight className="h-6 w-6 md:h-7 md:w-7 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#demo"
            className="inline-flex justify-center items-center gap-3 md:gap-4 rounded-xl md:rounded-2xl bg-white/5 px-8 md:px-12 py-4 md:py-6 text-heading-3 md:text-heading-1 font-bold text-white hover:bg-white/10 ring-1 ring-inset ring-white/10 transition-all backdrop-blur-md"
          >
            <Play className="h-6 w-6 md:h-7 md:w-7 text-orange-500 fill-orange-500/20" /> Watch Demo
          </a>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="flex flex-wrap items-center justify-center gap-6 md:gap-12 text-label md:text-heading-2 font-semibold text-slate-500 px-4 md:px-0"
        >
          <div className="flex items-center gap-2 md:gap-3">
            <CheckCircle className="h-5 w-5 md:h-7 md:w-7 text-orange-500" /> Enterprise SLA
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <CheckCircle className="h-5 w-5 md:h-7 md:w-7 text-orange-500" /> ISO 27001 Certified
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <CheckCircle className="h-5 w-5 md:h-7 md:w-7 text-orange-500" /> 24/7 Priority Support
          </div>
        </motion.div>
      </motion.div>

      {/* Floating Decorative Metric Cards */}
      <div className="absolute inset-0 pointer-events-none hidden xl:block">
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[35%] left-[5%] p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-blue-500/20"><Users className="text-blue-400" /></div>
            <div>
              <div className="text-body text-slate-400 font-bold uppercase tracking-widest">Active Employees</div>
              <div className="text-heading-1 font-black text-white">12,480+</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[55%] right-[5%] p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/20"><BarChart3 className="text-emerald-400" /></div>
            <div>
              <div className="text-body text-slate-400 font-bold uppercase tracking-widest">Global Output</div>
              <div className="text-heading-1 font-black text-white">+24.8%</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          animate={{ x: [0, 10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute bottom-[15%] left-[20%] p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-orange-500/20"><Shield className="text-orange-400" /></div>
            <div className="text-heading-3 font-bold text-white">Threat Shield: Active</div>
          </div>
        </motion.div>
      </div>

      {/* Dashboard Mockup */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.5 }}
        className="relative w-full mt-16 md:mt-32 max-w-[1400px] mx-auto px-4 md:px-0"
      >
        <div className="rounded-3xl md:rounded-[2.5rem] border border-white/10 bg-white/5 p-2 md:p-4 backdrop-blur-md shadow-[0_0_100px_rgba(249,115,22,0.15)] ring-1 ring-white/10">
          <div className="rounded-2xl md:rounded-[2rem] overflow-hidden bg-slate-900 aspect-video flex items-center justify-center border border-slate-700/50 relative group">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center opacity-40 mix-blend-overlay group-hover:scale-105 transition-transform duration-1000"></div>
            <div className="relative z-10 flex flex-col items-center p-4">
              <motion.div 
                whileHover={{ scale: 1.1 }}
                className="w-16 h-16 md:w-32 md:h-32 rounded-full bg-orange-500 flex items-center justify-center mb-4 md:mb-8 backdrop-blur-md cursor-pointer shadow-2xl shadow-orange-500/50"
              >
                <Play className="h-8 w-8 md:h-16 md:w-16 text-white ml-1 md:ml-2" fill="currentColor" />
              </motion.div>
              <p className="text-white font-black text-heading-3 md:text-heading-1 tracking-tight text-center">
                The Future of Management. <br className="md:hidden" /> <span className="text-orange-500 underline decoration-2 md:decoration-4 underline-offset-4 md:underline-offset-8">Previewed.</span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


