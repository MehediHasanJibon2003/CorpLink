import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import { Shield, Menu, Sun, Moon, LogOut, Bell, Search } from "lucide-react"

export default function Topbar({ onMenuClick }) {
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
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, var(--primary-color), transparent)` }} />

      {/* Search */}
      <div className="hidden md:flex flex-1 max-w-xl relative group z-10">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
        <input type="text" placeholder="Search anything..." 
          className="w-full bg-slate-50 dark:bg-violet-500/5 border-2 border-slate-100 dark:border-violet-500/10 rounded-2xl md:rounded-3xl pl-16 pr-8 py-4 outline-none focus:border-violet-500/50 transition-all font-bold text-slate-700 dark:text-violet-200" />
      </div>

      <div className="flex md:hidden items-center gap-3 relative z-10">
        <button onClick={onMenuClick} className="p-3 rounded-xl text-violet-400"><Menu className="h-6 w-6" /></button>
        <span className="font-black uppercase tracking-widest text-slate-900 dark:text-white">CorpLink</span>
      </div>

      <div className="flex items-center gap-3 md:gap-6 relative z-10">
        <button onClick={toggleTheme} className="p-2.5 md:p-4 rounded-xl bg-slate-50 dark:bg-violet-500/10 border-2 border-slate-200 dark:border-violet-500/15">
          {theme === "dark" ? <Sun className="h-6 w-6 text-amber-400" /> : <Moon className="h-6 w-6" />}
        </button>

        <button className="p-2.5 md:p-4 rounded-xl text-slate-500 dark:text-violet-400 hover:text-slate-900 dark:hover:text-white transition relative group overflow-hidden bg-slate-50 dark:bg-violet-500/10 border-2 border-slate-200 dark:border-violet-500/15">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl md:rounded-2xl bg-slate-100 dark:bg-violet-500/20" />
          <Bell className="h-6 w-6 relative z-10" />
          <span className="absolute top-2 right-2 w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] ring-4 ring-white dark:ring-[#0d0622]" />
        </button>
 
        <div className="h-10 md:h-12 w-0.5 mx-2 md:mx-4 opacity-20 hidden md:block" style={{ background: `linear-gradient(180deg, transparent, var(--primary-color), transparent)` }} />
 
        <div className="flex items-center gap-3 md:gap-5">
          <div className="hidden md:block text-right">
            <p className="text-base md:text-lg font-black text-slate-800 dark:text-white uppercase tracking-widest leading-tight">{profile?.full_name || "User"}</p>
            <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-violet-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-violet-400 dark:to-indigo-400 mt-1">{profile?.role}</p>
          </div>
          <div className="relative">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl font-black text-white text-lg md:text-2xl flex items-center justify-center shadow-xl border-2 border-white/10" style={{ background: "var(--primary-color)" }}>
              {(profile?.full_name || "U").charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
 
        <button onClick={handleLogout} className="ml-2 bg-rose-50 dark:bg-rose-500/10 text-rose-500 px-4 py-2.5 md:px-8 md:py-4 rounded-xl font-black uppercase tracking-widest text-xs border-2 border-rose-100 dark:border-violet-500/20">
          Sign Out
        </button>
      </div>
    </header>
  )
}
