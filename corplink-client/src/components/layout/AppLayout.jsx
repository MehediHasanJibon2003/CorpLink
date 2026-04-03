import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

function AppLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-slate-100 flex">
      <Sidebar />

      <div className="flex-1 md:ml-64 min-h-screen">
        <Topbar />

        <main className="p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {(title || subtitle) && (
              <div className="mb-6">
                {title && (
                  <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
                )}
                {subtitle && (
                  <p className="text-slate-500 mt-2">{subtitle}</p>
                )}
              </div>
            )}

            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AppLayout