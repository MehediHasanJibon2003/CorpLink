import AppLayout from "../components/layout/AppLayout";
import { User, Bell, Lock, Palette, Globe, Shield } from "lucide-react";

export default function Settings() {
  const tabs = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security & Access", icon: Lock },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "language", label: "Language & Region", icon: Globe },
    { id: "org", label: "Organization", icon: Shield },
  ];

  return (
    <AppLayout title="Settings" subtitle="Manage your preferences and system configuration">
      <div className="bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] shadow-sm border-2 border-slate-200 dark:border-slate-700 flex flex-col xl:flex-row min-h-[800px] overflow-hidden">
        
        {/* Settings Sidebar */}
        <div className="w-full xl:w-96 border-b-2 xl:border-b-0 xl:border-r-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 p-8 md:p-10 flex flex-col">
          <h3 className="text-xl md:text-2xl font-black text-slate-400 uppercase tracking-[0.2em] mb-8 px-4">Configuration</h3>
          <nav className="space-y-4">
            {tabs.map((tab, idx) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`flex items-center gap-6 w-full px-6 py-5 md:px-8 md:py-6 text-lg md:text-2xl font-black rounded-2xl md:rounded-3xl transition-all ${
                    idx === 0 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]" 
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <Icon className="h-6 w-6 md:h-8 md:w-8" />
                  {tab.label}
                </button>
              )
            })}
          </nav>

          <div className="mt-auto pt-10 px-4">
             <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800/50">
                <p className="text-sm md:text-base font-bold text-blue-800 dark:text-blue-400">Enterprise Edition</p>
                <p className="text-xs md:text-sm text-blue-600 dark:text-blue-500 mt-1">You are currently running the massive production build v2.4.0</p>
             </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 p-10 md:p-20 bg-white dark:bg-slate-800/50">
          <div className="max-w-4xl">
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-10 md:mb-16 tracking-tight">Profile Information</h3>
            
            <div className="space-y-12 md:space-y-16">
              <div className="flex flex-col md:flex-row items-center gap-10 md:gap-12">
                <div className="h-40 w-40 md:h-56 md:w-56 rounded-full bg-gradient-to-br from-blue-100 to-white dark:from-slate-700 dark:to-slate-800 flex items-center justify-center border-4 border-white dark:border-slate-600 text-6xl md:text-8xl font-black text-blue-600 dark:text-blue-400 shadow-xl">
                  U
                </div>
                <div className="text-center md:text-left">
                  <button className="bg-slate-900 dark:bg-slate-100 hover:bg-black dark:hover:bg-white text-white dark:text-slate-900 px-10 py-4 md:py-5 rounded-2xl md:rounded-3xl text-lg md:text-2xl font-black transition-all shadow-lg hover:-translate-y-1">
                    Change Avatar
                  </button>
                  <p className="text-sm md:text-lg text-slate-500 dark:text-slate-400 mt-4 font-bold uppercase tracking-widest">JPG, GIF or PNG. Max size of 800K</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                <div className="space-y-2">
                  <label className="block text-sm md:text-base font-black text-slate-400 uppercase tracking-widest mb-2">First Name</label>
                  <input type="text" className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-2xl md:rounded-3xl px-8 py-5 md:py-6 bg-slate-50 dark:bg-slate-900/50 text-lg md:text-2xl font-black text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-all shadow-inner" disabled value="Corporate" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm md:text-base font-black text-slate-400 uppercase tracking-widest mb-2">Last Name</label>
                  <input type="text" className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-2xl md:rounded-3xl px-8 py-5 md:py-6 bg-slate-50 dark:bg-slate-900/50 text-lg md:text-2xl font-black text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-all shadow-inner" disabled value="User" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm md:text-base font-black text-slate-400 uppercase tracking-widest mb-2">Corporate Email Address</label>
                  <input type="email" className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-2xl md:rounded-3xl px-8 py-5 md:py-6 bg-slate-50 dark:bg-slate-900/50 text-lg md:text-2xl font-black text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-all shadow-inner" disabled value="admin@corplink.com" />
                </div>
              </div>
              
              <div className="pt-10 flex flex-col sm:flex-row justify-between items-center gap-6 border-t-2 border-slate-100 dark:border-slate-800">
                <button className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-8 py-4 text-lg md:text-2xl font-black transition-colors">Reset to Default</button>
                <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-16 py-5 md:py-6 rounded-2xl md:rounded-[2.5rem] text-xl md:text-3xl font-black shadow-xl shadow-blue-500/30 transition-all hover:-translate-y-1 active:translate-y-0">Save All Changes</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
