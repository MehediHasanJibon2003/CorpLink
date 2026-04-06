import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import {
  Mail, Lock, User, Building2, Hash,
  ArrowRight, Eye, EyeOff, CheckCircle,
  Shield, Globe, Briefcase
} from "lucide-react"

const CREATE_FEATURES = [
  { icon: Building2, text: "Full admin control over your company workspace" },
  { icon: Globe, text: "Manage departments, teams & employees in one place" },
  { icon: Shield, text: "Role-based access control for every member" },
]

const JOIN_FEATURES = [
  { icon: Briefcase, text: "Access your tasks, projects and workflow" },
  { icon: CheckCircle, text: "Connect with your team and department" },
  { icon: Shield, text: "Secure access protected by your company admin" },
]

function Register() {
  const navigate = useNavigate()
  const [mode, setMode] = useState("create")
  const [formData, setFormData] = useState({
    companyName: "", companyId: "", fullName: "", email: "", password: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true); setError(""); setMessage("")
    const { companyName, companyId, fullName, email, password } = formData

    if (!fullName || !email || !password) {
      setError("Please fill all required fields")
      setLoading(false); return
    }
    if (mode === "create" && !companyName) {
      setError("Company name is required")
      setLoading(false); return
    }
    if (mode === "join" && !companyId) {
      setError("Company ID (Invite Code) is required")
      setLoading(false); return
    }

    try {
      let employeeData = null
      if (mode === "join") {
        const { data: cData, error: cErr } = await supabase
          .from("companies").select("id").eq("id", companyId).single()
        if (cErr || !cData) { setError("Invalid Company Code"); setLoading(false); return }
        const { data: eData } = await supabase
          .from("employees").select("*").eq("email", email).eq("company_id", companyId).single()
        if (!eData) {
          setError("Email not found. Ask your HR/Admin to add you first.")
          setLoading(false); return
        }
        employeeData = eData
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) { setError(signUpError.message); setLoading(false); return }
      const user = signUpData?.user
      if (!user) { setError("Failed to create account."); setLoading(false); return }

      if (mode === "create") {
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .insert([{ name: companyName, created_by: user.id }])
          .select().single()
        if (companyError) { setError(companyError.message); setLoading(false); return }
        await supabase.from("profiles").insert([{
          id: user.id, company_id: companyData.id,
          full_name: fullName, email, role: "corporate_admin"
        }])
      } else {
        await supabase.from("profiles").insert([{
          id: user.id, company_id: companyId,
          full_name: fullName, email, role: employeeData.role
        }])
        await supabase.from("employees").update({ onboarded: true }).eq("id", employeeData.id)
      }

      setMessage("Account created! Redirecting to login...")
      setTimeout(() => { navigate("/login") }, 1400)
    } catch (err) {
      console.error(err)
      setError("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  const features = mode === "create" ? CREATE_FEATURES : JOIN_FEATURES

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950">

      {/* ── Left Panel: Branding ── */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex-col justify-between p-12">
        
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
            backgroundSize: "32px 32px"
          }}
        />
        <div className="absolute top-10 right-10 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 w-fit">
            <div className="w-11 h-11 rounded-xl bg-orange-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-orange-500/30">
              C
            </div>
            <span className="text-2xl font-black text-white tracking-tight">CorpLink</span>
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10 my-auto">
          <div className="mb-8">
            <h2 className="text-4xl font-black text-white leading-tight mb-3">
              {mode === "create" ? (
                <>Start your<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-400">corporate journey</span></>
              ) : (
                <>Join your<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-400">team today</span></>
              )}
            </h2>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              {mode === "create"
                ? "Register your company and become the Corporate Admin. Invite your team and start managing workflows instantly."
                : "Your HR/Admin has already added you. Enter your invite code and join your workspace in seconds."}
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-4">
            {features.map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-blue-400" />
                  </div>
                  <p className="text-slate-300 text-sm">{item.text}</p>
                </div>
              )
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
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center font-black text-white text-lg shadow-lg">C</div>
            <span className="text-2xl font-black text-slate-900 dark:text-white">CorpLink</span>
          </Link>
        </div>

        <div className="w-full max-w-md">

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-1">Get started</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Create your workspace or join an existing one</p>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl mb-6 gap-1">
            <button
              type="button"
              onClick={() => { setMode("create"); setError("") }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${
                mode === "create"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              }`}
            >
              <Building2 className="h-4 w-4" />
              Create Workspace
            </button>
            <button
              type="button"
              onClick={() => { setMode("join"); setError("") }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${
                mode === "join"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              }`}
            >
              <Hash className="h-4 w-4" />
              Join via Invite
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">

            {/* Company Name OR Invite Code */}
            {mode === "create" ? (
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Company Name</label>
                <div className="relative">
                  <Building2
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    style={{ width: "18px", height: "18px" }}
                  />
                  <input
                    type="text" name="companyName"
                    placeholder="Acme Corp, TechStartup..."
                    value={formData.companyName} onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Company Invite Code</label>
                <div className="relative">
                  <Hash
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    style={{ width: "18px", height: "18px" }}
                  />
                  <input
                    type="text" name="companyId"
                    placeholder="Paste your company ID here"
                    value={formData.companyId} onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
                <p className="text-xs text-slate-400 ml-1">Ask your HR or Admin for the Company ID</p>
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  style={{ width: "18px", height: "18px" }}
                />
                <input
                  type="text" name="fullName" placeholder="John Doe"
                  value={formData.fullName} onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Work Email</label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  style={{ width: "18px", height: "18px" }}
                />
                <input
                  type="email" name="email" placeholder="you@company.com"
                  value={formData.email} onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  style={{ width: "18px", height: "18px" }}
                />
                <input
                  type={showPassword ? "text" : "password"} name="password" placeholder="Min. 8 characters"
                  value={formData.password} onChange={handleChange}
                  className="w-full pl-11 pr-12 py-3.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword
                    ? <EyeOff style={{ width: "18px", height: "18px" }} />
                    : <Eye style={{ width: "18px", height: "18px" }} />
                  }
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 rounded-xl">
                <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-[10px] font-bold">!</span>
                </div>
                <p className="text-red-700 dark:text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Success */}
            {message && (
              <div className="flex items-center gap-2 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <p className="text-emerald-700 dark:text-emerald-400 text-sm font-medium">{message}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white py-3.5 rounded-xl font-bold text-base transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:-translate-y-0.5 active:translate-y-0 mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  {mode === "create" ? "Create Workspace" : "Join Workspace"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider + Login link */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-slate-950 px-3 text-xs text-slate-400 font-medium">
                Already have an account?
              </span>
            </div>
          </div>

          <Link
            to="/login"
            className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all text-sm"
          >
            Sign into your workspace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Register