import { NavLink, Link } from "react-router-dom"
import { useAuth } from "../../../context/AuthContext"
import { useTheme } from "../../../context/ThemeContext"
import {
  LayoutDashboard, Building2, CreditCard, Settings,
  Activity, Megaphone, BarChart3, Shield, X, Zap, Users
} from "lucide-react"

const NAV_ITEMS = [
  { name: "Overview",          path: "/super-admin",               icon: LayoutDashboard, exact: true, colorStart: "#8b5cf6", colorEnd: "#6366f1" },
  { name: "Companies",        path: "/super-admin/companies",    icon: Building2,       colorStart: "#3b82f6", colorEnd: "#06b6d4" },
  { name: "Subscriptions",     path: "/super-admin/subscriptions", icon: CreditCard,      colorStart: "#10b981", colorEnd: "#14b8a6" },
  { name: "Platform Settings", path: "/super-admin/settings",      icon: Settings,        colorStart: "#f59e0b", colorEnd: "#f97316" },
  { name: "Activity Logs",     path: "/super-admin/logs",          icon: Activity,        colorStart: "#f43f5e", colorEnd: "#ec4899" },
  { name: "Threat Management", path: "/super-admin/threats",       icon: Shield,          colorStart: "#ef4444", colorEnd: "#dc2626" },
  { name: "Announcements",     path: "/super-admin/announcements", icon: Megaphone,       colorStart: "#d946ef", colorEnd: "#a855f7" },
  { name: "Users",             path: "/super-admin/users",         icon: Users,           colorStart: "#ec4899", colorEnd: "#f43f5e" },
  { name: "Analytics",         path: "/super-admin/analytics",     icon: BarChart3,       colorStart: "#6366f1", colorEnd: "#8b5cf6" },
]

