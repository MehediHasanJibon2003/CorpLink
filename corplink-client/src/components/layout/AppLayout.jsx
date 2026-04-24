import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function AppLayout({ children, title, subtitle }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 flex overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col w-0 h-screen">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
          <div className="w-full px-6 lg:px-8 py-8 flex flex-col">
            {(title || subtitle) && (
              <div className="mb-12">
                {title && (
                  <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
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
