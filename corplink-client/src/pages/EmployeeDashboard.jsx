import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import AppLayout from "../components/layout/AppLayout"
import { CheckCircle2, Clock, AlertCircle, Newspaper, Calendar, CheckSquare } from "lucide-react"

function EmployeeDashboard() {
  const { user, profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [announcements, setAnnouncements] = useState([])

  const fetchMyTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("assigned_to", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
    
    setTasks(data || [])
  }

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*, profiles(name)")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })
      .limit(3)
    
    setAnnouncements(data || [])
  }

  useEffect(() => {
    if (profile?.company_id && user?.id) {
      fetchMyTasks()
      fetchAnnouncements()
    }
  }, [profile, user])

  const getStatusIcon = (status) => {
    if (status === "Completed") return <CheckCircle2 className="h-4 w-4" />
    if (status === "In Progress") return <Clock className="h-4 w-4" />
    return <AlertCircle className="h-4 w-4" />
  }

  return (
    <AppLayout
      title="My Workspace"
      subtitle={`Welcome back, ${profile?.name || "Team Member"}! Ready to tackle your goals?`}
    >
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-blue-500" />
                My Current Tasks
              </h3>
              <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-lg">
                {tasks.length} Pending
              </span>
            </div>
            
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                <p>No tasks assigned recently.</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:border-blue-200 dark:hover:border-blue-800 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        task.priority === "High" ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" :
                        task.priority === "Medium" ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400" :
                        "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      }`}>
                        <AlertCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {task.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : "N/A"}</span>
                          <span>•</span>
                          <span className="capitalize text-slate-600 dark:text-slate-300 font-medium">Status: {task.status?.replace("_", " ") || "Pending"}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Newspaper className="text-purple-600 h-5 w-5" /> Company News & Updates
              </h3>
            </div>
            
            {announcements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                <p>No recent announcements.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((feed) => (
                  <div key={feed.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <h4 className="font-bold text-slate-800 tracking-tight">{feed.title}</h4>
                    <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{feed.content}</p>
                    <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center">
                      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                        Posted by {feed.profiles?.name || "Admin"}
                      </p>
                      <span className="text-xs text-slate-400">
                        {new Date(feed.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default EmployeeDashboard
