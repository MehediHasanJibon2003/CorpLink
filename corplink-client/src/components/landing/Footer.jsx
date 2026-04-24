import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      className="w-full bg-slate-950"
      aria-labelledby="footer-heading"
      style={{ padding: "4rem clamp(2rem, 6vw, 6vw)" }}
    >
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/30">
                C
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white leading-none">
                CorpLink
              </h2>
            </div>
            <p className="text-xs leading-5 text-slate-400">
              The unified corporate ecosystem that powers the world's most
              capable teams.
            </p>
            <div className="flex space-x-6">
              {/* Social Icons would go here */}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 md:col-span-2">
            <div>
              <h3 className="text-xs font-semibold leading-5 text-white uppercase tracking-wider">
                Solutions
              </h3>
              <ul role="list" className="mt-4 space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-xs leading-5 text-slate-400 hover:text-white transition"
                  >
                    Workspace Admin
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-xs leading-5 text-slate-400 hover:text-white transition"
                  >
                    Employee Engagement
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-xs leading-5 text-slate-400 hover:text-white transition"
                  >
                    Task Analytics
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold leading-5 text-white uppercase tracking-wider">
                Support
              </h3>
              <ul role="list" className="mt-4 space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-xs leading-5 text-slate-400 hover:text-white transition"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-xs leading-5 text-slate-400 hover:text-white transition"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-xs leading-5 text-slate-400 hover:text-white transition"
                  >
                    Guides
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold leading-5 text-white uppercase tracking-wider">
                Company
              </h3>
              <ul role="list" className="mt-4 space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-xs leading-5 text-slate-400 hover:text-white transition"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-xs leading-5 text-slate-400 hover:text-white transition"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-xs leading-5 text-slate-400 hover:text-white transition"
                  >
                    Jobs
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold leading-5 text-white uppercase tracking-wider">
                Legal
              </h3>
              <ul role="list" className="mt-4 space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-xs leading-5 text-slate-400 hover:text-white transition"
                  >
                    Privacy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-xs leading-5 text-slate-400 hover:text-white transition"
                  >
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8">
          <p className="text-xs leading-4 text-slate-400">
            &copy; {new Date().getFullYear()} CorpLink Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
