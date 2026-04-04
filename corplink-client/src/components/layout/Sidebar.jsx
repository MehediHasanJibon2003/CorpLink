import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const baseMenuItems = [
  { name: "Dashboard", path: "/dashboard", icon: "🏠", roles: ["corporate_admin", "manager", "employee"] },
  { name: "Employees", path: "/employees", icon: "👥", roles: ["corporate_admin", "manager"] },
  { name: "Tasks", path: "/tasks", icon: "✅", roles: ["corporate_admin", "manager", "employee"] },
  { name: "Departments", path: "/departments", icon: "🏢", roles: ["corporate_admin"] },
  { name: "Activity",      path: "/activity",      icon: "📜", roles: ["corporate_admin"] },
  { name: "Feed",          path: "/feed",          icon: "📢", roles: ["corporate_admin", "manager", "employee"] },
  { name: "Collaboration", path: "/collaboration", icon: "🤝", roles: ["corporate_admin", "manager", "employee"] },
];

function Sidebar() {
  const { profile } = useAuth();
  
  // Fallback to employee if undefined
  const userRole = profile?.role || "employee";
  const menuItems = baseMenuItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 flex-col">
      <div className="px-6 py-5 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-blue-600">CorpLink</h2>
        <p className="text-sm text-slate-500 mt-1">Corporate Workspace</p>
      </div>

      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${
                isActive
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-700 hover:bg-slate-100"
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto p-4">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-slate-700">Phase-1 MVP</p>
          <p className="text-xs text-slate-500 mt-1">
            Auth, Department, Employee, Task, Activity, Feed
          </p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
