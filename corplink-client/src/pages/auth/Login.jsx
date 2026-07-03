import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../context/ThemeContext";
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
  AlertCircle,
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
  const { branding } = useTheme();
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
      const { error: signInError, data } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      // --- SECURITY LOGGING START ---
      const cleanEmail = email.trim().toLowerCase();
      await supabase.from("login_attempts").insert([
        {
          email: cleanEmail,
          status: signInError ? "failed" : "success",
        },
      ]);
      // --- SECURITY LOGGING END ---

      if (signInError) {
        // Log the failed attempt via RPC
        await supabase.rpc('record_failed_login', { user_email: cleanEmail });

        if ((signInError.message || "").toLowerCase().includes("blocked")) {
          setError("This account is blocked due to security reasons.");
        } else {
          setError("Invalid email or password: " + signInError.message);
        }
        setLoading(false);
        return;
      }

      // Login success, reset the counter
      await supabase.rpc('reset_failed_login', { user_email: cleanEmail });

      try {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("company_id, role, is_blocked")
          .eq("id", data.user.id)
          .single();

        if (userProfile?.is_blocked) {
          await supabase.auth.signOut();
          setError(
            "This account is currently blocked. Please contact a Super Admin.",
          );
          setLoading(false);
          return;
        }

        // Check if company is suspended
        if (userProfile?.company_id) {
          const { data: companyData } = await supabase
            .from("companies")
            .select("status")
            .eq("id", userProfile.company_id)
            .single();
            
          if (companyData?.status === 'suspended') {
            await supabase.auth.signOut();
            setError(
              "Your company has been temporarily blocked due to multiple failed login attempts. Please contact a Super Admin."
            );
            setLoading(false);
            return;
          }
        }

        if (userProfile?.role === "super_admin") {
          navigate("/super-admin");
          return;
        }

        const ADMIN_ROLES = ["admin", "corporate_admin", "hr", "manager", "dept_head", "team_lead"];
        if (ADMIN_ROLES.includes(userProfile?.role)) {
          navigate("/dashboard");
        } else {
          navigate("/employee/dashboard");
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        navigate("/employee/dashboard");
      }
    } catch (err) {
      console.error("Critical Login Error:", err);
      setError("An unexpected error occurred: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-root h-screen w-screen flex bg-white dark:bg-slate-950 overflow-hidden">
      {/* ── Left Panel: Branding ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[45%] 2xl:w-1/2 relative overflow-hidden bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 flex-col justify-between p-12 xl:p-16 2xl:p-24">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-10 right-10 w-[24rem] h-[24rem] lg:w-[32rem] lg:h-[32rem] bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-72 h-72 lg:w-96 lg:h-96 bg-orange-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-4 w-fit">
            <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center font-black text-white text-heading-3 shadow-xl shadow-orange-500/30 overflow-hidden">
              {branding.logo_url ? (
                <img
                  src={branding.logo_url}
                  className="w-full h-full object-cover"
                  alt="Logo"
                />
              ) : (
                "C"
              )}
            </div>
            <span className="text-heading-3 font-black text-white tracking-tight uppercase">
              {branding.platform_name || "CorpLink"}
            </span>
          </Link>
        </div>

        <div className="relative z-10 mt-16 xl:mt-24 mb-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-6">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/90 text-label font-semibold tracking-wide uppercase">
              Enterprise Platform
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-6 tracking-tight">
            One platform.
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-orange-400">
              Every team.
            </span>
          </h1>
          <p className="text-slate-300 text-body leading-relaxed mb-12 max-w-lg">
            Manage your entire organization — departments, teams, tasks, and
            communication — from a single unified workspace.
          </p>

          <div className="grid grid-cols-1 gap-6 md:gap-8">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="flex items-center gap-5 group">
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-blue-600/30 group-hover:scale-110 transition-all duration-300">
                    <Icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-heading-3 tracking-tight">
                      {f.title}
                    </p>
                    <p className="text-slate-400 text-label font-medium mt-0.5">
                      {f.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-slate-500 text-label">
          <span>© 2026 {branding.platform_name || "CorpLink"}</span>
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
        <div className="lg:hidden mb-8">
          <Link to="/" className="flex items-center gap-3 justify-center">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center font-black text-white text-heading-3 shadow-lg overflow-hidden">
              {branding.logo_url ? (
                <img
                  src={branding.logo_url}
                  className="w-full h-full object-cover"
                />
              ) : (
                "C"
              )}
            </div>
            <span className="text-heading-1 font-black text-slate-900 dark:text-white">
              {branding.platform_name || "CorpLink"}
            </span>
          </Link>
        </div>

        <div className="w-full max-w-xl">
          <div className="mb-10">
            <h2 className="text-heading-1 lg:text-[2rem] font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
              Welcome back
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-body">
              Sign in to your corporate workspace
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-3">
              <label className="block text-heading-3 font-bold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-14 pr-5 py-5 border-[3px] border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl outline-none focus:border-blue-500 transition-all text-heading-2 font-bold"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-heading-3 font-bold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  title="Coming soon"
                  className="text-body font-bold text-blue-600"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-14 pr-16 py-5 border-[3px] border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl outline-none focus:border-blue-500 transition-all text-heading-2 font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 font-bold">
                <AlertCircle className="h-5 w-5" /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-[#2563eb] text-white py-5 rounded-2xl font-black text-heading-2 shadow-xl shadow-[#2563eb]/20 mt-6"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <Link
            to="/register"
            className="w-full flex items-center justify-center gap-3 py-5 border-[3px] border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-300 mt-6"
          >
            Create your workspace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
