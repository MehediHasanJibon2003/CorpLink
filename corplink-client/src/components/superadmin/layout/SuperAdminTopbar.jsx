import { useNavigate } from "react-router-dom"
import { useAuth } from "../../../context/AuthContext"
import { useTheme } from "../../../context/ThemeContext"
import { Shield, Menu, Sun, Moon, LogOut, Bell, Search } from "lucide-react"

export default function SuperAdminTopbar({ onMenuClick }) {
  const navigate = useNavigate()
  const { profile, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <header className="h-16 shrink-0 relative flex items-center justify-between px-5 lg:px-8 gap-4 overflow-hidden
      bg-white/80 dark:bg-[#0d0622]/85 border-b border-slate-200 dark:border-violet-500/15 backdrop-blur-xl transition-colors duration-300"
    >
      {/* Top shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.5), rgba(79,70,229,0.5), transparent)" }} />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 opacity-30"
        style={{ background: "radial-gradient(ellipse at 50% -50%, rgba(124,58,237,0.3), transparent 70%)" }} />

      {/* Left */}
      <div className="flex items-center gap-3 relative z-10">
        <button onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg text-violet-400 hover:text-white hover:bg-white/5 transition">
          <Menu className="h-5 w-5" />
        </button>

        {/* Gradient badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl relative overflow-hidden bg-violet-50 dark:bg-violet-500/15 border border-violet-100 dark:border-violet-500/25">
          <Shield className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-violet-400 dark:to-indigo-400">
            Super Admin Portal
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 relative z-10">
        {/* Theme toggle */}
        <button onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 dark:text-violet-400 hover:text-slate-900 dark:hover:text-white transition relative group overflow-hidden bg-slate-50 dark:bg-violet-500/10 border border-slate-200 dark:border-violet-500/15">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl bg-slate-100 dark:bg-violet-500/20" />
          {theme === "dark"
            ? <Sun className="h-4 w-4 relative z-10 text-amber-400" />
            : <Moon className="h-4 w-4 relative z-10" />}
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-xl text-slate-500 dark:text-violet-400 hover:text-slate-900 dark:hover:text-white transition relative group overflow-hidden bg-slate-50 dark:bg-violet-500/10 border border-slate-200 dark:border-violet-500/15">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl bg-slate-100 dark:bg-violet-500/20" />
          <Bell className="h-4 w-4 relative z-10" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
        </button>

        <div className="h-7 w-px mx-1 opacity-20"
          style={{ background: "linear-gradient(180deg, transparent, #7c3aed, transparent)" }} />

        {/* User info */}
        <div className="flex items-center gap-2.5">
          <div className="hidden md:block text-right">
            <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{profile?.full_name || "Super Admin"}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-violet-400 dark:to-indigo-400">
              Super Administrator
            </p>
          </div>

          {/* Avatar */}
          <div className="relative">
            <div className="w-9 h-9 rounded-xl font-bold text-white text-sm flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
              {(profile?.full_name || "S").charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#0d0622] bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
          </div>
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-rose-500 dark:text-violet-300 hover:text-rose-700 dark:hover:text-white transition relative group overflow-hidden ml-1 bg-rose-50 dark:bg-violet-500/10 border border-rose-100 dark:border-violet-500/20">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl bg-rose-100 dark:bg-rose-500/15" />
          <LogOut className="h-3.5 w-3.5 relative z-10" />
          <span className="hidden sm:inline relative z-10">Sign Out</span>
        </button>
      </div>
    </header>
  )
}
