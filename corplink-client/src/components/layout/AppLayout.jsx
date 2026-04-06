import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function AppLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 flex">
      <Sidebar />

      <div className="flex-1 md:ml-64 min-h-screen flex flex-col">
        <Topbar />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto">
            {(title || subtitle) && (
              <div className="mb-8">
                {title && (
                  <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h1>
                )}
                {subtitle && <p className="text-slate-500 dark:text-slate-400 mt-1.5 font-medium">{subtitle}</p>}
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
