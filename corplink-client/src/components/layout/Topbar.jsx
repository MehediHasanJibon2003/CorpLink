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
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 shadow-sm transition-colors duration-300 w-full shrink-0 h-16 md:h-20 lg:h-24">
      <div className="w-full px-4 md:px-8 lg:px-12 h-full flex items-center justify-between gap-4 md:gap-8">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 md:p-3 -ml-2 md:-ml-3 rounded-lg md:rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <Menu className="h-6 w-6 md:h-8 md:w-8" />
        </button>

        {/* Left Side - Global Search */}
        <div className="flex-1 flex items-center">
          <div className="relative w-full max-w-2xl hidden md:block">
            <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 md:h-6 md:w-6 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search employees, tasks, or projects..."
              className="block w-full pl-10 md:pl-14 pr-4 md:pr-6 py-2.5 md:py-4 border md:border-2 border-slate-200 dark:border-slate-700 rounded-lg md:rounded-2xl leading-5 md:leading-6 bg-slate-50 dark:bg-slate-800 dark:text-white placeholder-slate-400 text-sm md:text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 transition duration-150 ease-in-out"
            />
          </div>
        </div>

        {/* Right Side - Actions & Profile */}
        <div className="flex items-center gap-3 md:gap-6">
          <button
            onClick={toggleTheme}
            className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-amber-400 relative p-1.5 md:p-2 rounded-full md:rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 md:h-8 md:w-8" />
            ) : (
              <Moon className="h-5 w-5 md:h-8 md:w-8" />
            )}
          </button>

          <button className="text-slate-500 dark:text-slate-400 hover:text-blue-600 relative p-1.5 md:p-2 rounded-full md:rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <MessageSquare className="h-5 w-5 md:h-8 md:w-8" />
            <span className="absolute top-1 right-1 md:top-2 md:right-2 block h-2 w-2 md:h-3 md:w-3 rounded-full bg-blue-500 ring-2 ring-white dark:ring-slate-900"></span>
          </button>

          <button className="text-slate-500 dark:text-slate-400 hover:text-blue-600 relative p-1.5 md:p-2 rounded-full md:rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <Bell className="h-5 w-5 md:h-8 md:w-8" />
            <span className="absolute top-1 right-1 md:top-2 md:right-2 block h-2 w-2 md:h-3 md:w-3 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"></span>
          </button>

          <div className="h-8 md:h-10 w-px bg-slate-200 dark:bg-slate-700 mx-1 md:mx-2 hidden sm:block"></div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm md:text-xl font-bold text-slate-800 dark:text-slate-100">
                {profile?.full_name || profile?.name || "Corporate User"}
              </p>
              <p className="text-[11px] md:text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide flex items-center justify-end gap-1.5 md:gap-2 mt-0 md:mt-1">
                {profile?.companies?.name || "Company"}
                <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                <span className="capitalize">{profile?.role || "Admin"}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-9 w-9 md:h-12 md:w-12 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold md:font-black text-sm md:text-xl border md:border-2 border-blue-200 dark:border-blue-800 shadow-sm">
                {(profile?.full_name || profile?.name || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="ml-2 md:ml-4 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 hover:dark:bg-red-900/20 hover:text-red-600 text-slate-600 dark:text-slate-300 px-3 py-1.5 md:px-6 md:py-3 rounded-lg md:rounded-xl text-sm md:text-lg font-semibold md:font-bold transition border md:border-2 border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800"
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
