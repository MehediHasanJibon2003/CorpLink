import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../context/ThemeContext";
import {
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Building2,
  Lock,
  ArrowLeft,
} from "lucide-react";

function ForgotPassword() {
  const { branding } = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: window.location.origin + "/reset-password",
        }
      );

      if (resetError) {
        setError(resetError.message);
      } else {
        setMessage(
          "We've sent a password reset link to your email address. Please check your inbox."
        );
        setEmail("");
      }
    } catch (err) {
      console.error("Password reset error:", err);
      setError("An unexpected error occurred: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page-root h-screen w-screen flex bg-white dark:bg-slate-950 overflow-hidden">
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
            <Lock className="h-4 w-4 text-blue-400" />
            <span className="text-white/90 text-label font-semibold tracking-wide uppercase">
              Security Portal
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-6 tracking-tight">
            Recover your
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-orange-400">
              credentials.
            </span>
          </h1>
          <p className="text-slate-300 text-body leading-relaxed mb-12 max-w-lg">
            Follow the automated instructions sent to your registered email to safely regain access to your corporate workspace.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-slate-500 text-label">
          <span>© 2026 {branding.platform_name || "CorpLink"}</span>
          <span>•</span>
          <span>Enterprise-grade security</span>
        </div>
      </div>

      {/* ── Right Panel: Reset Form ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-white dark:bg-slate-950 overflow-y-auto">
        <div className="lg:hidden mb-8">
          <Link to="/" className="flex items-center gap-3 justify-center">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center font-black text-white text-heading-3 shadow-lg overflow-hidden">
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
            <span className="text-heading-1 font-black text-slate-900 dark:text-white">
              {branding.platform_name || "CorpLink"}
            </span>
          </Link>
        </div>

        <div className="w-full max-w-xl">
          <div className="mb-10">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-body font-bold text-blue-600 mb-6 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Sign In
            </Link>
            <h2 className="text-heading-1 lg:text-[2rem] font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
              Reset password
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-body">
              Enter your email and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-5">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-5 py-5 border-[3px] border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl outline-none focus:border-blue-500 transition-all text-heading-2 font-bold"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl flex items-center gap-2 text-red-700 dark:text-red-400 font-bold">
                <AlertCircle className="h-5 w-5 shrink-0" /> {error}
              </div>
            )}

            {message && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold animate-in fade-in duration-300">
                <CheckCircle className="h-5 w-5 shrink-0" /> {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white py-5 rounded-2xl font-black text-heading-2 shadow-xl shadow-blue-600/20 mt-6 hover:bg-blue-700 active:scale-[0.99] transition-all cursor-pointer"
            >
              {loading ? "Sending link..." : "Send Request"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
