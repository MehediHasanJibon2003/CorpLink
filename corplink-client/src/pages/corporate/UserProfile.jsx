import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import AppLayout from "../../components/layout/AppLayout"

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
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 md:gap-10">
        <div className="xl:col-span-1 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl md:rounded-[2.5rem] shadow-sm p-6 md:p-10 flex flex-col items-center text-center transition-all hover:shadow-md">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-slate-800 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-4xl md:text-5xl font-black mb-6 shadow-inner border-4 border-white dark:border-slate-700">
            {profile?.full_name?.charAt(0) || "U"}
          </div>
          <h3 className="text-[20px] md:text-heading-2 font-black text-slate-900 dark:text-white tracking-tight">{profile?.full_name}</h3>
          <p className="text-[12px] md:text-body text-slate-500 dark:text-slate-400 mt-1 font-bold">{profile?.email}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <span className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-[10px] md:text-badge font-black capitalize tracking-widest shadow-sm">
              {profile?.role ? profile.role.replace(/_/g, ' ') : "Employee"}
            </span>
            <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full text-[10px] md:text-badge font-black uppercase tracking-widest border border-slate-200 dark:border-slate-600">
              Active
            </span>
          </div>
          
          <div className="w-full mt-8 md:mt-10 pt-8 border-t-2 border-slate-100 dark:border-slate-700 text-left space-y-6">
            <div>
              <p className="text-[9px] md:text-label text-slate-400 font-black uppercase tracking-widest mb-1">Organization</p>
              <p className="text-[14px] md:text-heading-3 font-black text-slate-800 dark:text-slate-100">{profile?.companies?.name || "CorpLink Enterprise"}</p>
            </div>
            <div>
              <p className="text-[9px] md:text-label text-slate-400 font-black uppercase tracking-widest mb-1">Member Since</p>
              <p className="text-[14px] md:text-body font-bold text-slate-700 dark:text-slate-300">{new Date(profile?.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</p>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl md:rounded-[2.5rem] shadow-sm p-6 md:p-10">
          <div className="flex items-center justify-between mb-8 md:mb-10">
            <h3 className="text-[18px] md:text-heading-2 font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span className="text-2xl md:text-heading-1">📜</span> Recent Activity
            </h3>
            <button className="text-blue-600 dark:text-blue-400 font-black text-[10px] md:text-[12px] hover:underline underline-offset-4 uppercase tracking-widest">View All</button>
          </div>

          {logs.length === 0 ? (
            <div className="p-8 md:p-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-[13px] md:text-body text-slate-500 dark:text-slate-400 font-bold italic">No recent activity logs found in the security vault.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6 p-4 md:p-6 border-2 border-slate-100 dark:border-slate-700 rounded-xl md:rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg md:rounded-xl flex items-center justify-center text-xl md:text-heading-1 shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                      {log.entity === 'auth' ? '🔐' : '📂'}
                    </div>
                    <div className="sm:hidden flex-1">
                       <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">
                         {log.entity || 'System'}
                       </p>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[14px] md:text-heading-3 font-black text-slate-800 dark:text-slate-100 mb-1 leading-tight truncate">{log.action}</h4>
                    <div className="hidden sm:flex items-center gap-3 mt-1">
                      <p className="text-[9px] md:text-label text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">
                        {log.entity || 'System'}
                      </p>
                      <span className="text-slate-300 dark:text-slate-600">|</span>
                      <p className="text-[10px] md:text-[12px] text-slate-400 dark:text-slate-500 font-bold italic">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                    <p className="sm:hidden text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
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

