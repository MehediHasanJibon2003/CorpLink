import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      className="w-full bg-slate-950"
      aria-labelledby="footer-heading"
      style={{ padding: "8rem clamp(2rem, 6vw, 6vw) 4rem" }}
    >
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 mb-16">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center font-black text-white shadow-xl shadow-orange-500/30 text-2xl">
                C
              </div>
              <h2 className="text-4xl font-black tracking-tight text-white leading-none">
                CorpLink
              </h2>
            </div>
            <p className="text-xl leading-relaxed text-slate-400">
              The unified corporate ecosystem that powers the world's most
              capable teams.
            </p>
            <div className="flex space-x-6">
              {/* Social Icons would go here */}
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:col-span-2">
            <div>
              <h3 className="text-base font-bold leading-6 text-white uppercase tracking-wider mb-6">
                Solutions
              </h3>
              <ul role="list" className="space-y-4">
                <li>
                  <a
                    href="#"
                    className="text-lg leading-6 text-slate-400 hover:text-white transition"
                  >
                    Workspace Admin
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-lg leading-6 text-slate-400 hover:text-white transition"
                  >
                    Employee Engagement
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-lg leading-6 text-slate-400 hover:text-white transition"
                  >
                    Task Analytics
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-base font-bold leading-6 text-white uppercase tracking-wider mb-6">
                Support
              </h3>
              <ul role="list" className="space-y-4">
                <li>
                  <a
                    href="#"
                    className="text-lg leading-6 text-slate-400 hover:text-white transition"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-lg leading-6 text-slate-400 hover:text-white transition"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-lg leading-6 text-slate-400 hover:text-white transition"
                  >
                    Guides
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-base font-bold leading-6 text-white uppercase tracking-wider mb-6">
                Company
              </h3>
              <ul role="list" className="space-y-4">
                <li>
                  <a
                    href="#"
                    className="text-lg leading-6 text-slate-400 hover:text-white transition"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-lg leading-6 text-slate-400 hover:text-white transition"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-lg leading-6 text-slate-400 hover:text-white transition"
                  >
                    Jobs
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-base font-bold leading-6 text-white uppercase tracking-wider mb-6">
                Legal
              </h3>
              <ul role="list" className="space-y-4">
                <li>
                  <a
                    href="#"
                    className="text-lg leading-6 text-slate-400 hover:text-white transition"
                  >
                    Privacy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-lg leading-6 text-slate-400 hover:text-white transition"
                  >
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-10">
          <p className="text-lg leading-6 text-slate-400 text-center lg:text-left">
            &copy; {new Date().getFullYear()} CorpLink Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
