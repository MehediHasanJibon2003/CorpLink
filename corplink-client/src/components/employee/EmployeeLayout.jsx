import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Radio,
  Bell,
  Users2,
  UserCircle,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  MessageCircle,
  Briefcase,
} from "lucide-react"

// Employee-specific sidebar navigation items
const EMPLOYEE_NAV = [
  {
    group: "Workspace",
    items: [
      { name: "Dashboard", path: "/employee/dashboard", icon: LayoutDashboard },
      { name: "My Tasks", path: "/employee/tasks", icon: CheckSquare },
      { name: "My Projects", path: "/employee/projects", icon: FolderKanban },
    ],
  },
  {
    group: "Company",
    items: [
      { name: "Corporate Feed", path: "/employee/feed", icon: Radio },
      { name: "Notifications", path: "/employee/notifications", icon: Bell },
      { name: "Collaboration", path: "/employee/collaboration", icon: Users2 },
    ],
  },
  {
    group: "Account",
    items: [
      { name: "My Profile", path: "/employee/profile", icon: UserCircle },
    ],
  },
]

function EmployeeLayout({ children, activeView, setActiveView }) {
  const { profile, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Map pathname to view names
  const pathToView = {
    "/employee/dashboard": "dashboard",
    "/employee/tasks": "tasks",
    "/employee/projects": "projects",
    "/employee/feed": "feed",
    "/employee/notifications": "notifications",
    "/employee/collaboration": "collaboration",
    "/employee/profile": "profile",
  }

  const currentView = pathToView[location.pathname] || "dashboard"

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  const handleNavClick = (path) => {
    navigate(path)
  }

  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 flex overflow-hidden">

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 bg-slate-900 dark:bg-slate-950 border-r border-slate-800 flex flex-col h-screen transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:relative shrink-0`}
      >
        {/* Brand */}
        <div className="h-16 shrink-0 flex items-center px-6 border-b border-slate-800">
          <Link to="/employee/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/20">
              C
            </div>
            <span className="text-xl font-bold tracking-tight text-white">CorpLink</span>
          </Link>
        </div>

        {/* Employee badge */}
        <div className="px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2 bg-blue-600/10 rounded-xl px-3 py-2 border border-blue-500/20">
            <Briefcase className="h-4 w-4 text-blue-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-blue-300 truncate">
                {profile?.full_name || profile?.name || "Employee"}
              </p>
              <p className="text-[10px] text-slate-500 capitalize">
                {profile?.role || "employee"}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {EMPLOYEE_NAV.map((section) => (
            <div key={section.group}>
              <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                {section.group}
              </h3>
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path
                  const Icon = item.icon
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavClick(item.path)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} style={{ width: 18, height: 18 }} />
                      <span>{item.name}</span>
                      {/* Notification badge on Notifications nav item */}
                      {item.name === "Notifications" && unreadCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </button>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom status */}
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <p className="text-xs font-semibold text-slate-200">System Online</p>
            </div>
            <p className="text-[10px] text-slate-400">All services operational</p>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col w-0 h-screen">

        {/* Topbar */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 shadow-sm h-16 shrink-0">
          <div className="w-full px-4 lg:px-6 h-full flex items-center justify-between gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Page title */}
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 capitalize">
                {currentView.replace("-", " ")}
              </p>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-3 ml-auto">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-amber-400 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {theme === "dark" ? <Sun className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} /> : <Moon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />}
              </button>

              {/* Notifications bell */}
              <button
                onClick={() => handleNavClick("/employee/notifications")}
                className="relative text-slate-500 dark:text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <Bell style={{ width: 18, height: 18 }} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>

              <div className="h-7 w-px bg-slate-200 dark:bg-slate-700" />

              {/* User info + logout */}
              <div className="flex items-center gap-2.5">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                    {profile?.full_name || profile?.name || "Employee"}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-end gap-1.5">
                    {profile?.companies?.name || "Company"}
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                    <span className="capitalize">{profile?.role || "employee"}</span>
                  </p>
                </div>
                <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold border border-blue-200 dark:border-blue-800 shadow-sm text-sm">
                  {(profile?.full_name || profile?.name || "E").charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition border border-slate-200 dark:border-slate-700 hover:border-red-200 hover:bg-red-50/50 dark:hover:bg-red-950/20"
                >
                  <LogOut style={{ width: 14, height: 14 }} />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
          <div className="w-full px-4 lg:px-8 py-6">
            <div className="animate-in fade-in duration-300 slide-in-from-bottom-2">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default EmployeeLayout
