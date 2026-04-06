import { NavLink, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
  LayoutDashboard, User, CheckSquare, Radio, Network, 
  Users, Building2, Activity, MessageCircle, BarChart3, Settings as SettingsIcon, Shield 
} from "lucide-react";

const menuGroups = [
  {
    title: "Main Menu",
    items: [
      { name: "My Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "team_lead", "hr", "employee", "corporate_admin"] },
      { name: "Tasks & Projects", path: "/tasks", icon: CheckSquare, roles: ["admin", "manager", "team_lead", "hr", "employee", "corporate_admin"] },
      { name: "Messages", path: "/messages", icon: MessageCircle, roles: ["admin", "manager", "team_lead", "hr", "employee", "corporate_admin"] },
    ]
  },
  {
    title: "Organization",
    items: [
      { name: "Employees", path: "/employees", icon: Users, roles: ["admin", "manager", "hr", "corporate_admin"] },
      { name: "Teams", path: "/teams", icon: Shield, roles: ["admin", "manager", "team_lead", "hr", "corporate_admin"] },
      { name: "Departments", path: "/departments", icon: Building2, roles: ["admin", "hr", "corporate_admin"] },
    ]
  },
  {
    title: "Engagement",
    items: [
      { name: "News Feed", path: "/feed", icon: Radio, roles: ["admin", "manager", "team_lead", "hr", "employee", "corporate_admin"] },
      { name: "Collaboration", path: "/collaboration", icon: Network, roles: ["admin", "manager", "team_lead", "hr", "employee", "corporate_admin"] },
    ]
  },
  {
    title: "System",
    items: [
      { name: "Analytics", path: "/analytics", icon: BarChart3, roles: ["admin", "corporate_admin"] },
      { name: "System Logs", path: "/activity", icon: Activity, roles: ["admin", "hr", "corporate_admin"] },
      { name: "Settings", path: "/settings", icon: SettingsIcon, roles: ["admin", "corporate_admin"] },
      { name: "My Profile", path: "/profile", icon: User, roles: ["admin", "manager", "team_lead", "hr", "employee", "corporate_admin"] },
    ]
  }
];

function Sidebar() {
  const { profile } = useAuth();
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 dark:bg-slate-950 border-r border-slate-800 dark:border-slate-900 min-h-screen sticky top-0 transition-colors duration-300">
      
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 dark:border-slate-800/50">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/20">
            C
          </div>
          <span className="text-xl font-bold tracking-tight text-white">CorpLink</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
        {menuGroups.map((group, groupIndex) => {
          const hasAccessToGroup = group.items.some(
            (item) => !item.roles || item.roles.includes(profile?.role)
          )
          
          if (!hasAccessToGroup) return null;

          return (
            <div key={groupIndex} className="mb-8">
              <h3 className="px-3 text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-600 uppercase tracking-wider mb-3">
                {group.title}
              </h3>
              <nav className="space-y-1">
                {group.items.map((item, itemIndex) => {
                  const hasAccess = !item.roles || item.roles.includes(profile?.role)
                  if (!hasAccess) return null;

                  const isActive = location.pathname.startsWith(item.path)
                  const Icon = item.icon

                  return (
                    <Link
                      key={itemIndex}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-900/20"
                          : "text-slate-400 hover:text-white hover:bg-slate-800 dark:hover:bg-slate-900"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-slate-500 dark:text-slate-600 group-hover:text-slate-300"}`} />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
          )
        })}
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900 sticky bottom-0">
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
            <p className="text-xs font-semibold text-slate-200">System Online</p>
          </div>
          <p className="text-[10px] text-slate-400">All services operational</p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
