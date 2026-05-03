import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Building2,
  BarChart3,
  Users,
  CheckCircle,
  Zap,
} from "lucide-react";

const FEATURES = [
  {
    icon: Building2,
    title: "Enterprise Management",
    desc: "Full control over departments, teams & roles",
  },
  {
    icon: Users,
    title: "Workforce Collaboration",
    desc: "Connect employees across the entire organization",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    desc: "Track performance and productivity at a glance",
  },
  {
    icon: Zap,
    title: "Instant Sync",
    desc: "Live updates across all devices and users",
  },
];

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    const { email, password } = formData;
    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      if (!data?.user) {
        setError("Login failed");
        setLoading(false);
        return;
      }
      try {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("company_id, role")
          .eq("id", data.user.id)
          .single();

        // Log activity for non-super-admins
        if (userProfile?.company_id) {
          await supabase.from("activity_logs").insert([
            {
              company_id: userProfile.company_id,
              user_id: data.user.id,
              action: "System Login",
              entity: "auth",
              severity: "info",
              status: "success",
            },
          ]);
        }

        // Role-based redirect
        if (userProfile?.role === "super_admin") {
          navigate("/super-admin");
          return;
        }

        const ADMIN_ROLES = ["admin", "corporate_admin", "hr"];
        if (ADMIN_ROLES.includes(userProfile?.role)) {
          navigate("/dashboard");
        } else {
          navigate("/employee/dashboard");
        }
      } catch (err) {
        console.error("Failed to log auth:", err);
        // Fallback
        navigate("/employee/dashboard");
      }
    } catch (err) {
      console.error("Login catch error:", err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex bg-white dark:bg-slate-950 overflow-hidden">
      {/* ── Left Panel: Branding ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[45%] 2xl:w-1/2 relative overflow-hidden bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 flex-col justify-between p-12 xl:p-16 2xl:p-24">
        {/* Background grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Glow orbs */}
        <div className="absolute top-10 right-10 w-[24rem] h-[24rem] lg:w-[32rem] lg:h-[32rem] bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-72 h-72 lg:w-96 lg:h-96 bg-orange-500/10 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-5 w-fit">
            <div className="w-16 h-16 rounded-3xl bg-orange-500 flex items-center justify-center font-black text-white text-3xl shadow-xl shadow-orange-500/30">
              C
            </div>
            <span className="text-4xl font-black text-white tracking-tight">
              CorpLink
            </span>
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10 mt-16 xl:mt-24 mb-auto">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-6 py-2.5 mb-10">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/90 text-lg font-semibold tracking-wide">
              Enterprise Platform
            </span>
          </div>
          <h1 className="text-[4.5rem] lg:text-[5.5rem] font-black text-white leading-[1.1] mb-8 tracking-tight">
            One platform.
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-orange-400">
              Every team.
            </span>
          </h1>
          <p className="text-slate-300 text-2xl leading-relaxed mb-16 max-w-2xl">
            Manage your entire organization — departments, teams, tasks, and
            communication — from a single unified workspace.
          </p>

          <div className="grid grid-cols-1 gap-10 md:gap-12">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="flex items-center gap-8 group">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-white/10 border-2 border-white/10 flex items-center justify-center shrink-0 group-hover:bg-blue-600/30 group-hover:scale-110 transition-all duration-300">
                    <Icon className="h-10 w-10 md:h-12 md:w-12 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-black text-2xl md:text-3xl tracking-tight">
                      {f.title}
                    </p>
                    <p className="text-slate-400 text-lg md:text-xl font-medium mt-1">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-4 text-slate-500 text-xs">
          <span>© 2025 CorpLink</span>
          <span>•</span>
          <span>Enterprise-grade security</span>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-emerald-400">SOC 2 Compliant</span>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Login Form ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-white dark:bg-slate-950 overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link to="/" className="flex items-center gap-3 justify-center">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center font-black text-white text-lg shadow-lg">
              C
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              CorpLink
            </span>
          </Link>
        </div>

        <div className="w-full max-w-xl">
          {/* Header */}
          <div className="mb-12">
            <h2 className="text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
              Welcome back
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xl">
              Sign in to your corporate workspace
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-4">
              <label className="block text-xl md:text-2xl font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest px-2">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-8 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 pointer-events-none"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="name@enterprise.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-20 pr-8 py-8 md:py-10 border-[4px] border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 rounded-3xl md:rounded-[2.5rem] outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-8 focus:ring-blue-500/5 transition-all text-2xl md:text-3xl font-black shadow-inner"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-lg font-bold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Link to="/forgot-password" className="text-base font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400 pointer-events-none"
                  style={{ width: "24px", height: "24px" }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-14 pr-16 py-5 border-[3px] border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 rounded-2xl outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/10 transition-all text-xl font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? (
                    <EyeOff style={{ width: "24px", height: "24px" }} />
                  ) : (
                    <Eye style={{ width: "24px", height: "24px" }} />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="remember" 
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:ring-offset-slate-900"
              />
              <label htmlFor="remember" className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Remember me for 30 days
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 rounded-xl">
                <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                  <span className="text-white text-[10px] font-bold">!</span>
                </div>
                <p className="text-red-700 dark:text-red-400 text-sm font-medium">
                  {error}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white py-8 md:py-10 rounded-3xl md:rounded-[2.5rem] font-black text-2xl md:text-4xl transition-all shadow-2xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-1 active:translate-y-0 mt-10 tracking-tight"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Authenticating...
                </>
              ) : (
                <>
                  Secure Sign In <ArrowRight className="h-8 w-8" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-slate-950 px-3 text-xs text-slate-400 font-medium">
                New to CorpLink?
              </span>
            </div>
          </div>

          <Link
            to="/register"
            className="w-full flex items-center justify-center gap-3 py-5 border-[3px] border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all text-lg mt-6"
          >
            Create your workspace <ArrowRight className="h-4 w-4" />
          </Link>

          <p className="text-center text-xs text-slate-400 mt-6">
            By signing in, you agree to CorpLink's{" "}
            <Link to="/terms" className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
