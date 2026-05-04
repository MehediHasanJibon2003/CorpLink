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
    <header className="h-20 md:h-24 lg:h-28 shrink-0 relative flex items-center justify-between px-4 md:px-8 lg:px-12 gap-4 md:gap-8 overflow-hidden
      bg-white/80 dark:bg-[#0d0622]/85 border-b-2 border-slate-200 dark:border-violet-500/15 backdrop-blur-xl transition-colors duration-300"
    >
      {/* Top shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.5), rgba(79,70,229,0.5), transparent)" }} />
 
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 opacity-30"
        style={{ background: "radial-gradient(ellipse at 50% -50%, rgba(124,58,237,0.3), transparent 70%)" }} />
 
      {/* Left */}
      <div className="flex items-center gap-3 md:gap-4 relative z-10">
        <button onClick={onMenuClick}
          className="md:hidden p-3 rounded-xl text-violet-400 hover:text-white hover:bg-white/5 transition">
          <Menu className="h-6 w-6" />
        </button>
 
        {/* Gradient badge */}
        <div className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl relative overflow-hidden bg-violet-50 dark:bg-violet-500/15 border-2 border-violet-100 dark:border-violet-500/25">
          <Shield className="h-4 w-4 md:h-5 md:w-5 text-violet-500 dark:text-violet-400" />
          <span className="text-xs md:text-sm font-black uppercase tracking-widest text-violet-700 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-violet-400 dark:to-indigo-400">
            Super Admin Portal
          </span>
          <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-400 ml-1.5 md:ml-2 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        </div>
      </div>
 
      {/* Right */}
      <div className="flex items-center gap-3 md:gap-6 relative z-10">
        {/* Theme toggle */}
        <button onClick={toggleTheme}
          className="p-2.5 md:p-4 rounded-xl md:rounded-2xl text-slate-500 dark:text-violet-400 hover:text-slate-900 dark:hover:text-white transition relative group overflow-hidden bg-slate-50 dark:bg-violet-500/10 border-2 border-slate-200 dark:border-violet-500/15">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl md:rounded-2xl bg-slate-100 dark:bg-violet-500/20" />
          {theme === "dark"
            ? <Sun className="h-6 w-6 md:h-7 md:w-7 relative z-10 text-amber-400" />
            : <Moon className="h-6 w-6 md:h-7 md:w-7 relative z-10" />}
        </button>
 
        {/* Notifications */}
        <button className="p-2.5 md:p-4 rounded-xl md:rounded-2xl text-slate-500 dark:text-violet-400 hover:text-slate-900 dark:hover:text-white transition relative group overflow-hidden bg-slate-50 dark:bg-violet-500/10 border-2 border-slate-200 dark:border-violet-500/15">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl md:rounded-2xl bg-slate-100 dark:bg-violet-500/20" />
          <Bell className="h-6 w-6 md:h-7 md:w-7 relative z-10" />
          <span className="absolute top-2 right-2 w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] ring-4 ring-white dark:ring-[#0d0622]" />
        </button>
 
        <div className="h-10 md:h-12 w-0.5 mx-2 md:mx-4 opacity-20 hidden md:block"
          style={{ background: "linear-gradient(180deg, transparent, #7c3aed, transparent)" }} />
 
        {/* User info */}
        <div className="flex items-center gap-3 md:gap-5">
          <div className="hidden md:block text-right">
            <p className="text-base md:text-lg font-black text-slate-800 dark:text-white uppercase tracking-widest leading-tight">{profile?.full_name || "Super Admin"}</p>
            <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-violet-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-violet-400 dark:to-indigo-400 mt-1">
              Super Administrator
            </p>
          </div>
 
          {/* Avatar */}
          <div className="relative">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl md:rounded-[1.5rem] font-black text-white text-lg md:text-2xl flex items-center justify-center shadow-lg border-2 border-violet-200 dark:border-violet-800"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
              {(profile?.full_name || "S").charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-white dark:border-[#0d0622] bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          </div>
        </div>
 
        {/* Logout */}
        <button onClick={handleLogout}
          className="ml-2 md:ml-4 bg-rose-50 dark:bg-violet-500/10 hover:bg-rose-100 hover:dark:bg-rose-500/15 text-rose-500 dark:text-violet-300 hover:text-rose-700 dark:hover:text-white px-4 py-2.5 md:px-8 md:py-4 rounded-xl md:rounded-[2rem] text-xs md:text-sm font-black uppercase tracking-widest transition border-2 border-rose-100 dark:border-violet-500/20">
          Sign Out
        </button>
      </div>
    </header>
  )
}
