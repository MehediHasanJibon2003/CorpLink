import { useState } from "react"
import SuperAdminSidebar from "./SuperAdminSidebar"
import SuperAdminTopbar from "./SuperAdminTopbar"

export default function SuperAdminLayout({ children, title, subtitle }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="h-screen w-screen flex overflow-hidden relative transition-colors duration-300 bg-white dark:bg-black">
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
          <div className="w-full px-8 md:px-12 lg:px-20 py-6 md:py-8 lg:py-12 flex flex-col">
            {(title || subtitle) && (
              <div className="mb-8 md:mb-12 lg:mb-16">
                {title && (
                  <h1 className="text-3xl md:text-4xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-2 md:mb-4">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-[11px] md:text-sm lg:text-base text-slate-500 dark:text-violet-400/70 mt-3 md:mt-4 font-black uppercase tracking-widest">
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
  )
}
