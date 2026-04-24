import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 w-full transition-all duration-300 ${scrolled ? "bg-slate-900/90 backdrop-blur-md border-b border-white/10" : "bg-transparent"}`}
      style={{ padding: "1.5rem clamp(2rem, 6vw, 6vw)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-1">
          <Link
            to="/"
            className="flex items-center gap-3 hover:opacity-80 transition"
          >
            <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/30 text-lg">
              C
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              CorpLink
            </span>
          </Link>
        </div>

        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-slate-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        <div className="hidden lg:flex lg:gap-x-12 lg:items-center">
          <a
            href="#features"
            className="text-lg font-semibold leading-7 text-slate-300 hover:text-white transition"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-lg font-semibold leading-7 text-slate-300 hover:text-white transition"
          >
            How it Works
          </a>
          <a
            href="#pricing"
            className="text-lg font-semibold leading-7 text-slate-300 hover:text-white transition"
          >
            Pricing
          </a>
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-10">
          <Link
            to="/login"
            className="text-lg font-semibold leading-7 text-slate-300 hover:text-white transition"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="text-lg font-bold leading-7 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl backdrop-blur-sm border border-white/10 transition duration-200"
          >
            Sign up <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
