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
    <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? "bg-slate-900/90 backdrop-blur-md border-b border-white/10 py-3" : "bg-transparent py-5"}`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex lg:flex-1">
            <Link to="/" className="-m-1.5 p-1.5 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/30">
                C
              </div>
              <span className="text-xl font-bold tracking-tight text-white">CorpLink</span>
            </Link>
          </div>
          
          <div className="flex lg:hidden">
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-slate-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
          
          <div className="hidden lg:flex lg:gap-x-12">
            <a href="#features" className="text-sm font-semibold leading-6 text-slate-300 hover:text-white transition">Features</a>
            <a href="#how-it-works" className="text-sm font-semibold leading-6 text-slate-300 hover:text-white transition">How it Works</a>
            <a href="#pricing" className="text-sm font-semibold leading-6 text-slate-300 hover:text-white transition">Pricing</a>
          </div>
          
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-6">
            <Link to="/login" className="text-sm font-semibold leading-6 text-slate-300 hover:text-white transition">
              Log in
            </Link>
            <Link to="/register" className="text-sm font-bold leading-6 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 transition">
              Sign up <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
