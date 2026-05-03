import { Link } from "react-router-dom";
import { ArrowRight, Play, CheckCircle } from "lucide-react";

export default function Hero() {
  return (
    <div
      className="relative w-full min-h-screen overflow-hidden bg-slate-900 text-white pt-32"
      style={{ padding: "clamp(2rem, 10vw, 10vw) clamp(2rem, 6vw, 6vw)" }}
    >
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-linear-to-b from-orange-500/40 via-orange-500/5 to-transparent blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 mb-10 backdrop-blur-md">
          <span className="flex h-3 w-3 rounded-full bg-orange-500"></span>
          <span className="text-lg font-medium text-slate-300">
            CorpLink v2.0 is now live
          </span>
        </div>

        <h1
          style={{ fontSize: "clamp(4rem, 8vw, 7.5rem)" }}
          className="font-extrabold tracking-tight mb-8 leading-[1.1] max-w-7xl"
        >
          Unified Corporate Solutions. <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-orange-600">
            Unlimited Possibilities.
          </span>
        </h1>

        <p
          style={{ fontSize: "clamp(1.5rem, 2vw, 2rem)" }}
          className="text-slate-400 leading-relaxed mb-12 max-w-5xl"
        >
          Manage employees, tasks, collaboration, and corporate networking in
          one powerful cloud platform. Say goodbye to fragmented tools and
          expensive ERPs.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
          <Link
            to="/register"
            className="inline-flex justify-center items-center gap-3 rounded-2xl bg-orange-500 px-10 py-5 text-xl font-bold text-white shadow-sm hover:bg-orange-400 transition transform hover:-translate-y-0.5"
          >
            Get Started <ArrowRight className="h-6 w-6" />
          </Link>
          <a
            href="#demo"
            className="inline-flex justify-center items-center gap-3 rounded-2xl bg-white/5 px-10 py-5 text-xl font-bold text-white hover:bg-white/10 ring-1 ring-inset ring-white/10 transition"
          >
            <Play className="h-6 w-6" /> Request Demo
          </a>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-lg text-slate-400">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-orange-500" /> No credit card
            required
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-orange-500" /> 14-day free
            trial
          </div>
        </div>
      </div>

      {/* Dashboard Mockup Glow Box */}
      <div
        className="relative w-full mt-16 sm:mt-24"
        style={{ maxWidth: "calc(85vw)" }}
      >
        <div
          style={{ margin: "4rem auto 0" }}
          className="rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm shadow-2xl shadow-orange-500/10 ring-1 ring-white/10"
        >
          <div className="rounded-2xl overflow-hidden bg-slate-800 aspect-video flex items-center justify-center border border-slate-700/50 relative">
            {/* Minimal Mockup Representation */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-orange-500/20 flex items-center justify-center mb-6 backdrop-blur-md">
                <Play className="h-12 w-12 text-orange-500 ml-2" />
              </div>
              <p className="text-white font-bold text-2xl">
                See CorpLink in action
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
