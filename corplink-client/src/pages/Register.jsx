import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  Mail,
  Lock,
  User,
  Building2,
  Hash,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle,
  Shield,
  Globe,
  Briefcase,
} from "lucide-react";

const CREATE_FEATURES = [
  { icon: Building2, text: "Full admin control over your company workspace" },
  { icon: Globe, text: "Manage departments, teams & employees in one place" },
  { icon: Shield, text: "Role-based access control for every member" },
];

const JOIN_FEATURES = [
  { icon: Briefcase, text: "Access your tasks, projects and workflow" },
  { icon: CheckCircle, text: "Connect with your team and department" },
  { icon: Shield, text: "Secure access protected by your company admin" },
];

function Register() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("create");
  const [formData, setFormData] = useState({
    companyName: "",
    companyId: "",
    fullName: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const { companyName, companyId, fullName, email, password } = formData;

    // Basic validation
    if (!fullName.trim() || !email.trim() || !password) {
      setError("Please fill all required fields");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }
    if (mode === "create" && !companyName.trim()) {
      setError("Company name is required");
      setLoading(false);
      return;
    }
    if (mode === "join" && !companyId.trim()) {
      setError("Company Invite Code is required");
      setLoading(false);
      return;
    }

    try {
      if (mode === "create") {
        // ── CREATE COMPANY FLOW ──────────────────────────────────────────
        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({ email: email.trim(), password });

        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }

        const user = signUpData?.user;
        if (!user) {
          setError("Failed to create account. Please try again.");
          setLoading(false);
          return;
        }

        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .insert([{ name: companyName.trim(), created_by: user.id }])
          .select()
          .single();

        if (companyError) {
          setError("Failed to create company: " + companyError.message);
          setLoading(false);
          return;
        }

        const { error: profileError } = await supabase.from("profiles").insert([{
          id: user.id,
          company_id: companyData.id,
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          role: "corporate_admin",
        }]);

        if (profileError && profileError.code !== "23505") {
          setError("Profile setup failed: " + profileError.message);
          setLoading(false);
          return;
        }

        setMessage("Company workspace created! Redirecting to login...");
        setTimeout(() => navigate("/login"), 1800);

      } else {
        // ── JOIN WORKSPACE FLOW ──────────────────────────────────────────
        // NOTE: We sign up the user FIRST because RLS blocks anonymous users
        // from querying the companies/employees tables.
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedCompanyId = companyId.trim();

        // STEP 1: Sign up or sign in the user FIRST (so they become authenticated)
        let authUser = null;

        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({ email: trimmedEmail, password });

        if (signUpError) {
          const errMsg = signUpError.message.toLowerCase();
          if (
            errMsg.includes("already registered") ||
            errMsg.includes("user already exists") ||
            signUpError.status === 400
          ) {
            // User already exists in auth — try signing in
            const { data: signInData, error: signInError } =
              await supabase.auth.signInWithPassword({ email: trimmedEmail, password });

            if (signInError) {
              setError("An account with this email already exists. Check your password or use the login page.");
              setLoading(false);
              return;
            }
            authUser = signInData?.user;
          } else {
            setError(signUpError.message);
            setLoading(false);
            return;
          }
        } else {
          authUser = signUpData?.user;
        }

        if (!authUser) {
          setError("Could not create account. Please try again.");
          setLoading(false);
          return;
        }

        // STEP 2: Now as authenticated user, verify the Company Code
        const { data: cData, error: cErr } = await supabase
          .from("companies")
          .select("id, name, status")
          .eq("id", trimmedCompanyId)
          .maybeSingle();

        if (cErr || !cData) {
          // Sign out and show error
          await supabase.auth.signOut();
          setError("Invalid Company Code. Please check and try again.");
          setLoading(false);
          return;
        }

        if (cData.status === "pending" || cData.status === "rejected") {
          await supabase.auth.signOut();
          setError("This company is not yet approved. Please contact support.");
          setLoading(false);
          return;
        }

        // STEP 3: Insert a temporary profile so RLS allows querying employees table
        const { error: profileTempErr } = await supabase.from("profiles").upsert([{
          id: authUser.id,
          company_id: trimmedCompanyId,
          full_name: fullName.trim(),
          email: trimmedEmail,
          role: "employee",
        }], { onConflict: "id" });

        if (profileTempErr) {
          await supabase.auth.signOut();
          setError("Could not set up your profile: " + profileTempErr.message);
          setLoading(false);
          return;
        }

        // STEP 4: Check if this email exists in the employees table for this company
        const { data: empData, error: empErr } = await supabase
          .from("employees")
          .select("id, name, email, role")
          .eq("email", trimmedEmail)
          .eq("company_id", trimmedCompanyId)
          .maybeSingle();

        if (empErr || !empData) {
          // ROLLBACK: This person is not an authorized employee — delete profile and sign out
          await supabase.from("profiles").delete().eq("id", authUser.id);
          await supabase.auth.signOut();
          setError("Your email is not registered in this company. Ask your HR or Admin to add you first.");
          setLoading(false);
          return;
        }

        // STEP 5: Update profile with correct name and role from employees table
        await supabase.from("profiles").update({
          full_name: empData.name || fullName.trim(),
          role: empData.role || "employee",
        }).eq("id", authUser.id);

        // STEP 6: Mark employee as onboarded in the employees table
        await supabase.from("employees")
          .update({ onboarded: true })
          .eq("id", empData.id);

        // STEP 7: Sign out so they log in fresh with a clean session
        await supabase.auth.signOut();

        setMessage("✅ Account created successfully! Please log in with your email and password.");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      console.error("Register error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const features = mode === "create" ? CREATE_FEATURES : JOIN_FEATURES;

  return (
    <div className="h-screen w-screen flex bg-white dark:bg-slate-950 overflow-hidden">
      {/* ── Left Panel: Branding ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 flex-col justify-between p-12 xl:p-16 2xl:p-24">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-10 right-10 w-[24rem] h-[24rem] lg:w-[32rem] lg:h-[32rem] bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-0 w-72 h-72 lg:w-96 lg:h-96 bg-orange-500/10 rounded-full blur-3xl" />

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
          <div className="mb-10">
            <h2 className="text-[4rem] lg:text-[5rem] font-black text-white leading-[1.1] mb-6 tracking-tight">
              {mode === "create" ? (
                <>
                  Start your
                  <br />
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-orange-400">
                    corporate journey
                  </span>
                </>
              ) : (
                <>
                  Join your
                  <br />
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-orange-400">
                    team today
                  </span>
                </>
              )}
            </h2>
            <p className="text-slate-300 text-2xl leading-relaxed max-w-xl">
              {mode === "create"
                ? "Register your company and become the Corporate Admin. Invite your team and start managing workflows instantly."
                : "Your HR/Admin has already added you. Enter your invite code and join your workspace in seconds."}
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-6">
            {features.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                    <Icon className="h-8 w-8 text-blue-400" />
                  </div>
                  <p className="text-slate-200 text-xl font-medium">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500">
          © 2025 CorpLink Inc. · Enterprise-grade platform
        </div>
      </div>

      {/* ── Right Panel: Form ── */}
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
          <div className="mb-10">
            <h2 className="text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
              Get started
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xl">
              Create your workspace or join an existing one
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl mb-10 gap-1.5">
            <button
              type="button"
              onClick={() => { setMode("create"); setError(""); setMessage(""); }}
              className={`flex-1 flex items-center justify-center gap-3 py-3 text-lg font-bold rounded-xl transition-all ${
                mode === "create"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              }`}
            >
              <Building2 className="h-5 w-5" />
              Create Workspace
            </button>
            <button
              type="button"
              onClick={() => { setMode("join"); setError(""); setMessage(""); }}
              className={`flex-1 flex items-center justify-center gap-3 py-3 text-lg font-bold rounded-xl transition-all ${
                mode === "join"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              }`}
            >
              <Hash className="h-5 w-5" />
              Join via Invite
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Company Name OR Invite Code */}
            {mode === "create" ? (
              <div className="space-y-3">
                <label className="block text-lg font-bold text-slate-700 dark:text-slate-300">
                  Company Name
                </label>
                <div className="relative">
                  <Building2
                    className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400 pointer-events-none"
                    style={{ width: "24px", height: "24px" }}
                  />
                  <input
                    type="text"
                    name="companyName"
                    placeholder="Acme Corp, TechStartup..."
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full pl-14 pr-5 py-5 border-[3px] border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-xl font-bold"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-lg font-bold text-slate-700 dark:text-slate-300">
                  Company Invite Code
                </label>
                <div className="relative">
                  <Hash
                    className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400 pointer-events-none"
                    style={{ width: "24px", height: "24px" }}
                  />
                  <input
                    type="text"
                    name="companyId"
                    placeholder="Paste your company ID here"
                    value={formData.companyId}
                    onChange={handleChange}
                    className="w-full pl-14 pr-5 py-5 border-[3px] border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-xl font-bold"
                  />
                </div>
                <p className="text-sm text-slate-400 ml-1 mt-1">
                  Ask your HR or Admin for the Company ID
                </p>
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-3">
              <label className="block text-lg font-bold text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <div className="relative">
                <User
                  className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400 pointer-events-none"
                  style={{ width: "24px", height: "24px" }}
                />
                <input
                  type="text"
                  name="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-14 pr-5 py-5 border-[3px] border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-xl font-bold"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-3">
              <label className="block text-lg font-bold text-slate-700 dark:text-slate-300">
                Work Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400 pointer-events-none"
                  style={{ width: "24px", height: "24px" }}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-14 pr-5 py-5 border-[3px] border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-xl font-bold"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-3">
              <label className="block text-lg font-bold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400 pointer-events-none"
                  style={{ width: "24px", height: "24px" }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-14 pr-16 py-5 border-[3px] border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-xl font-bold"
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

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 rounded-xl">
                <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-white text-[10px] font-bold">!</span>
                </div>
                <p className="text-red-700 dark:text-red-400 text-sm font-medium">
                  {error}
                </p>
              </div>
            )}

            {/* Success */}
            {message && (
              <div className="flex items-center gap-2 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <p className="text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                  {message}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white py-5 rounded-2xl font-black text-xl transition-all shadow-xl shadow-blue-600/20 hover:shadow-blue-600/30 hover:-translate-y-0.5 active:translate-y-0 mt-6"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  {mode === "create" ? "Create Workspace" : "Join Workspace"}
                  <ArrowRight className="h-6 w-6" />
                </>
              )}
            </button>
          </form>

          {/* Divider + Login link */}
          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-slate-950 px-4 text-base text-slate-400 font-medium">
                Already have an account?
              </span>
            </div>
          </div>

          <Link
            to="/login"
            className="w-full flex items-center justify-center gap-3 py-5 border-[3px] border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all text-lg"
          >
            Sign into your workspace <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
