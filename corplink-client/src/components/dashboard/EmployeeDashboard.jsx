import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import AppLayout from "../layout/AppLayout"
import { Link } from "react-router-dom"

function EmployeeDashboard() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [news, setNews] = useState([])
  const [employeeInfo, setEmployeeInfo] = useState(null)

  useEffect(() => {
    if (!profile) return

    const fetchMyData = async () => {
      // Get detailed employee context
      const { data: empData } = await supabase.from("employees").select("*, departments(name), teams(name)").eq("email", profile.email).eq("company_id", profile.company_id).single()
      setEmployeeInfo(empData)

      // Get strictly assigned tasks
      if (empData) {
        const { data: tData } = await supabase.from("tasks")
          .select("*, projects(name)")
          .eq("assigned_to", empData.id)
          .order("created_at", { ascending: false })
          .limit(10)
        setTasks(tData || [])
      }

      // Get latest corporate feed posts
      const { data: feedData } = await supabase.from("feed_posts").select("*, profiles(full_name)").eq("company_id", profile.company_id).order("created_at", { ascending: false }).limit(3)
      setNews(feedData || [])
    }

    fetchMyData()
  }, [profile])

  const pending = tasks.filter(t => t.status === 'pending').length
  const ongoing = tasks.filter(t => t.status === 'in_progress').length
  const review = tasks.filter(t => t.status === 'needs_review').length
  const finished = tasks.filter(t => t.status === 'finished').length

  const progressRate = tasks.length === 0 ? 0 : Math.round((finished / tasks.length) * 100)

  return (
    <AppLayout title="My Dashboard" subtitle={`Welcome to your workspace, ${profile?.full_name}!`}>
      
      {/* Profile Overview Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 mb-6 text-white shadow-md flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-1">{employeeInfo?.designation || "Employee"}</h2>
          <p className="text-blue-100 flex items-center gap-3">
            <span>🏢 {employeeInfo?.departments?.name || "No Department"}</span>
            <span className="opacity-50">|</span>
            <span>👥 {employeeInfo?.teams?.name || "No Team Assigned"}</span>
          </p>
        </div>
        <div className="bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-sm min-w-[200px] text-center">
          <p className="text-blue-100 text-sm font-semibold mb-1">Personal Completion Rate</p>
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-4xl font-bold">{progressRate}%</h3>
            <span className="text-xs max-w-[60px] text-left leading-tight text-blue-200">{finished} of {tasks.length} Done</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Col: Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <p className="text-slate-500 text-xs font-semibold uppercase">Pending</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{pending}</h3>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <p className="text-slate-500 text-xs font-semibold uppercase">In Progress</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">{ongoing}</h3>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <p className="text-slate-500 text-xs font-semibold uppercase">In Review</p>
              <h3 className="text-2xl font-bold text-amber-500 mt-1">{review}</h3>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <p className="text-slate-500 text-xs font-semibold uppercase">Completed</p>
              <h3 className="text-2xl font-bold text-green-500 mt-1">{finished}</h3>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg">My Recent Tasks</h3>
              <Link to="/tasks" className="text-blue-600 text-sm font-semibold hover:underline">Open Task Board &rarr;</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {tasks.length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic">No tasks assigned to you right now. Relax!</div>
              ) : tasks.slice(0,5).map(task => (
                <div key={task.id} className="p-5 flex items-start justify-between gap-4 hover:bg-slate-50 transition">
                  <div>
                    <h4 className="font-semibold text-slate-800">{task.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">Project: {task.projects?.name || "Inbox"}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider
                    ${task.status==='pending' ? 'bg-slate-200 text-slate-700' :
                      task.status==='in_progress' ? 'bg-blue-200 text-blue-800' :
                      task.status==='needs_review' ? 'bg-amber-200 text-amber-800' :
                      task.status==='finished' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    {task.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Feed */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">Corporate News</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {news.length === 0 ? (
                 <div className="p-6 text-center text-slate-400 text-sm">No recent news.</div>
              ) : news.map(post => (
                <div key={post.id} className="p-5">
                  <div className="flex gap-2 items-center mb-2">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex justify-center items-center text-[10px] font-bold">
                       {post.profiles?.full_name?.charAt(0) || "U"}
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{post.profiles?.full_name}</span>
                    <span className="text-[10px] text-slate-400">• {new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-slate-800 line-clamp-3">{post.content}</p>
                </div>
              ))}
            </div>
            <Link to="/feed" className="block w-full text-center py-3 bg-slate-50 text-blue-600 font-semibold text-sm hover:bg-slate-100 transition">View All Announcements</Link>
          </div>
        </div>
        
      </div>
    </AppLayout>
  )
}

export default EmployeeDashboard