export default function SuperAdminSidebar({ isOpen, setIsOpen }) {
  const { profile } = useAuth()
  const { branding } = useTheme()

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-30 md:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 w-72 md:w-80 lg:w-[22rem] flex flex-col shrink-0 h-screen
        transition-colors transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:relative
        bg-white dark:bg-[#0a0418] border-r border-slate-200 dark:border-violet-500/15`}
      >
        {/* Top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, #7c3aed, #4f46e5, transparent)" }} />

        {/* Brand Header */}
        <div className="relative h-16 md:h-24 shrink-0 flex items-center justify-between px-5 md:px-8 overflow-hidden border-b-2 border-slate-200 dark:border-violet-500/15">
          {/* Header glow */}
          <div className="absolute inset-0 opacity-20"
            style={{ background: "radial-gradient(ellipse at 50% 0%, #7c3aed, transparent 70%)" }} />
 
          <Link to="/super-admin" className="flex items-center gap-3 md:gap-4 relative z-10">
            <div className="relative">
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-white text-body md:text-heading-2 shadow-xl overflow-hidden bg-gradient-to-br"
                style={{ background: "var(--primary-color)", boxShadow: "0 0 20px rgba(124,58,237,0.3)" }}>
                {branding?.logo_url ? (
                  <img src={branding.logo_url} className="w-full h-full object-cover" alt="Logo" />
                ) : (
                  (branding?.platform_name?.charAt(0) || "C")
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#0d0622] bg-emerald-400"
                style={{ boxShadow: "0 0 8px rgba(52,211,153,0.8)" }} />
            </div>
            <div>
              <p className="text-heading-2 md:text-heading-1 font-black text-slate-900 dark:text-white uppercase tracking-widest leading-tight">
                {branding?.platform_name || "CorpLink"}
              </p>
              <p className="text-[10px] md:text-label font-black tracking-widest uppercase text-violet-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-violet-400 dark:to-indigo-400">
                Super Admin
              </p>
            </div>
          </Link>

          <button onClick={() => setIsOpen(false)} className="md:hidden text-violet-400 hover:text-white transition p-1 relative z-10">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Admin Profile Card */}
        <div className="mx-4 md:mx-6 mt-6 md:mt-8 mb-6 md:mb-8 p-4 md:p-6 rounded-2xl md:rounded-3xl relative overflow-hidden bg-violet-50/50 dark:bg-violet-900/10 border-2 border-violet-100 dark:border-violet-500/20">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 dark:opacity-20 -translate-y-4 translate-x-4"
            style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
          <div className="flex items-center gap-3 md:gap-4 relative z-10">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl font-black text-white text-body md:text-heading-2 flex items-center justify-center shrink-0 shadow-lg"
              style={{ background: "var(--primary-color)" }}>
              {(profile?.full_name || "S").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-body md:text-heading-3 font-black text-slate-800 dark:text-white truncate uppercase tracking-widest">{profile?.full_name || "Super Admin"}</p>
              <div className="flex items-center gap-2 mt-1">
                <Shield className="h-3 w-3 md:h-4 md:w-4 text-violet-500 dark:text-violet-400" />
                <p className="text-[10px] md:text-label font-black text-violet-500 dark:text-violet-400 uppercase tracking-widest">Full Access</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-8 md:py-10 pl-4 pr-2 md:pl-6 md:pr-4 space-y-2 md:space-y-3 custom-scrollbar">
          <p className="px-4 md:px-6 text-label md:text-body font-black uppercase tracking-[0.15em] text-violet-600 mb-3 md:mb-5">Navigation</p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `group flex items-center gap-3 md:gap-4 px-4 md:px-6 py-3 md:py-5 rounded-2xl md:rounded-3xl text-body md:text-body font-black uppercase tracking-widest transition-all duration-200 relative overflow-hidden ${
                    isActive ? "text-violet-900 dark:text-white shadow-lg shadow-violet-900/20" : "text-slate-500 dark:text-violet-400/70 hover:text-slate-800 dark:hover:text-violet-200 hover:bg-slate-50 dark:hover:bg-violet-500/10"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active background */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-2xl md:rounded-3xl bg-violet-100 dark:bg-violet-500/20 border-2 border-violet-200 dark:border-violet-500/30" />
                    )}
 
                    {/* Icon container */}
                    <div className={`relative z-10 w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      isActive ? "shadow-md dark:shadow-lg" : "opacity-60 group-hover:opacity-90 bg-slate-100 dark:bg-violet-500/10"
                    }`}
                      style={isActive ? {
                        background: `linear-gradient(135deg, ${item.colorStart}, ${item.colorEnd})`,
                        boxShadow: `0 4px 12px ${item.colorStart}66`
                      } : {}}
                    >
                      <Icon className={`h-4 w-4 md:h-5 md:w-5 ${isActive ? 'text-white' : 'text-slate-500 dark:text-white'}`} />
                    </div>
 
                    <span className="relative z-10">{item.name}</span>
 
                    {isActive && (
                      <div className="ml-auto relative z-10 w-2 h-2 rounded-full bg-violet-400"
                        style={{ boxShadow: "0 0 8px rgba(167,139,250,0.8)" }} />
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom Status */}
        <div className="p-4 md:p-6 mt-auto">
          <div className="relative p-4 md:p-6 rounded-2xl md:rounded-[2rem] overflow-hidden bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-100 dark:border-emerald-500/15">
            <div className="absolute top-0 right-0 w-16 h-16 opacity-10 -translate-y-4 translate-x-4"
              style={{ background: "radial-gradient(circle, #10b981, transparent)" }} />
            <div className="flex items-center gap-3 md:gap-4 relative z-10">
              <div className="flex items-center gap-2 md:gap-3">
                <Zap className="h-4 w-4 md:h-5 md:w-5 text-emerald-500 dark:text-emerald-400" />
                <p className="text-label md:text-body font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-300">All Systems Online</p>
              </div>
              <div className="ml-auto w-2 h-2 md:w-3 md:h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            </div>
            <p className="text-[10px] md:text-label text-emerald-600/70 dark:text-emerald-600 font-bold uppercase tracking-wider mt-1 relative z-10">Platform fully operational</p>
          </div>
        </div>

        {/* Bottom gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)" }} />
      </aside>
    </>
  )
}

