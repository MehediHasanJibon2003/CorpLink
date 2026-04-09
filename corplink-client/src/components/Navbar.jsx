import { Link } from "react-router-dom";

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-700/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-200">
            C
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              CorpLink
            </h1>
            <p className="text-xs text-slate-500">Unified Corporate Platform</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600"
          >
            Features
          </a>
          <a
            href="#overview"
            className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600"
          >
            Overview
          </a>
          <a
            href="#contact"
            className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600"
          >
            Contact
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:border-blue-200 hover:text-blue-600"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
