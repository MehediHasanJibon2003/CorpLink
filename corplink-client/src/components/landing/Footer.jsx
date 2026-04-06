import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-slate-950" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/30">
                C
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white leading-none">CorpLink</h2>
            </div>
            <p className="text-sm leading-6 text-slate-400">
              The unified corporate ecosystem that powers the world's most capable teams.
            </p>
            <div className="flex space-x-6">
              {/* Social Icons would go here */}
            </div>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">Solutions</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li><a href="#" className="text-sm leading-6 text-slate-400 hover:text-white">Workspace Admin</a></li>
                  <li><a href="#" className="text-sm leading-6 text-slate-400 hover:text-white">Employee Engagement</a></li>
                  <li><a href="#" className="text-sm leading-6 text-slate-400 hover:text-white">Task Analytics</a></li>
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-white">Support</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li><a href="#" className="text-sm leading-6 text-slate-400 hover:text-white">Pricing</a></li>
                  <li><a href="#" className="text-sm leading-6 text-slate-400 hover:text-white">Documentation</a></li>
                  <li><a href="#" className="text-sm leading-6 text-slate-400 hover:text-white">Guides</a></li>
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">Company</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li><a href="#" className="text-sm leading-6 text-slate-400 hover:text-white">About</a></li>
                  <li><a href="#" className="text-sm leading-6 text-slate-400 hover:text-white">Blog</a></li>
                  <li><a href="#" className="text-sm leading-6 text-slate-400 hover:text-white">Jobs</a></li>
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-white">Legal</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li><a href="#" className="text-sm leading-6 text-slate-400 hover:text-white">Privacy</a></li>
                  <li><a href="#" className="text-sm leading-6 text-slate-400 hover:text-white">Terms</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-white/10 pt-8 sm:mt-20 lg:mt-24">
          <p className="text-xs leading-5 text-slate-400">&copy; {new Date().getFullYear()} CorpLink Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
