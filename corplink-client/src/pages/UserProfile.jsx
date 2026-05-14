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
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 md:gap-10">
        <div className="xl:col-span-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-8 md:p-10 flex flex-col items-center text-center transition-all hover:shadow-md">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-slate-800 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-heading-1 md:text-5xl font-black mb-6 shadow-inner border-2 border-white dark:border-slate-700">
            {profile?.full_name?.charAt(0) || "U"}
          </div>
          <h3 className="text-heading-2 font-bold text-slate-900 dark:text-white tracking-tight">{profile?.full_name}</h3>
          <p className="text-body text-slate-500 dark:text-slate-400 mt-1 font-medium">{profile?.email}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-badge font-bold uppercase tracking-wider shadow-sm">
              {profile?.role || "Employee"}
            </span>
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full text-badge font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-600">
              Active
            </span>
          </div>
          
          <div className="w-full mt-8 pt-8 border-t border-slate-100 dark:border-slate-700 text-left space-y-4">
            <div>
              <p className="text-label text-slate-400 font-bold uppercase tracking-wider mb-1">Organization</p>
              <p className="text-heading-3 font-bold text-slate-800 dark:text-slate-100">{profile?.companies?.name || "CorpLink Enterprise"}</p>
            </div>
            <div>
              <p className="text-label text-slate-400 font-bold uppercase tracking-wider mb-1">Member Since</p>
              <p className="text-body font-semibold text-slate-700 dark:text-slate-300">{new Date(profile?.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</p>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-8 md:p-10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-heading-2 font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span className="text-heading-1">📜</span> Recent Activity
            </h3>
            <button className="text-blue-600 dark:text-blue-400 font-bold text-body hover:underline underline-offset-4">View All</button>
          </div>

          {logs.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-body text-slate-500 dark:text-slate-400 font-medium italic">No recent activity logs found in the security vault.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-6 p-6 border border-slate-100 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all group">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-heading-1 shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                    {log.entity === 'auth' ? '🔐' : '📂'}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-heading-3 font-bold text-slate-800 dark:text-slate-100 mb-1 leading-tight">{log.action}</h4>
                    <div className="flex items-center gap-4">
                      <p className="text-label text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                        {log.entity || 'System'}
                      </p>
                      <span className="text-slate-300 dark:text-slate-600">|</span>
                      <p className="text-label text-slate-400 dark:text-slate-500 font-medium italic">
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

