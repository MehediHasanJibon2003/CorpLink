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
  Briefcase,
  MessageCircle,
  Building,
  TrendingUp,
} from "lucide-react";

const EMPLOYEE_NAV = [
  {
    group: "Workspace",
    items: [
      // Both employee and restricted (intern) can see dashboard
      { name: "Dashboard",    path: "/employee/dashboard",    icon: LayoutDashboard, roles: ["employee", "restricted"] },
      // Performance: only regular employees
      { name: "Performance",  path: "/employee/performance",  icon: TrendingUp,      roles: ["employee"] },
      // Tasks: both can see (intern sees only assigned tasks)
      { name: "My Tasks",     path: "/employee/tasks",        icon: CheckSquare,     roles: ["employee", "restricted"] },
      // Projects: only regular employees
      { name: "My Projects",  path: "/employee/projects",     icon: FolderKanban,    roles: ["employee"] },
    ],
  },
  {
    group: "Company",
    items: [
      // Department info: only regular employees
      { name: "My Department",  path: "/employee/department",    icon: Building,       roles: ["employee"] },
      // Messages: only regular employees
      { name: "Messages",       path: "/employee/messages",      icon: MessageCircle,  roles: ["employee"] },
      // Feed: both (read-only for interns is enforced inside component)
      { name: "Corporate Feed", path: "/employee/feed",          icon: Radio,          roles: ["employee", "restricted"] },
      // Notifications: both
      { name: "Notifications",  path: "/employee/notifications", icon: Bell,           roles: ["employee", "restricted"] },
      // Collaboration: only regular employees
      { name: "Collaboration",  path: "/employee/collaboration", icon: Users2,         roles: ["employee"] },
    ],
  },
  {
    group: "Account",
    items: [
      { name: "My Profile", path: "/employee/profile", icon: UserCircle, roles: ["employee", "restricted"] },
    ],
  },
];


