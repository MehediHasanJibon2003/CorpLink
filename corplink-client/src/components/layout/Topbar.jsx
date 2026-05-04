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
    <header className="bg-white dark:bg-slate-900 border-b-2 border-slate-200 dark:border-slate-800 sticky top-0 z-20 shadow-sm transition-colors duration-300 w-full shrink-0 h-20 md:h-24 lg:h-28">
      <div className="w-full px-4 md:px-8 lg:px-12 h-full flex items-center justify-between gap-4 md:gap-8">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-3 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Left Side - Global Search */}
        <div className="flex-1 flex items-center">
          <div className="relative w-full max-w-2xl hidden md:block">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 md:h-6 md:w-6 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search employees, tasks, or projects..."
              className="block w-full pl-14 md:pl-16 pr-6 py-4 md:py-5 border-2 border-slate-200 dark:border-slate-700 rounded-2xl md:rounded-[2rem] bg-slate-50 dark:bg-slate-800 xl:bg-white dark:xl:bg-slate-900 dark:text-white placeholder-slate-400 text-base md:text-lg font-bold outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition duration-150 ease-in-out"
            />
          </div>
        </div>

        {/* Right Side - Actions & Profile */}
        <div className="flex items-center gap-3 md:gap-6">
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

          <button className="text-slate-500 dark:text-slate-400 hover:text-blue-600 relative p-2.5 md:p-4 rounded-xl md:rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <MessageSquare className="h-6 w-6 md:h-7 md:w-7" />
            <span className="absolute top-2 right-2 block h-3 w-3 rounded-full bg-blue-500 ring-4 ring-white dark:ring-slate-900"></span>
          </button>

          <button className="text-slate-500 dark:text-slate-400 hover:text-blue-600 relative p-2.5 md:p-4 rounded-xl md:rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <Bell className="h-6 w-6 md:h-7 md:w-7" />
            <span className="absolute top-2 right-2 block h-3 w-3 rounded-full bg-red-500 ring-4 ring-white dark:ring-slate-900"></span>
          </button>

          <div className="h-10 md:h-12 w-0.5 bg-slate-200 dark:bg-slate-700 mx-2 hidden md:block"></div>

          <div className="flex items-center gap-3 md:gap-5">
            <div className="hidden md:block text-right">
              <p className="text-base md:text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                {profile?.full_name || profile?.name || "Corporate User"}
              </p>
              <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-black tracking-widest uppercase flex items-center justify-end gap-2 mt-1">
                {profile?.companies?.name || "Company"}
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                <span className="">
                  {profile?.role?.replace("_", " ") || "Admin"}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-10 w-10 md:h-14 md:w-14 rounded-2xl md:rounded-[1.5rem] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 flex items-center justify-center font-black text-lg md:text-2xl border-2 border-blue-200 dark:border-blue-800 shadow-sm">
                {(profile?.full_name || profile?.name || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>
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
  );
}

export default Topbar;
