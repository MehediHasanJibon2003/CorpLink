import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function AppLayout({ children, title, subtitle }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.corporates?.primary_color) {
      document.documentElement.style.setProperty('--primary-color', profile.corporates.primary_color);
    }
  }, [profile?.corporates?.primary_color]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="corporate-admin-root h-screen w-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 flex overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col w-0 h-screen">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
          <div className="w-full px-8 md:px-12 lg:px-20 py-6 md:py-8 lg:py-12 flex flex-col">
            {(title || subtitle) && (
              <div className="mb-8 md:mb-12 lg:mb-16">
                {title && (
                  <h1 className="text-heading-1 md:text-heading-1 lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-2 md:mb-4">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-[11px] md:text-body lg:text-body text-slate-500 dark:text-slate-400 mt-3 md:mt-4 font-black uppercase tracking-widest">
                    {subtitle}
                  </p>
                )}
              </div>
            )}

            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;

