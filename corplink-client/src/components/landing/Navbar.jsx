import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
      className={`fixed inset-x-0 top-0 z-50 w-full transition-all duration-500 ${
        scrolled 
          ? "py-4 bg-slate-950/80 backdrop-blur-2xl border-b border-white/10 shadow-2xl" 
          : "py-10 bg-transparent"
      }`}
      style={{ paddingInline: "clamp(2rem, 6vw, 6vw)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-1">
          <Link
            to="/"
            className="flex items-center gap-5 hover:opacity-80 transition group"
          >
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="w-16 h-16 rounded-2xl bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center font-black text-white shadow-2xl shadow-orange-500/40 text-4xl"
            >
              C
            </motion.div>
            <span className="text-4xl font-black tracking-tighter text-white">
              CorpLink<span className="text-orange-500">.</span>
            </span>
          </Link>
        </div>

        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-xl p-3 text-slate-300 hover:bg-white/5 transition"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {mobileMenuOpen ? (
              <X className="h-9 w-9" />
            ) : (
              <Menu className="h-9 w-9" />
            )}
          </button>
        </div>

        <div className="hidden lg:flex lg:gap-x-12 lg:items-center">
          {[
            { label: "Features", href: "#features" },
            { label: "How it Works", href: "#how-it-works" },
            { label: "Security", href: "#security" },
            { label: "Reviews", href: "#reviews" },
            { label: "Pricing", href: "#pricing" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-lg font-bold leading-7 text-slate-300 hover:text-orange-500 transition-colors duration-300 relative group"
            >
              {item.label}
              <span className="absolute -bottom-2 left-0 w-0 h-1 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
            </a>
          ))}
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-10">
          <Link
            to="/login"
            className="text-xl font-bold leading-7 text-slate-300 hover:text-white transition"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="group inline-flex items-center gap-3 text-xl font-black bg-orange-500 hover:bg-orange-400 text-white px-10 py-5 rounded-2xl shadow-2xl shadow-orange-500/20 transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
          >
            Sign up <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden mt-4 p-8 bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl"
          >
            <div className="flex flex-col gap-6">
              {[
                { label: "Features", href: "#features" },
                { label: "How it Works", href: "#how-it-works" },
                { label: "Security", href: "#security" },
                { label: "Reviews", href: "#reviews" },
                { label: "Pricing", href: "#pricing" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-2xl font-bold text-slate-300 hover:text-orange-500 transition-colors py-2 border-b border-white/5"
                >
                  {item.label}
                </a>
              ))}
              <div className="flex flex-col gap-4 pt-4">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center text-2xl font-bold text-white py-4 rounded-2xl border border-white/10 hover:bg-white/5 transition"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center text-2xl font-black text-white bg-orange-500 hover:bg-orange-400 py-4 rounded-2xl transition shadow-xl shadow-orange-500/20"
                >
                  Sign up →
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

