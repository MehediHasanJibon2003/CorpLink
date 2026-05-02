import { NavLink, Link } from "react-router-dom"
import { useAuth } from "../../../context/AuthContext"
import {
  LayoutDashboard, Building2, CreditCard, Settings,
  Activity, Megaphone, BarChart3, Shield, X, Zap,
} from "lucide-react"

const NAV_ITEMS = [
  { name: "Overview",          path: "/super-admin",               icon: LayoutDashboard, exact: true, color: "from-violet-500 to-indigo-500" },
  { name: "Corporates",        path: "/super-admin/corporates",    icon: Building2,       color: "from-blue-500 to-cyan-500" },
  { name: "Subscriptions",     path: "/super-admin/subscriptions", icon: CreditCard,      color: "from-emerald-500 to-teal-500" },
  { name: "Platform Settings", path: "/super-admin/settings",      icon: Settings,        color: "from-amber-500 to-orange-500" },
  { name: "Activity Logs",     path: "/super-admin/logs",          icon: Activity,        color: "from-rose-500 to-pink-500" },
  { name: "Announcements",     path: "/super-admin/announcements", icon: Megaphone,       color: "from-fuchsia-500 to-purple-500" },
  { name: "Analytics",         path: "/super-admin/analytics",     icon: BarChart3,       color: "from-indigo-500 to-violet-500" },
]

export default function SuperAdminSidebar({ isOpen, setIsOpen }) {
  const { profile } = useAuth()

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-30 md:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col shrink-0 h-screen
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:relative`}
        style={{
          background: "linear-gradient(180deg, #0d0622 0%, #0a0418 50%, #07030f 100%)",
          borderRight: "1px solid rgba(139, 92, 246, 0.15)",
        }}
      >
        {/* Top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, #7c3aed, #4f46e5, transparent)" }} />

        {/* Brand Header */}
        <div className="relative h-20 shrink-0 flex items-center justify-between px-5 overflow-hidden">
          {/* Header glow */}
          <div className="absolute inset-0 opacity-20"
            style={{ background: "radial-gradient(ellipse at 50% 0%, #7c3aed, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.4), transparent)" }} />

          <Link to="/super-admin" className="flex items-center gap-3 relative z-10">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-2xl"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 20px rgba(124,58,237,0.5)" }}>
                C
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0d0622] bg-emerald-400"
                style={{ boxShadow: "0 0 8px rgba(52,211,153,0.8)" }} />
            </div>
            <div>
              <p className="text-base font-black text-white tracking-tight leading-tight">CorpLink</p>
              <p className="text-[9px] font-bold uppercase tracking-widest"
                style={{ background: "linear-gradient(90deg, #a78bfa, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Super Admin
              </p>
            </div>
          </Link>

          <button onClick={() => setIsOpen(false)} className="md:hidden text-violet-400 hover:text-white transition p-1 relative z-10">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Admin Profile Card */}
        <div className="mx-3 mt-3 mb-2 p-3 rounded-2xl relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.1))", border: "1px solid rgba(139,92,246,0.2)" }}>
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20 -translate-y-4 translate-x-4"
            style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
          <div className="flex items-center gap-2.5 relative z-10">
            <div className="w-9 h-9 rounded-xl font-bold text-white text-sm flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 4px 12px rgba(124,58,237,0.4)" }}>
              {(profile?.full_name || "S").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{profile?.full_name || "Super Admin"}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Shield className="h-2.5 w-2.5 text-violet-400" />
                <p className="text-[9px] font-semibold text-violet-400 uppercase tracking-wider">Full Access</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
          <p className="px-3 py-2 text-[9px] font-bold uppercase tracking-[0.15em] text-violet-600">Navigation</p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 relative overflow-hidden ${
                    isActive ? "text-white" : "text-violet-400/70 hover:text-violet-200"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active background */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl"
                        style={{ background: `linear-gradient(135deg, rgba(124,58,237,0.4), rgba(79,70,229,0.3))`, border: "1px solid rgba(139,92,246,0.3)" }} />
                    )}
                    {/* Hover background */}
                    {!isActive && (
                      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(124,58,237,0.08)" }} />
                    )}

                    {/* Icon container */}
                    <div className={`relative z-10 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                      isActive ? "shadow-lg" : "opacity-60 group-hover:opacity-90"
                    }`}
                      style={isActive ? {
                        background: `linear-gradient(135deg, ${item.color.split(" ")[1].replace("from-", "").replace("[", "").replace("]", "")}, ${item.color.split(" ")[2].replace("to-", "").replace("[", "").replace("]", "")})`,
                        boxShadow: "0 4px 12px rgba(124,58,237,0.4)"
                      } : { background: "rgba(139,92,246,0.1)" }}
                    >
                      <Icon className="h-3.5 w-3.5 text-white" />
                    </div>

                    <span className="relative z-10">{item.name}</span>

                    {isActive && (
                      <div className="ml-auto relative z-10 w-1.5 h-1.5 rounded-full bg-violet-400"
                        style={{ boxShadow: "0 0 6px rgba(167,139,250,0.8)" }} />
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom Status */}
        <div className="p-3 mt-auto">
          <div className="relative p-3 rounded-2xl overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.05))", border: "1px solid rgba(16,185,129,0.15)" }}>
            <div className="absolute top-0 right-0 w-16 h-16 opacity-10 -translate-y-4 translate-x-4"
              style={{ background: "radial-gradient(circle, #10b981, transparent)" }} />
            <div className="flex items-center gap-2 relative z-10">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-emerald-400" />
                <p className="text-xs font-bold text-emerald-300">All Systems Online</p>
              </div>
              <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                style={{ boxShadow: "0 0 8px rgba(52,211,153,0.9)" }} />
            </div>
            <p className="text-[10px] text-emerald-600 mt-0.5 relative z-10">Platform fully operational</p>
          </div>
        </div>

        {/* Bottom gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)" }} />
      </aside>
    </>
  )
}
