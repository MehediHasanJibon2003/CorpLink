import { useEffect, useState, useRef } from "react"
import { supabase } from "../../lib/supabase"
import { logAdminActivity } from "../../utils/logger"

function TaskDetailModal({ task, onClose, profile, onUpdate }) {
  const [comments, setComments] = useState([])
  const [attachments, setAttachments] = useState([])
  const [newComment, setNewComment] = useState("")
  const [newUrl, setNewUrl] = useState("")
  const [newName, setNewName] = useState("")
  const [employees, setEmployees] = useState([])
  
  const [activeTab, setActiveTab] = useState("comments") // or 'attachments'

  const messagesEndRef = useRef(null)

  const fetchData = async () => {
    // Standard Fetch inside Modal to isolate concerns and prevent huge prop drilling
    const { data: cData } = await supabase.from("task_comments").select("*, profiles(full_name, role)").eq("task_id", task.id).order("created_at", { ascending: true })
    const { data: aData } = await supabase.from("task_attachments").select("*, profiles(full_name)").eq("task_id", task.id).order("created_at", { ascending: false })
    const { data: eData } = await supabase.from("employees").select("id, name").eq("company_id", profile.company_id)

    if (cData) {
      setComments(cData.map(c => ({
        ...c, sender: c.profiles ? { full_name: c.profiles.full_name, role: c.profiles.role } : null
      })))
    }
    if (aData) {
      setAttachments(aData.map(a => ({
        ...a, uploader: a.profiles ? { full_name: a.profiles.full_name } : null
      })))
    }
    if (eData) setEmployees(eData)
  }

  useEffect(() => {
    fetchData()
  }, [task.id])

  useEffect(() => {
    if (activeTab === 'comments') {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [comments, activeTab])

  const handleStatusChange = async (newStatus) => {
    await supabase.from("tasks").update({ status: newStatus }).eq("id", task.id)
    await logAdminActivity({ company_id: profile.company_id, user_id: profile.id, action: `Changed task status to ${newStatus}`, entity: "task" })
    onUpdate() 
  }

  const handlePostComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    const { error } = await supabase.from("task_comments").insert([{
      task_id: task.id,
      sender_id: profile.id,
      content: newComment.trim()
    }])

    if (!error) {
      setNewComment("")
      fetchData()
    }
  }

  const handleUploadLink = async (e) => {
    e.preventDefault()
    if (!newUrl.trim() || !newName.trim()) return

    const { error } = await supabase.from("task_attachments").insert([{
      task_id: task.id,
      uploader_id: profile.id,
      file_name: newName.trim(),
      file_url: newUrl.trim()
    }])

    if (!error) {
      setNewUrl("")
      setNewName("")
      fetchData()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95">
        
        {/* Left Side: Task Info & Workflow */}
        <div className="w-full md:w-[45%] bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-700 p-6 flex flex-col overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
            <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider
              ${task.status==='pending' ? 'bg-slate-200 text-slate-700' :
                task.status==='in_progress' ? 'bg-blue-200 text-blue-800' :
                task.status==='needs_review' ? 'bg-amber-200 text-amber-800' :
                task.status==='finished' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
              {task.status.replace("_", " ")}
            </span>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-slate-200 hover:bg-slate-300 w-8 h-8 flex items-center justify-center rounded-full transition">✕</button>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{task.title}</h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">{task.description}</p>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6 shadow-sm">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider mb-3">Workflow Controls</h4>
            <div className="grid grid-cols-2 gap-2">
              <button disabled={task.status === 'in_progress'} onClick={() => handleStatusChange("in_progress")} className="py-2 text-sm font-semibold rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 transition">
                Start Work
              </button>
              <button disabled={task.status === 'needs_review'} onClick={() => handleStatusChange("needs_review")} className="py-2 text-sm font-semibold rounded bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 disabled:opacity-50 transition">
                Submit for Review
              </button>
              <button disabled={task.status === 'finished'} onClick={() => handleStatusChange("finished")} className="py-2 text-sm font-semibold rounded bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-50 transition">
                Approve (Finish)
              </button>
              <button disabled={task.status === 'rejected'} onClick={() => handleStatusChange("rejected")} className="py-2 text-sm font-semibold rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50 transition">
                Reject
              </button>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <p className="text-slate-500 font-semibold mb-1">Assignee</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold">👤</div>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{employees.find(e => e.id === task.assigned_to)?.name || "Unassigned"}</span>
              </div>
            </div>
            <div>
              <p className="text-slate-500 font-semibold mb-1">Deadline</p>
              <p className="text-slate-800 dark:text-slate-100 font-medium">{task.deadline ? new Date(task.deadline).toLocaleDateString() : "No Deadline set"}</p>
            </div>
          </div>
        </div>

        {/* Right Side: Discussions & Attachments */}
        <div className="w-full md:w-[55%] flex flex-col bg-white dark:bg-slate-800">
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            <button onClick={() => setActiveTab('comments')} className={`flex-1 py-4 font-semibold text-sm transition border-b-2 ${activeTab === 'comments' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}>Activity & Comments</button>
            <button onClick={() => setActiveTab('attachments')} className={`flex-1 py-4 font-semibold text-sm transition border-b-2 ${activeTab === 'attachments' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}>Files & Links ({attachments.length})</button>
          </div>

          {activeTab === 'comments' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {comments.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">No activity recorded yet. Say hello!</div>
                ) : comments.map((msg) => {
                  const isMe = msg.sender_id === profile.id
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-baseline gap-2 mb-1 px-1">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{msg.sender?.full_name || "Unknown"}</span>
                        <span className="text-[10px] text-slate-400">{new Date(msg.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>
                      </div>
                      <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm shadow-sm ${isMe ? 'bg-slate-800 dark:bg-blue-700 text-white rounded-tr-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-sm'}`}>
                        {msg.content}
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                <form onSubmit={handlePostComment} className="flex gap-2">
                  <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Write an update..." className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 outline-none focus:border-slate-400 text-sm" />
                  <button type="submit" disabled={!newComment.trim()} className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-full px-5 py-2 font-medium transition text-sm">Post</button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="flex-1 flex flex-col overflow-hidden p-6 gap-6">
              <form onSubmit={handleUploadLink} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 border-dashed">
                <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-3 text-sm">Attach new Document / URL</h4>
                <div className="flex flex-col gap-2">
                  <input type="text" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. Figma Design, Google Doc" className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded px-3 py-2 text-sm outline-none" />
                  <input type="url" value={newUrl} onChange={e=>setNewUrl(e.target.value)} placeholder="https://..." className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded px-3 py-2 text-sm outline-none" />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded py-2 text-sm mt-1">Attach Link</button>
                </div>
              </form>
              
              <div className="flex-1 overflow-y-auto space-y-3">
                {attachments.map(att => (
                  <a key={att.id} href={att.file_url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-blue-300 transition group bg-white dark:bg-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-xl font-bold">🔗</div>
                      <div>
                        <h5 className="font-semibold text-slate-800 dark:text-slate-100 text-sm group-hover:text-blue-600 transition">{att.file_name}</h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex gap-2">By {att.uploader?.full_name} • {new Date(att.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="text-slate-400 group-hover:text-blue-600 transition">↗</span>
                  </a>
                ))}
                {attachments.length === 0 && <p className="text-center text-slate-400 text-sm mt-4">No attachments linked yet.</p>}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default TaskDetailModal
