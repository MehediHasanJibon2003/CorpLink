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
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-4xl font-bold mb-4">
              {profile?.name?.charAt(0) || "U"}
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{profile?.name}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">{profile?.email}</p>
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-full text-xs font-medium uppercase mt-2">
              {profile?.role || "Employee"}
            </span>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
              <span className="font-semibold">Company:</span> {profile?.companies?.name || "Unknown"}
            </p>
            {/* If we had extra columns mapped like designation, we would show them here */}
          </div>
        </div>

        <div className="md:col-span-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Recent Activity</h3>
          {logs.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400">No recent activity found.</p>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-4 p-3 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                    📜
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-200">{log.action}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
