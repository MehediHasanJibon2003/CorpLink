import { Globe, Link2, Code2, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer
      className="w-full bg-slate-950 border-t border-white/5"
      aria-labelledby="footer-heading"
    >
      <h2 id="footer-heading" className="sr-only">Footer</h2>

      {/* Main Footer Content */}
      <div
        className="w-full"
        style={{ padding: "8rem clamp(2rem, 6vw, 6vw) 6rem" }}
      >
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-20">
          {/* Brand Column */}
          <div className="xl:col-span-1 space-y-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center font-black text-white shadow-2xl shadow-orange-500/30 text-heading-1">
                C
              </div>
              <h2 className="text-heading-1 font-black tracking-tighter text-white leading-none">
                CorpLink<span className="text-orange-500">.</span>
              </h2>
            </div>
            <p className="text-heading-2 leading-relaxed text-slate-400 font-medium">
              The definitive operating system for the modern enterprise.
              Built for scale, secured by intelligence.
            </p>
            <div className="flex space-x-5">
              {[Globe, Link2, Code2].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-orange-500 hover:border-orange-500/50 transition-all duration-300"
                >
                  <Icon className="h-6 w-6" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="xl:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-12">
            <div>
              <h3 className="text-body font-black text-white uppercase tracking-widest mb-8">
                Solutions
              </h3>
              <ul className="space-y-5">
                {["Workforce Admin", "Task Velocity", "Audit Intelligence", "Corporate Social"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-body font-semibold text-slate-400 hover:text-white transition duration-300">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-body font-black text-white uppercase tracking-widest mb-8">
                Resources
              </h3>
              <ul className="space-y-5">
                {["Documentation", "API Reference", "Enterprise SLA", "Compliance"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-body font-semibold text-slate-400 hover:text-white transition duration-300">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-body font-black text-white uppercase tracking-widest mb-8">
                Company
              </h3>
              <ul className="space-y-5">
                {["About CorpLink", "Security Labs", "Careers", "Newsroom"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-body font-semibold text-slate-400 hover:text-white transition duration-300">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-body font-black text-white uppercase tracking-widest mb-8">
                Connect
              </h3>
              <div className="space-y-5">
                <div className="flex items-center gap-3 text-slate-400 font-semibold text-body">
                  <Mail className="h-5 w-5 text-orange-500 shrink-0" />
                  corplink.dev@gmail.com
                </div>
                <div className="flex items-center gap-3 text-slate-400 font-semibold text-body">
                  <MapPin className="h-5 w-5 text-orange-500 shrink-0" />
                  Dhaka, Bangladesh
                </div>
                <div className="flex items-center gap-3 text-slate-400 font-semibold text-body">
                  <Phone className="h-5 w-5 text-orange-500 shrink-0" />
                  +8801794320858
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar — full width, centered */}
      <div className="w-full border-t border-white/5 py-8">
        <p className="text-body font-semibold text-slate-500 text-center">
          &copy; {new Date().getFullYear()} CorpLink Enterprise Systems Inc.
          &nbsp;·&nbsp;
          <a href="#" className="hover:text-white transition">Privacy Policy</a>
          &nbsp;·&nbsp;
          <a href="#" className="hover:text-white transition">Terms of Service</a>
          &nbsp;·&nbsp;
          <a href="#" className="hover:text-white transition">Cookie Policy</a>
        </p>
      </div>
    </footer>
  );
}

