import { useState } from "react"
import SuperAdminSidebar from "./SuperAdminSidebar"
import SuperAdminTopbar from "./SuperAdminTopbar"

export default function SuperAdminLayout({ children, title, subtitle }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="h-screen w-screen flex overflow-hidden relative transition-colors duration-300
      bg-[#05030f] dark:bg-[#05030f]
      light:bg-gradient-to-br light:from-violet-50 light:via-indigo-50 light:to-slate-50"
      style={{
        background: "linear-gradient(135deg, #05030f 0%, #0d0622 50%, #060312 100%)"
      }}
    >
      {/* Ambient glow blobs — decorative background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)" }} />
        <div className="absolute top-1/2 -right-60 w-[500px] h-[500px] rounded-full opacity-10 blur-[120px]"
          style={{ background: "radial-gradient(circle, #4f46e5, transparent 70%)" }} />
        <div className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] rounded-full opacity-10 blur-[100px]"
          style={{ background: "radial-gradient(circle, #a855f7, transparent 70%)" }} />
      </div>

      <SuperAdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col w-0 h-screen overflow-hidden relative z-10">
        <SuperAdminTopbar onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="w-full px-6 lg:px-8 py-8">
            {(title || subtitle) && (
              <div className="mb-8">
                {title && (
                  <h1 className="text-2xl font-extrabold tracking-tight mb-1"
                    style={{ background: "linear-gradient(135deg, #fff 30%, #c4b5fd 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-violet-400/70 text-sm font-medium">{subtitle}</p>
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
  )
}
