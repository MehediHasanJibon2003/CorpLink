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
      <div className="bg-white dark:bg-slate-800 rounded-3xl md:rounded-[2.5rem] shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95">
        
        {/* Left Side: Task Info & Workflow */}
        <div className="w-full md:w-[45%] bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-700 p-6 md:p-10 lg:p-12 flex flex-col overflow-y-auto">
          <div className="flex justify-between items-start mb-6 md:mb-8">
            <span className={`text-sm md:text-base px-4 py-1.5 md:px-5 md:py-2 rounded-full font-bold uppercase tracking-wider
              ${task.status==='pending' ? 'bg-slate-200 text-slate-700' :
                task.status==='in_progress' ? 'bg-blue-200 text-blue-800' :
                task.status==='needs_review' ? 'bg-amber-200 text-amber-800' :
                task.status==='finished' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
              {task.status.replace("_", " ")}
            </span>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full transition text-lg md:text-xl">✕</button>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-4 md:mb-6 leading-tight">{task.title}</h2>
          <p className="text-slate-600 dark:text-slate-300 text-base md:text-xl mb-8 md:mb-10 leading-relaxed">{task.description}</p>
          
          <div className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 p-6 md:p-8 mb-8 md:mb-10 shadow-sm">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base uppercase tracking-wider mb-4 md:mb-6">Workflow Controls</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <button disabled={task.status === 'in_progress'} onClick={() => handleStatusChange("in_progress")} className="py-3 md:py-4 text-base md:text-lg font-bold rounded-xl md:rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 disabled:opacity-50 transition">
                Start Work
              </button>
              <button disabled={task.status === 'needs_review'} onClick={() => handleStatusChange("needs_review")} className="py-3 md:py-4 text-base md:text-lg font-bold rounded-xl md:rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 disabled:opacity-50 transition">
                Submit for Review
              </button>
              <button disabled={task.status === 'finished'} onClick={() => handleStatusChange("finished")} className="py-3 md:py-4 text-base md:text-lg font-bold rounded-xl md:rounded-2xl bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50 hover:bg-green-100 disabled:opacity-50 transition">
                Approve (Finish)
              </button>
              <button disabled={task.status === 'rejected'} onClick={() => handleStatusChange("rejected")} className="py-3 md:py-4 text-base md:text-lg font-bold rounded-xl md:rounded-2xl bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50 hover:bg-red-100 disabled:opacity-50 transition">
                Reject
              </button>
            </div>
          </div>

          <div className="space-y-6 text-base md:text-lg">
            <div>
              <p className="text-slate-500 font-bold mb-2 uppercase tracking-wide text-xs md:text-sm">Assignee</p>
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-lg md:text-xl">👤</div>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-lg md:text-2xl">{employees.find(e => e.id === task.assigned_to)?.name || "Unassigned"}</span>
              </div>
            </div>
            <div>
              <p className="text-slate-500 font-bold mb-2 uppercase tracking-wide text-xs md:text-sm">Deadline</p>
              <p className="text-slate-800 dark:text-slate-100 font-bold text-lg md:text-2xl">{task.deadline ? new Date(task.deadline).toLocaleDateString() : "No Deadline set"}</p>
            </div>
          </div>
        </div>

        {/* Right Side: Discussions & Attachments */}
        <div className="w-full md:w-[55%] flex flex-col bg-white dark:bg-slate-800">
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            <button onClick={() => setActiveTab('comments')} className={`flex-1 py-4 md:py-6 font-bold text-base md:text-xl transition border-b-4 ${activeTab === 'comments' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Activity & Comments</button>
            <button onClick={() => setActiveTab('attachments')} className={`flex-1 py-4 md:py-6 font-bold text-base md:text-xl transition border-b-4 ${activeTab === 'attachments' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Files & Links ({attachments.length})</button>
          </div>

          {activeTab === 'comments' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                {comments.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 italic text-base md:text-xl">No activity recorded yet. Say hello!</div>
                ) : comments.map((msg) => {
                  const isMe = msg.sender_id === profile.id
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-baseline gap-2 mb-2 px-1">
                        <span className="text-sm md:text-lg font-bold text-slate-700 dark:text-slate-200">{msg.sender?.full_name || "Unknown"}</span>
                        <span className="text-xs md:text-sm text-slate-400">{new Date(msg.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>
                      </div>
                      <div className={`px-6 py-4 rounded-2xl md:rounded-3xl max-w-[85%] text-base md:text-lg shadow-sm leading-relaxed ${isMe ? 'bg-slate-800 dark:bg-blue-700 text-white rounded-tr-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-sm'}`}>
                        {msg.content}
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-6 md:p-8 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                <form onSubmit={handlePostComment} className="flex gap-3 md:gap-4">
                  <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Write an update..." className="flex-1 bg-slate-50 dark:bg-slate-900/50 border md:border-2 border-slate-200 dark:border-slate-700 rounded-full px-6 py-3 md:px-8 md:py-4 outline-none focus:border-slate-400 text-base md:text-lg" />
                  <button type="submit" disabled={!newComment.trim()} className="bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 disabled:opacity-50 text-white rounded-full px-8 py-3 md:px-10 md:py-4 font-bold transition text-base md:text-lg">Post</button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="flex-1 flex flex-col overflow-hidden p-6 md:p-10 gap-8 md:gap-10">
              <form onSubmit={handleUploadLink} className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-2xl md:rounded-3xl border-2 border-slate-200 dark:border-slate-700 border-dashed">
                <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-4 md:mb-6 text-base md:text-xl">Attach new Document / URL</h4>
                <div className="flex flex-col gap-3 md:gap-4">
                  <input type="text" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. Figma Design, Google Doc" className="border md:border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-xl md:rounded-2xl px-4 py-3 md:px-6 md:py-4 text-base md:text-lg outline-none" />
                  <input type="url" value={newUrl} onChange={e=>setNewUrl(e.target.value)} placeholder="https://..." className="border md:border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-xl md:rounded-2xl px-4 py-3 md:px-6 md:py-4 text-base md:text-lg outline-none" />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl md:rounded-2xl py-3 md:py-4 text-base md:text-lg mt-3 md:mt-4 shadow-md transition hover:-translate-y-0.5">Attach Link</button>
                </div>
              </form>
              
              <div className="flex-1 overflow-y-auto space-y-4 md:space-y-6">
                {attachments.map(att => (
                  <a key={att.id} href={att.file_url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-5 md:p-6 rounded-2xl md:rounded-3xl border md:border-2 border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-blue-300 transition group bg-white dark:bg-slate-800">
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl md:rounded-2xl flex items-center justify-center text-2xl md:text-3xl font-black">🔗</div>
                      <div>
                        <h5 className="font-bold text-slate-800 dark:text-slate-100 text-base md:text-2xl group-hover:text-blue-600 transition mb-1">{att.file_name}</h5>
                        <p className="text-xs md:text-base text-slate-500 dark:text-slate-400 flex gap-2">By {att.uploader?.full_name} • {new Date(att.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="text-slate-400 group-hover:text-blue-600 transition text-xl md:text-3xl font-black">↗</span>
                  </a>
                ))}
                {attachments.length === 0 && <p className="text-center text-slate-400 text-base md:text-xl mt-6 font-medium italic">No attachments linked yet.</p>}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default TaskDetailModal
