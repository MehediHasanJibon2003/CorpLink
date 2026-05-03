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
            className="flex items-center gap-4 hover:opacity-80 transition"
          >
            <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center font-black text-white shadow-xl shadow-orange-500/30 text-3xl">
              C
            </div>
            <span className="text-4xl font-black tracking-tight text-white">
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
              <X className="h-8 w-8" />
            ) : (
              <Menu className="h-8 w-8" />
            )}
          </button>
        </div>

        <div className="hidden lg:flex lg:gap-x-14 lg:items-center">
          <a
            href="#features"
            className="text-2xl font-bold leading-7 text-slate-300 hover:text-white transition"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-2xl font-bold leading-7 text-slate-300 hover:text-white transition"
          >
            How it Works
          </a>
          <a
            href="#pricing"
            className="text-2xl font-bold leading-7 text-slate-300 hover:text-white transition"
          >
            Pricing
          </a>
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-12">
          <Link
            to="/login"
            className="text-2xl font-bold leading-7 text-slate-300 hover:text-white transition"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="text-2xl font-bold leading-7 bg-white/10 hover:bg-white/20 text-white px-10 py-5 rounded-2xl backdrop-blur-sm border border-white/10 transition duration-200"
          >
            Sign up <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
