import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";
import {
  Shield,
  Menu,
  Sun,
  Moon,
  LogOut,
  Bell,
  Search,
  User,
  Briefcase,
  CheckSquare,
  Building2,
  Loader2,
  X,
} from "lucide-react";
import NotificationDropdown from "./NotificationDropdown";

export default function Topbar({ onMenuClick }) {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length > 0) {
        setIsSearching(true);
        setShowResults(true);

        try {
          const companyId = profile?.company_id;
          if (!companyId) return;

          const [empRes, taskRes, projRes, deptRes] = await Promise.all([
            supabase
              .from("employees")
              .select("id, name, email")
              .eq("company_id", companyId)
              .ilike("name", `%${searchTerm}%`)
              .limit(3),
            supabase
              .from("tasks")
              .select("id, title")
              .eq("company_id", companyId)
              .ilike("title", `%${searchTerm}%`)
              .limit(3),
            supabase
              .from("projects")
              .select("id, name")
              .eq("company_id", companyId)
              .ilike("name", `%${searchTerm}%`)
              .limit(3),
            supabase
              .from("departments")
              .select("id, name")
              .eq("company_id", companyId)
              .ilike("name", `%${searchTerm}%`)
              .limit(3),
          ]);

          const formattedResults = [
            ...(empRes.data || []).map((item) => ({
              id: item.id,
              title: item.name,
              subtitle: item.email,
              type: "Employee",
              icon: User,
              path: `/employees?id=${item.id}`,
            })),
            ...(taskRes.data || []).map((item) => ({
              id: item.id,
              title: item.title,
              subtitle: "Task",
              type: "Task",
              icon: CheckSquare,
              path: `/tasks?taskId=${item.id}`,
            })),
            ...(projRes.data || []).map((item) => ({
              id: item.id,
              title: item.name,
              subtitle: "Project",
              type: "Project",
              icon: Briefcase,
              path: `/tasks?projectId=${item.id}`,
            })),
            ...(deptRes.data || []).map((item) => ({
              id: item.id,
              title: item.name,
              subtitle: "Department",
              type: "Department",
              icon: Building2,
              path: `/departments?id=${item.id}`,
            })),
          ];

          setResults(formattedResults);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, profile?.company_id]);

  const handleResultClick = (result) => {
    navigate(result.path);
    setShowResults(false);
    setSearchTerm("");
  };

  return (
    <header
      className="h-20 md:h-24 lg:h-28 shrink-0 relative flex items-center justify-between px-4 md:px-8 lg:px-12 gap-4 md:gap-8 z-20
      bg-white/80 dark:bg-[#0d0622]/85 border-b-2 border-slate-200 dark:border-violet-500/15 backdrop-blur-xl transition-colors duration-300"
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, var(--primary-color), transparent)`,
        }}
      />

      {/* Search */}
      <div
        ref={searchRef}
        className="hidden md:flex flex-1 max-w-xl relative group z-10"
      >
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
        <input
          type="text"
          placeholder="Search employees, tasks, projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.length > 0 && setShowResults(true)}
          className="w-full bg-slate-50 dark:bg-violet-500/5 border-2 border-slate-100 dark:border-violet-500/10 rounded-2xl md:rounded-3xl pl-16 pr-12 py-4 outline-none focus:border-violet-500/50 transition-all font-bold text-slate-700 dark:text-violet-200"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full text-slate-400"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Search Results Dropdown */}
        {showResults && (
          <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-[#1a0f3c] border-2 border-slate-100 dark:border-violet-500/20 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {isSearching ? (
                <div className="p-8 text-center flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
                  <p className="text-label font-black uppercase tracking-widest text-slate-400">
                    Searching Workspace...
                  </p>
                </div>
              ) : results.length > 0 ? (
                <div className="py-4">
                  <p className="px-6 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Found Results
                  </p>
                  {results.map((result, idx) => (
                    <button
                      key={`${result.type}-${result.id}-${idx}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-left group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-violet-500/10 flex items-center justify-center text-slate-400 group-hover:text-violet-500 transition-colors">
                        <result.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-body font-black text-slate-700 dark:text-white uppercase tracking-tight">
                          {result.title}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {result.subtitle}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-label font-black uppercase tracking-widest text-slate-400">
                    No matches found for "{searchTerm}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex md:hidden items-center gap-3 relative z-10">
        <button
          onClick={onMenuClick}
          className="p-3 rounded-xl text-violet-400"
        >
          <Menu className="h-6 w-6" />
        </button>
        <span className="font-black uppercase tracking-widest text-slate-900 dark:text-white">
          CorpLink
        </span>
      </div>

      <div className="flex items-center gap-3 md:gap-6 relative z-10">
        <button
          onClick={toggleTheme}
          className="p-3 md:p-4 rounded-xl bg-slate-50 dark:bg-violet-500/10 border-2 border-slate-200 dark:border-violet-500/15 hover:scale-105 active:scale-95 transition-all"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 md:h-6 md:w-6 text-amber-400" />
          ) : (
            <Moon className="h-5 w-5 md:h-6 md:w-6" />
          )}
        </button>

        <NotificationDropdown />

        <div
          className="h-8 md:h-12 w-0.5 mx-1 md:mx-4 opacity-20 hidden sm:block"
          style={{
            background: `linear-gradient(180deg, transparent, var(--primary-color), transparent)`,
          }}
        />
 
        <div className="flex items-center gap-3 md:gap-5">
          <div className="hidden md:block text-right">
            <p className="text-body md:text-heading-3 font-black text-slate-800 dark:text-white uppercase tracking-widest leading-tight">
              {profile?.full_name || "User"}
            </p>
            <p className="text-[10px] md:text-label font-black uppercase tracking-widest text-violet-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-violet-400 dark:to-indigo-400 mt-1">
              {profile?.role}
            </p>
          </div>
          <div className="relative">
            <div
              className="w-9 h-9 md:w-14 md:h-14 rounded-xl md:rounded-2xl font-black text-white text-body md:text-heading-1 flex items-center justify-center shadow-xl border-2 border-white/10 overflow-hidden"
              style={{ background: profile?.avatar_url ? "transparent" : "var(--primary-color)" }}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                (profile?.full_name || "U").charAt(0).toUpperCase()
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 bg-rose-50 dark:bg-rose-500/10 text-rose-500 p-3 md:px-6 md:py-4 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-label border-2 border-rose-100 dark:border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-sm"
        >
          <LogOut className="h-5 w-5 md:h-4 md:w-4" />
          <span className="hidden md:block">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
