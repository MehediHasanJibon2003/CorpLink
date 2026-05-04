import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
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
} from "lucide-react";

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
];

function EmployeeLayout({ children, activeView, setActiveView }) {
  const { profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Map pathname to view names
  const pathToView = {
    "/employee/dashboard": "dashboard",
    "/employee/tasks": "tasks",
    "/employee/projects": "projects",
    "/employee/feed": "feed",
    "/employee/notifications": "notifications",
    "/employee/collaboration": "collaboration",
    "/employee/profile": "profile",
  };

  const currentView = pathToView[location.pathname] || "dashboard";

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleNavClick = (path) => {
    navigate(path);
  };

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
        className={`fixed inset-y-0 left-0 z-40 w-72 md:w-80 lg:w-[22rem] bg-slate-900 dark:bg-slate-950 border-r border-slate-800 dark:border-slate-900 transition-transform duration-300 ease-in-out flex flex-col shrink-0 h-screen
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:relative`}
      >
        {/* Brand */}
        <div className="h-16 md:h-24 shrink-0 flex items-center px-6 md:px-8 border-b-2 border-slate-800 dark:border-slate-800/50">
          <Link to="/employee/dashboard" className="flex items-center gap-3 md:gap-4">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-orange-500 flex items-center justify-center font-black text-white shadow-lg md:shadow-xl shadow-orange-500/20 text-base md:text-xl">
              C
            </div>
            <span className="text-xl md:text-3xl font-black uppercase tracking-widest text-white">
              CorpLink
            </span>
          </Link>
        </div>

        {/* Employee badge */}
        <div className="px-4 md:px-6 py-6 md:py-8 border-b-2 border-slate-800">
          <div className="flex items-center gap-3 md:gap-4 bg-blue-600/10 rounded-2xl md:rounded-3xl p-4 md:p-5 border-2 border-blue-500/20">
            <Briefcase className="h-5 w-5 md:h-6 md:w-6 text-blue-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm md:text-base font-black text-blue-300 truncate uppercase tracking-widest">
                {profile?.full_name || profile?.name || "Employee"}
              </p>
              <p className="text-[10px] md:text-xs text-slate-500 font-black uppercase tracking-wider mt-0.5">
                {profile?.role?.replace("_", " ") || "employee"}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-8 md:py-10 pl-4 pr-2 md:pl-6 md:pr-4 custom-scrollbar">
          {EMPLOYEE_NAV.map((section) => (
            <div key={section.group} className="mb-6 md:mb-8">
              <h3 className="px-4 md:px-6 text-xs md:text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 md:mb-5">
                {section.group}
              </h3>
              <nav className="space-y-2 md:space-y-3">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavClick(item.path)}
                      className={`w-full flex items-center gap-3 md:gap-4 px-4 md:px-6 py-3 md:py-5 rounded-2xl md:rounded-3xl text-sm md:text-base font-black uppercase tracking-widest transition-all duration-200 ${
                        isActive
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                          : "text-slate-400 hover:text-white hover:bg-slate-800 dark:hover:bg-slate-900"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 md:h-6 md:w-6 ${isActive ? "text-white" : "text-slate-500 dark:text-slate-600 group-hover:text-slate-300"}`}
                      />
                      <span>{item.name}</span>
                      {/* Notification badge on Notifications nav item */}
                      {item.name === "Notifications" && unreadCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom status */}
        <div className="p-4 md:p-6 border-t-2 border-slate-800 bg-slate-900 sticky bottom-0">
          <div className="bg-slate-800/50 rounded-3xl md:rounded-[2.5rem] p-5 md:p-6 border-2 border-slate-700/50">
            <div className="flex items-center gap-3 md:gap-4 mb-1.5 md:mb-2">
              <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] md:shadow-[0_0_12px_rgba(16,185,129,0.8)]"></div>
              <p className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-200">
                System Online
              </p>
            </div>
            <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider">
              All services operational
            </p>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col w-0 h-screen">
        {/* Topbar */}
        <header className="bg-white dark:bg-slate-900 border-b-2 border-slate-200 dark:border-slate-800 sticky top-0 z-20 shadow-sm transition-colors duration-300 w-full shrink-0 h-20 md:h-24 lg:h-28">
          <div className="w-full px-4 md:px-8 lg:px-12 h-full flex items-center justify-between gap-4 md:gap-8">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-3 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition"
            >
              <Menu className="h-6 w-6" />
            </button>
 
            {/* Page title */}
            <div className="hidden md:block">
              <p className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                {currentView.replace("-", " ")}
              </p>
            </div>
 
            {/* Right side actions */}
            <div className="flex items-center gap-3 md:gap-6 ml-auto">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-amber-400 relative p-2.5 md:p-4 rounded-xl md:rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {theme === "dark" ? (
                  <Sun className="h-6 w-6 md:h-7 md:w-7" />
                ) : (
                  <Moon className="h-6 w-6 md:h-7 md:w-7" />
                )}
              </button>
 
              {/* Notifications bell */}
              <button
                onClick={() => handleNavClick("/employee/notifications")}
                className="relative text-slate-500 dark:text-slate-400 hover:text-blue-600 p-2.5 md:p-4 rounded-xl md:rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <Bell className="h-6 w-6 md:h-7 md:w-7" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 block h-3 w-3 rounded-full bg-red-500 ring-4 ring-white dark:ring-slate-900" />
                )}
              </button>
 
              <div className="h-10 md:h-12 w-0.5 bg-slate-200 dark:bg-slate-700 mx-2 hidden md:block" />
 
              {/* User info + logout */}
              <div className="flex items-center gap-3 md:gap-5">
                <div className="hidden md:block text-right">
                  <p className="text-base md:text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest leading-tight">
                    {profile?.full_name || profile?.name || "Employee"}
                  </p>
                  <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-black tracking-widest uppercase flex items-center justify-end gap-2 mt-1">
                    {profile?.companies?.name || "Company"}
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                    <span className="">
                      {profile?.role?.replace("_", " ") || "employee"}
                    </span>
                  </p>
                </div>
                <div className="h-10 w-10 md:h-14 md:w-14 rounded-2xl md:rounded-[1.5rem] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 flex items-center justify-center font-black text-lg md:text-2xl border-2 border-blue-200 dark:border-blue-800 shadow-sm">
                  {(profile?.full_name || profile?.name || "E")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-2 md:ml-4 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 hover:dark:bg-red-900/20 hover:text-red-600 text-slate-600 dark:text-slate-300 px-4 py-2.5 md:px-8 md:py-4 rounded-xl md:rounded-[2rem] text-xs md:text-sm font-black uppercase tracking-widest transition border-2 border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
          <div className="w-full px-8 md:px-12 lg:px-20 py-6 md:py-8 lg:py-12 flex flex-col">
            <div className="animate-in fade-in duration-300 slide-in-from-bottom-2">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default EmployeeLayout;