function EmployeeLayout({ children }) {
  const { profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const pathToView = {
    "/employee/dashboard": "dashboard",
    "/employee/performance": "performance",
    "/employee/messages": "messages",
    "/employee/tasks": "tasks",
    "/employee/projects": "projects",
    "/employee/feed": "feed",
    "/employee/notifications": "notifications",
    "/employee/collaboration": "collaboration",
    "/employee/profile": "profile",
    "/employee/department": "department",
  };

  const currentView = pathToView[location.pathname] || "dashboard";

  useEffect(() => {
    if (profile?.companies?.primary_color) {
      document.documentElement.style.setProperty('--primary-color', profile.companies.primary_color);
    }
  }, [profile?.companies?.primary_color]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="employee-root h-screen w-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 flex overflow-hidden">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 w-72 md:w-80 lg:w-[22rem] bg-slate-50 dark:bg-slate-900 border-r-2 border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out flex flex-col shrink-0 h-screen ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:relative`}>
        <div className="h-16 md:h-24 shrink-0 flex items-center px-6 md:px-8 border-b-2 border-slate-200 dark:border-slate-800/50">
          <Link to="/employee/dashboard" className="flex items-center gap-3 md:gap-4 overflow-hidden">
            {profile?.companies?.logo_url ? (
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl shrink-0 overflow-hidden shadow-lg md:shadow-xl bg-white border border-slate-800">
                <img src={profile.companies.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
              </div>
            ) : (
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-orange-500 flex items-center justify-center font-black text-white shadow-lg md:shadow-xl shadow-orange-500/20 text-body md:text-heading-2 shrink-0">
                {profile?.companies?.name?.charAt(0) || "C"}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-heading-3 md:text-[20px] font-black uppercase tracking-[0.1em] text-slate-900 dark:text-white leading-none truncate" title={profile?.companies?.name}>
                {profile?.companies?.name || "CorpLink"}
              </span>
              <span className="text-[10px] md:text-label font-black uppercase tracking-[0.1em] text-orange-400 truncate mt-2 bg-orange-500/10 px-2 py-0.5 rounded-md self-start">
                Workspace
              </span>
            </div>
          </Link>
        </div>

        <div className="px-4 md:px-6 py-6 md:py-8 border-b-2 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 md:gap-4 bg-blue-600/10 rounded-2xl md:rounded-3xl p-4 md:p-5 border-2 border-blue-500/20">
            <Briefcase className="h-5 w-5 md:h-6 md:w-6 text-blue-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-body md:text-body font-black text-blue-300 truncate uppercase tracking-widest">{profile?.full_name}</p>
              <p className="text-[10px] md:text-label text-slate-500 font-black uppercase tracking-wider mt-0.5">{profile?.role}</p>
              <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mt-0.5">{profile?.companies?.name}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-8 md:py-10 pl-4 pr-2 md:pl-6 md:pr-4 custom-scrollbar">
          {EMPLOYEE_NAV.map((section) => {
            const visibleItems = section.items.filter(item => 
              item.roles.includes(profile?.role?.toLowerCase())
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.group} className="mb-6 md:mb-8">
                <h3 className="px-4 md:px-6 text-label md:text-body font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 md:mb-5">{section.group}</h3>
                <nav className="space-y-2 md:space-y-3">
                  {visibleItems.map((item, itemIndex) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={itemIndex}
                        to={item.path}
                        className={`flex items-center gap-3 md:gap-4 px-4 md:px-6 py-3 md:py-5 rounded-2xl md:rounded-3xl text-body md:text-body font-black uppercase tracking-widest transition-all duration-200 group ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"}`}
                      >
                        <Icon className={`h-5 w-5 md:h-6 md:w-6 ${isActive ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`} />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            );
          })}
        </div>
      </aside>

      <div className="flex-1 flex flex-col w-0 h-screen">
        <header className="bg-white dark:bg-slate-900 border-b-2 border-slate-200 dark:border-slate-800 h-20 md:h-24 lg:h-28 flex items-center justify-between px-4 md:px-8 lg:px-12">
          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-3 rounded-xl text-slate-500"><Menu className="h-6 w-6" /></button>
            <p className="text-heading-2 md:text-heading-1 font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">{currentView}</p>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <button onClick={toggleTheme} className="text-slate-500 dark:text-slate-400 p-2.5 md:p-4 rounded-xl md:rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              {theme === "dark" ? <Sun className="h-6 w-6 md:h-7 md:w-7" /> : <Moon className="h-6 w-6 md:h-7 md:w-7" />}
            </button>
            <button onClick={() => navigate("/employee/notifications")} className="relative text-slate-500 dark:text-slate-400 p-2.5 md:p-4 rounded-xl md:rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              <Bell className="h-6 w-6 md:h-7 md:w-7" />
            </button>
            <div className="h-10 md:h-12 w-0.5 bg-slate-200 dark:bg-slate-700 mx-2 hidden md:block" />
            <div className="flex items-center gap-3 md:gap-5">
              <div className="hidden md:block text-right">
                <p className="text-body md:text-heading-3 font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest leading-tight">{profile?.full_name}</p>
                <p className="text-[10px] md:text-label text-slate-500 font-black tracking-widest uppercase">{profile?.role}</p>
                <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mt-0.5">{profile?.companies?.name}</p>
              </div>
              <div className="h-10 w-10 md:h-14 md:w-14 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center font-black text-white text-heading-3 md:text-heading-1 shadow-sm overflow-hidden" style={{ background: profile?.avatar_url ? "transparent" : "var(--primary-color)" }}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  (profile?.full_name || "E").charAt(0).toUpperCase()
                )}
              </div>
              <button onClick={handleLogout} className="ml-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2.5 md:px-8 md:py-4 rounded-xl font-black uppercase tracking-widest transition border-2 border-slate-200">Sign Out</button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-8 md:p-12 lg:p-16">
          {children}
        </main>
      </div>
    </div>
  );
}

export default EmployeeLayout;

