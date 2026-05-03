import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import AppLayout from "../components/layout/AppLayout"

export default function UserProfile() {
  const { user, profile } = useAuth()
  const [logs, setLogs] = useState([])

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)
    setLogs(data || [])
  }

  useEffect(() => {
    if (user?.id) {
      fetchLogs()
    }
  }, [user])

  return (
    <AppLayout title="My Profile" subtitle="Manage your personal details and track activity">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 md:gap-16">
        <div className="xl:col-span-1 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] shadow-sm p-12 md:p-16 flex flex-col items-center text-center transition-all hover:shadow-xl">
          <div className="w-40 h-40 md:w-56 md:h-56 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-slate-800 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-6xl md:text-8xl font-black mb-8 shadow-inner border-4 border-white dark:border-slate-700">
            {profile?.full_name?.charAt(0) || "U"}
          </div>
          <h3 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">{profile?.full_name}</h3>
          <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 mt-2 font-bold">{profile?.email}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <span className="px-6 py-2 bg-blue-600 text-white rounded-full text-sm md:text-lg font-black uppercase tracking-widest shadow-md">
              {profile?.role || "Employee"}
            </span>
            <span className="px-6 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full text-sm md:text-lg font-black uppercase tracking-widest border-2 border-slate-200 dark:border-slate-600">
              Active
            </span>
          </div>
          
          <div className="w-full mt-12 pt-12 border-t-2 border-slate-100 dark:border-slate-700 text-left space-y-6">
            <div>
              <p className="text-sm md:text-base text-slate-400 font-black uppercase tracking-[0.2em] mb-2">Organization</p>
              <p className="text-xl md:text-3xl font-black text-slate-800 dark:text-slate-100">{profile?.companies?.name || "CorpLink Enterprise"}</p>
            </div>
            <div>
              <p className="text-sm md:text-base text-slate-400 font-black uppercase tracking-[0.2em] mb-2">Member Since</p>
              <p className="text-xl md:text-2xl font-bold text-slate-700 dark:text-slate-300">{new Date(profile?.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</p>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] shadow-sm p-12 md:p-16">
          <div className="flex items-center justify-between mb-10 md:mb-12">
            <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
              <span className="text-4xl">📜</span> Recent Activity
            </h3>
            <button className="text-blue-600 dark:text-blue-400 font-black text-lg md:text-xl hover:underline underline-offset-8">View All</button>
          </div>

          {logs.length === 0 ? (
            <div className="p-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-bold italic">No recent activity logs found in the security vault.</p>
            </div>
          ) : (
            <div className="space-y-6 md:space-y-8">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-8 md:gap-12 p-10 md:p-12 border-4 border-slate-100 dark:border-slate-700 rounded-[3rem] hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all group">
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-[2rem] flex items-center justify-center text-4xl md:text-6xl shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                    {log.entity === 'auth' ? '🔐' : '📂'}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-slate-100 mb-4 leading-tight">{log.action}</h4>
                    <div className="flex items-center gap-6">
                      <p className="text-lg md:text-2xl text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                        {log.entity || 'System'}
                      </p>
                      <span className="text-slate-300 dark:text-slate-600">|</span>
                      <p className="text-base md:text-xl text-slate-400 dark:text-slate-500 font-medium italic">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
