import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  Search,
  Bell,
  MessageSquare,
  ChevronDown,
  Moon,
  Sun,
  Menu,
} from "lucide-react";

function Topbar({ onMenuClick }) {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 shadow-sm transition-colors duration-300 w-full shrink-0 h-16">
      <div className="w-full px-6 lg:px-8 h-full flex items-center justify-between gap-6">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Left Side - Global Search */}
        <div className="flex-1 flex items-center">
          <div className="relative w-full max-w-md hidden md:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search employees, tasks, or projects..."
              className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg leading-5 bg-slate-50 dark:bg-slate-800 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 transition duration-150 ease-in-out"
            />
          </div>
        </div>

        {/* Right Side - Actions & Profile */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-amber-400 relative p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          <button className="text-slate-500 dark:text-slate-400 hover:text-blue-600 relative p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <MessageSquare className="h-5 w-5" />
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-slate-900"></span>
          </button>

          <button className="text-slate-500 dark:text-slate-400 hover:text-blue-600 relative p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"></span>
          </button>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {profile?.full_name || profile?.name || "Corporate User"}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wide flex items-center justify-end gap-1.5">
                {profile?.companies?.name || "Company"}
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                <span className="capitalize">{profile?.role || "Admin"}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold border border-blue-200 dark:border-blue-800 shadow-sm">
                {(profile?.full_name || profile?.name || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="ml-2 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 hover:dark:bg-red-900/20 hover:text-red-600 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg text-sm font-semibold transition border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
