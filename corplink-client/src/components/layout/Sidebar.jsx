import { NavLink, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  User,
  CheckSquare,
  Radio,
  Network,
  Users,
  Building2,
  Activity,
  MessageCircle,
  BarChart3,
  Settings as SettingsIcon,
  Shield,
  CreditCard,
} from "lucide-react";

const menuGroups = [
  {
    title: "Main Menu",
    items: [
      {
        name: "My Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
        roles: ["admin", "corporate_admin", "manager", "hr", "dept_head", "team_lead"],
      },
      {
        name: "Tasks & Projects",
        path: "/tasks",
        icon: CheckSquare,
        roles: ["admin", "corporate_admin", "manager", "hr", "dept_head", "team_lead"],
      },
      {
        name: "Messages",
        path: "/messages",
        icon: MessageCircle,
        roles: ["admin", "corporate_admin", "manager", "hr", "dept_head", "team_lead"],
      },
    ],
  },
  {
    title: "Organization",
    items: [
      {
        // Managers & HR can view/manage employees; dept_head and team_lead cannot manage company-wide
        name: "Employees",
        path: "/employees",
        icon: Users,
        roles: ["admin", "corporate_admin", "manager", "hr"],
      },
      {
        name: "Teams",
        path: "/teams",
        icon: Shield,
        roles: ["admin", "corporate_admin", "manager", "hr", "dept_head", "team_lead"],
      },
      {
        // dept_head can manage their own department; team_lead cannot
        name: "Departments",
        path: "/departments",
        icon: Building2,
        roles: ["admin", "corporate_admin", "hr", "dept_head"],
      },
    ],
  },
  {
    title: "Engagement",
    items: [
      {
        name: "News Feed",
        path: "/feed",
        icon: Radio,
        roles: ["admin", "corporate_admin", "manager", "hr", "dept_head", "team_lead"],
      },
      {
        name: "Collaboration",
        path: "/collaboration",
        icon: Network,
        roles: ["admin", "corporate_admin", "manager", "hr", "dept_head", "team_lead"],
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        // Analytics: only top-level admins
        name: "Analytics",
        path: "/analytics",
        icon: BarChart3,
        roles: ["admin", "corporate_admin"],
      },
      {
        // System Logs: admins and HR (for compliance)
        name: "System Logs",
        path: "/activity",
        icon: Activity,
        roles: ["admin", "corporate_admin", "hr"],
      },
      {
        // Settings: only admins
        name: "Settings",
        path: "/settings",
        icon: SettingsIcon,
        roles: ["admin", "corporate_admin"],
      },
      {
        name: "Billing",
        path: "/billing",
        icon: CreditCard,
        roles: ["admin", "corporate_admin"],
      },
      {
        name: "My Profile",
        path: "/profile",
        icon: User,
        roles: ["admin", "corporate_admin", "manager", "hr", "dept_head", "team_lead"],
      },
    ],
  },
];


function Sidebar({ isOpen, setIsOpen }) {
  const { profile } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar sidebar itself */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 md:w-80 lg:w-[22rem] bg-slate-900 dark:bg-slate-950 border-r border-slate-800 dark:border-slate-900 transition-transform duration-300 ease-in-out flex flex-col shrink-0 h-screen
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:relative
      `}
      >
        {/* Brand Header */}
        <div className="h-16 md:h-24 shrink-0 flex items-center px-6 md:px-8 border-b-2 border-slate-800 dark:border-slate-800/50">
          <Link to="/dashboard" className="flex items-center gap-3 md:gap-4 overflow-hidden">
            {profile?.companies?.logo_url ? (
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl shrink-0 overflow-hidden shadow-lg md:shadow-xl bg-white border border-slate-800">
                <img src={profile.companies.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
              </div>
            ) : (
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-orange-500 flex items-center justify-center font-black text-white shadow-lg md:shadow-xl shadow-orange-500/20 text-body md:text-heading-2 shrink-0" style={{ background: "var(--primary-color)" }}>
                {profile?.companies?.name?.charAt(0) || "C"}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-heading-3 md:text-heading-1 font-black uppercase tracking-[0.2em] text-white leading-none">CorpLink</span>
              <span className="text-[10px] md:text-label font-black uppercase tracking-[0.1em] text-blue-400 truncate mt-2 bg-blue-500/10 px-2 py-0.5 rounded-md self-start">
                {profile?.companies?.name || "Workspace"}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-8 md:py-10 pl-4 pr-2 md:pl-6 md:pr-4 custom-scrollbar">
          {menuGroups.map((group, groupIndex) => {
            const hasAccessToGroup = group.items.some(
              (item) => !item.roles || item.roles.includes(profile?.role),
            );

            if (!hasAccessToGroup) return null;

            return (
              <div key={groupIndex} className="mb-6 md:mb-8">
                <h3 className="px-4 md:px-6 text-label md:text-body font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 md:mb-5">
                  {group.title}
                </h3>
                <nav className="space-y-2 md:space-y-3">
                  {group.items.map((item, itemIndex) => {
                    const hasAccess =
                      !item.roles || item.roles.includes(profile?.role);
                    if (!hasAccess) return null;

                    const isActive = location.pathname.startsWith(item.path);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={itemIndex}
                        to={item.path}
                        className={`flex items-center gap-3 md:gap-4 px-4 md:px-6 py-3 md:py-5 rounded-2xl md:rounded-3xl text-body md:text-body font-black uppercase tracking-widest transition-all duration-200 ${
                          isActive
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                            : "text-slate-400 hover:text-white hover:bg-slate-800 dark:hover:bg-slate-900"
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 md:h-6 md:w-6 ${isActive ? "text-white" : "text-slate-500 dark:text-slate-600 group-hover:text-slate-300"}`}
                        />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            );
          })}
        </div>

        <div className="p-4 md:p-6 border-t-2 border-slate-800 bg-slate-900 sticky bottom-0">
          <div className="bg-slate-800/50 rounded-3xl md:rounded-[2.5rem] p-5 md:p-6 border-2 border-slate-700/50">
            <div className="flex items-center gap-3 md:gap-4 mb-1.5 md:mb-2">
              <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] md:shadow-[0_0_12px_rgba(16,185,129,0.8)]"></div>
              <p className="text-label md:text-body font-black uppercase tracking-widest text-slate-200">
                System Online
              </p>
            </div>
            <p className="text-[10px] md:text-label text-slate-400 font-bold uppercase tracking-wider">
              All services operational
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;

