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
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row min-h-[600px] overflow-hidden">
        
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4">
          <nav className="space-y-1">
            {tabs.map((tab, idx) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-xl transition ${
                    idx === 0 
                      ? "bg-blue-600 text-white shadow-sm" 
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1 p-8">
          <div className="max-w-2xl">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">Profile Information</h3>
            
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200 text-2xl font-bold text-blue-600 shadow-sm">
                  U
                </div>
                <div>
                  <button className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 dark:bg-slate-900/50 transition shadow-sm">
                    Change Avatar
                  </button>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">JPG, GIF or PNG. Max size of 800K</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">First Name</label>
                  <input type="text" className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 bg-slate-50 dark:bg-slate-900/50 opacity-70" disabled value="Corporate" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Last Name</label>
                  <input type="text" className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 bg-slate-50 dark:bg-slate-900/50 opacity-70" disabled value="User" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Email Address</label>
                  <input type="email" className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 bg-slate-50 dark:bg-slate-900/50 opacity-70" disabled value="admin@corplink.com" />
                </div>
              </div>
              
              <div className="pt-4 flex justify-between border-t border-slate-100 dark:border-slate-800">
                <button className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200 px-4 py-2 font-medium">Reset</button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-medium shadow-sm shadow-blue-500/20">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
