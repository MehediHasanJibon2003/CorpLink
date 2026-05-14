import { useEffect, useState, useRef } from "react"
import { supabase } from "../../lib/supabase"
import { logAdminActivity } from "../../utils/logger"
import { X, Send, Paperclip, Link as LinkIcon, CheckCircle2, AlertCircle, Clock, Trash2, ShieldCheck, User as UserIcon, Edit3, Save, Folder, Calendar, Flag, Loader2 } from "lucide-react"
import { checkPermission } from "../../utils/permissions"
import { createNotification } from "../../utils/notificationUtils"

function TaskDetailModal({ task, onClose, profile, onUpdate, initialTab = "comments" }) {
  const [comments, setComments] = useState([])
  const [attachments, setAttachments] = useState([])
  const [projects, setProjects] = useState([])
  const [newComment, setNewComment] = useState("")
  const [employees, setEmployees] = useState([])
  
  const [activeTab, setActiveTab] = useState("comments") 
  const [uploading, setUploading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(null) // which status is being updated
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkData, setLinkData] = useState({ name: "", url: "" })

  const [currentTask, setCurrentTask] = useState(task)

  // Edit Mode for Task Details
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: task.title,
    description: task.description || "",
    assigned_to: task.assigned_to || "",
    project_id: task.project_id || "",
    deadline: task.deadline || "",
    priority: task.priority || "medium"
  })

  const messagesEndRef = useRef(null)
  
  // Permission Context
  const permContext = {
    departmentId: currentTask.department_id,
    assignedToId: currentTask.assigned_to,
    createdById: currentTask.created_by
  }

  const canEdit = checkPermission(profile, 'edit_task', permContext)
  const canManage = checkPermission(profile, 'manage_tasks', permContext)
  const isRestricted = profile?.role?.toLowerCase() === 'restricted'
  const isManagement = ['admin', 'corporate_admin', 'manager', 'dept_head'].includes(profile?.role?.toLowerCase())

  const fetchData = async () => {
    const [tRes, cRes, aRes, eRes, pRes] = await Promise.all([
      supabase.from("tasks").select("*").eq("id", task.id).single(),
      supabase.from("task_comments").select("*, profiles(full_name, role)").eq("task_id", task.id).order("created_at", { ascending: true }),
      supabase.from("task_attachments").select("*, profiles(full_name)").eq("task_id", task.id).order("created_at", { ascending: false }),
      supabase.from("employees").select("id, name").eq("company_id", profile.company_id),
      supabase.from("projects").select("id, name").eq("company_id", profile.company_id)
    ])

    if (tRes.data) setCurrentTask(tRes.data)
    if (cRes.data) setComments(cRes.data.map(c => ({ ...c, sender: c.profiles ? { full_name: c.profiles.full_name, role: c.profiles.role } : null })))
    if (aRes.data) setAttachments(aRes.data.map(a => ({ ...a, uploader: a.profiles ? { full_name: a.profiles.full_name } : null })))
    if (eRes.data) setEmployees(eRes.data)
    if (pRes.data) setProjects(pRes.data)
  }

  useEffect(() => {
    fetchData()
    if (initialTab) setActiveTab(initialTab)
  }, [task.id, initialTab])

  useEffect(() => {
    if (activeTab === 'comments') messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [comments, activeTab])

  const handleStatusChange = async (newStatus) => {
    if (!isManagement && (newStatus === 'finished' || newStatus === 'rejected')) {
      alert("Only Admins or Managers can Approve/Reject tasks.")
      return
    }

    setStatusLoading(newStatus)
    const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", task.id)
    
    if (!error) {
      await logAdminActivity({ 
        company_id: profile.company_id, user_id: profile.id, 
        action: `Task Tracking Update: ${task.title} -> ${newStatus}`, entity: "task" 
      })

      // Notify the relevant person
      if (newStatus === 'needs_review') {
        // Notify creator or admin that task needs review
        await createNotification(
          currentTask.created_by,
          profile.company_id,
          'task_update',
          `Task Awaiting Review: ${currentTask.title}`
        )
      } else if (newStatus === 'finished' || newStatus === 'rejected') {
        // Notify assigned employee about approval/rejection
        await createNotification(
          currentTask.assigned_to,
          profile.company_id,
          newStatus === 'finished' ? 'approval' : 'task_update',
          `Task ${newStatus === 'finished' ? 'Approved' : 'Rejected'}: ${currentTask.title}`
        )
      }

      await fetchData()
      onUpdate() 
    } else {
      alert("Failed to update status: " + error.message)
    }
    setStatusLoading(null)
  }

  const handleUpdateTask = async () => {
    const { error } = await supabase.from("tasks").update({
      title: editForm.title,
      description: editForm.description,
      assigned_to: editForm.assigned_to || null,
      project_id: editForm.project_id || null,
      deadline: editForm.deadline || null,
      priority: editForm.priority
    }).eq("id", task.id)

    if (!error) {
      setIsEditing(false)
      fetchData()
      onUpdate()
    } else {
      alert("Update failed: " + error.message)
    }
  }

  const handlePostComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    const { error } = await supabase.from("task_comments").insert([{ task_id: task.id, sender_id: profile.id, content: newComment.trim() }])
    if (!error) { setNewComment(""); fetchData() }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `tasks/${task.id}/${fileName}`
      const { error: uploadError } = await supabase.storage.from('task-attachments').upload(filePath, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('task-attachments').getPublicUrl(filePath)
      await supabase.from("task_attachments").insert([{ task_id: task.id, uploader_id: profile.id, file_name: file.name, file_url: publicUrl }])
      fetchData()
    } catch (err) { alert("Upload failed: " + err.message) } finally { setUploading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center sm:p-4">
      <div className="bg-white dark:bg-slate-800 sm:rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl w-full max-w-7xl h-full sm:max-h-[92vh] flex flex-col lg:flex-row overflow-hidden animate-in zoom-in-95 duration-300 border border-white/10">
        
        {/* Left Side: Info & Controls */}
        <div className="w-full lg:w-[42%] bg-slate-50 dark:bg-slate-900/40 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-white/5 p-6 md:p-12 flex flex-col overflow-y-auto custom-scrollbar shrink-0">
          <div className="flex justify-between items-start mb-6 md:mb-8">
            <div className="flex flex-col gap-2">
               <span className={`w-fit text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-sm
                ${currentTask.status==='pending' ? 'bg-slate-100 text-slate-500' :
                  currentTask.status==='in_progress' ? 'bg-blue-100 text-blue-600' :
                  currentTask.status==='needs_review' ? 'bg-amber-100 text-amber-600' :
                  currentTask.status==='finished' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                {currentTask.status.replace("_", " ")}
              </span>
            </div>
            <div className="flex gap-2">
              {canEdit && (
                <button onClick={() => setIsEditing(!isEditing)} className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl transition shadow-sm border ${isEditing ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-white/5'}`}>
                  {isEditing ? <Save className="h-4 w-4 md:h-5 md:w-5" onClick={handleUpdateTask} /> : <Edit3 className="h-4 w-4 md:h-5 md:w-5" />}
                </button>
              )}
              <button onClick={onClose} className="text-slate-400 hover:text-red-500 bg-white dark:bg-slate-800 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl transition shadow-sm border border-slate-100 dark:border-white/5"><X className="h-5 w-5 md:h-6 md:w-6" /></button>
            </div>
          </div>
          
          {isEditing ? (
            <div className="space-y-4 md:space-y-6 animate-in slide-in-from-top-2">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Title</label>
                  <input type="text" value={editForm.title} onChange={e=>setEditForm({...editForm, title: e.target.value})} className="w-full bg-white dark:bg-slate-900 border-2 border-blue-500 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 text-body md:text-heading-2 font-black uppercase tracking-tight outline-none" />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Description</label>
                  <textarea value={editForm.description} onChange={e=>setEditForm({...editForm, description: e.target.value})} className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 text-[12px] md:text-heading-3 font-medium outline-none min-h-[100px]" />
               </div>
               <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-2">
                     <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest px-1 flex items-center gap-1"><Flag className="h-3 w-3" /> Priority</label>
                     <select value={editForm.priority} onChange={e=>setEditForm({...editForm, priority: e.target.value})} className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-xl px-3 md:px-4 py-2 md:py-3 text-[11px] md:text-body font-bold outline-none">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest px-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> Deadline</label>
                     <input type="date" value={editForm.deadline} onChange={e=>setEditForm({...editForm, deadline: e.target.value})} className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-xl px-3 md:px-4 py-2 md:py-3 text-[11px] md:text-body font-bold outline-none" />
                  </div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-2">
                     <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest px-1 flex items-center gap-1"><Folder className="h-3 w-3" /> Project</label>
                     <select value={editForm.project_id} onChange={e=>setEditForm({...editForm, project_id: e.target.value})} className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-xl px-3 md:px-4 py-2 md:py-3 text-[11px] md:text-body font-bold outline-none">
                        <option value="">Inbox</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest px-1 flex items-center gap-1"><UserIcon className="h-3 w-3" /> Agent</label>
                     <select value={editForm.assigned_to} onChange={e=>setEditForm({...editForm, assigned_to: e.target.value})} className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-xl px-3 md:px-4 py-2 md:py-3 text-[11px] md:text-body font-bold outline-none">
                        <option value="">Unassigned</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                     </select>
                  </div>
               </div>
               <button onClick={handleUpdateTask} className="w-full bg-blue-600 text-white py-4 md:py-5 rounded-2xl font-black uppercase text-[12px] md:text-label tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Save Changes</button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 md:mb-6 tracking-tight uppercase leading-tight">{currentTask.title}</h2>
              <p className="text-slate-600 dark:text-slate-300 text-body md:text-heading-2 mb-8 md:mb-12 font-medium leading-relaxed opacity-80">{currentTask.description || "No description provided."}</p>
            </>
          )}
          
          <div className="mt-auto space-y-8 md:space-y-10">
            {/* Approval Workflow */}
            <div className="bg-white dark:bg-white/5 rounded-2xl md:rounded-3xl p-4 md:p-8 border-2 border-slate-100 dark:border-white/5">
              <h4 className="font-black text-slate-400 text-[9px] md:text-[10px] uppercase tracking-[0.2em] mb-4 md:mb-6 flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 md:h-4 md:w-4" /> Progress Tracking
              </h4>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <button 
                  disabled={statusLoading || currentTask.status === 'finished'} 
                  onClick={() => handleStatusChange("in_progress")} 
                  className="flex flex-col items-center gap-1 md:gap-2 p-3 md:p-5 rounded-xl md:rounded-2xl bg-blue-50 dark:bg-blue-600/10 text-blue-600 font-black text-[9px] md:text-[10px] uppercase tracking-widest border-2 border-transparent hover:border-blue-200 transition disabled:opacity-30"
                >
                  {statusLoading === 'in_progress' ? <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" /> : <Clock className="h-4 w-4 md:h-5 md:w-5" />} Start
                </button>
                <button 
                  disabled={statusLoading || currentTask.status === 'finished'} 
                  onClick={() => handleStatusChange("needs_review")} 
                  className="flex flex-col items-center gap-1 md:gap-2 p-3 md:p-5 rounded-xl md:rounded-2xl bg-amber-50 dark:bg-amber-600/10 text-amber-600 font-black text-[9px] md:text-[10px] uppercase tracking-widest border-2 border-transparent hover:border-amber-200 transition disabled:opacity-30"
                >
                  {statusLoading === 'needs_review' ? <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" /> : <Send className="h-4 w-4 md:h-5 md:w-5" />} Review
                </button>
                <button 
                  disabled={statusLoading || !canManage || currentTask.status === 'finished'} 
                  onClick={() => handleStatusChange("finished")} 
                  className="flex flex-col items-center gap-1 md:gap-2 p-3 md:p-5 rounded-xl md:rounded-2xl bg-emerald-50 dark:bg-emerald-600/10 text-emerald-600 font-black text-[9px] md:text-[10px] uppercase tracking-widest border-2 border-transparent hover:border-emerald-200 transition disabled:opacity-30"
                >
                  {statusLoading === 'finished' ? <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" /> : <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" />} Approve
                </button>
                <button 
                  disabled={statusLoading || !canManage || currentTask.status === 'finished'} 
                  onClick={() => handleStatusChange("rejected")} 
                  className="flex flex-col items-center gap-1 md:gap-2 p-3 md:p-5 rounded-xl md:rounded-2xl bg-red-50 dark:bg-red-600/10 text-red-600 font-black text-[9px] md:text-[10px] uppercase tracking-widest border-2 border-transparent hover:border-red-200 transition disabled:opacity-30"
                >
                  {statusLoading === 'rejected' ? <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" /> : <AlertCircle className="h-4 w-4 md:h-5 md:w-5" />} Reject
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:gap-8 pb-4">
               <div>
                  <p className="text-slate-400 font-black text-[9px] md:text-[10px] uppercase tracking-widest mb-1.5 md:mb-3">Project</p>
                  <div className="flex items-center gap-2 md:gap-3">
                     <Folder className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-500" />
                     <span className="font-black text-slate-800 dark:text-white text-[12px] md:text-heading-3 uppercase tracking-tight truncate">{projects.find(p => p.id === currentTask.project_id)?.name || "Global Inbox"}</span>
                  </div>
               </div>
               <div>
                  <p className="text-slate-400 font-black text-[9px] md:text-[10px] uppercase tracking-widest mb-1.5 md:mb-3">Agent</p>
                  <div className="flex items-center gap-2 md:gap-3">
                     <UserIcon className="h-3.5 w-3.5 md:h-4 md:w-4 text-indigo-500" />
                     <span className="font-black text-slate-800 dark:text-white text-[12px] md:text-heading-3 uppercase tracking-tight truncate">{employees.find(e => e.id === currentTask.assigned_to)?.name || "Unassigned"}</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Right Side: Comms & Assets */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-800/80 min-h-[400px] lg:min-h-0 overflow-hidden">
          <div className="flex bg-slate-50/50 dark:bg-white/5 p-1.5 md:p-2">
            {['comments', 'attachments'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 md:py-5 font-black text-[10px] md:text-label uppercase tracking-[0.2em] transition-all rounded-xl md:rounded-2xl ${activeTab === tab ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm border border-slate-100 dark:border-white/5' : 'text-slate-400 hover:text-slate-600'}`}>
                {tab === 'comments' ? 'Activity' : `Assets (${attachments.length})`}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === 'comments' ? (
              <>
                <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-6 md:space-y-8 custom-scrollbar">
                  {comments.map((msg) => {
                    const isMe = msg.sender_id === profile.id
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
                        <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2 px-2">
                          <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">{msg.sender?.full_name?.split(' ')[0] || "Unknown"}</span>
                          <span className="text-[9px] md:text-[10px] text-slate-300 font-bold">{new Date(msg.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>
                        </div>
                        <div className={`px-5 py-3 md:px-8 md:py-5 rounded-2xl md:rounded-[2rem] max-w-[90%] md:max-w-[85%] text-[13px] md:text-heading-2 font-medium shadow-sm leading-relaxed border ${isMe ? 'bg-slate-900 text-white rounded-tr-sm border-slate-800' : 'bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-100 rounded-tl-sm border-slate-100 dark:border-white/5'}`}>
                          {msg.content}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-4 md:p-10 border-t-2 border-slate-50 dark:border-white/5">
                  <form onSubmit={handlePostComment} className="flex gap-3 md:gap-4">
                    <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Type update..." className="flex-1 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-white/5 rounded-full px-5 md:px-8 py-3 md:py-5 outline-none focus:border-blue-500/50 text-[13px] md:text-heading-3 font-bold" />
                    <button type="submit" disabled={!newComment.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center transition shadow-lg shadow-blue-500/20 active:scale-90 shrink-0"><Send className="h-5 w-5 md:h-6 md:w-6" /></button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-6 md:space-y-8 custom-scrollbar">
                {!isRestricted && (
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                     <label className="flex flex-col items-center justify-center p-4 md:p-8 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl md:rounded-3xl bg-slate-50/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all cursor-pointer group">
                        <Paperclip className="h-5 w-5 md:h-8 md:w-8 text-slate-400 group-hover:text-blue-500 mb-1.5 md:mb-2" />
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">{uploading ? "..." : "Attach"}</span>
                        <input type="file" onChange={handleFileUpload} disabled={uploading} className="hidden" />
                     </label>
                     <button onClick={() => setShowLinkInput(!showLinkInput)} className="flex flex-col items-center justify-center p-4 md:p-8 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl md:rounded-3xl bg-slate-50/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all group">
                        <LinkIcon className="h-5 w-5 md:h-8 md:w-8 text-slate-400 group-hover:text-blue-500 mb-1.5 md:mb-2" />
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-500">Link</span>
                     </button>
                  </div>
                )}
                {attachments.map(att => (
                  <div key={att.id} className="group bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 p-4 md:p-6 rounded-2xl md:rounded-3xl hover:border-blue-500/30 transition-all flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3 md:gap-5">
                       <div className="w-10 h-10 md:w-14 md:h-14 bg-slate-100 dark:bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center"><LinkIcon className="h-5 w-5 md:h-6 md:w-6 text-slate-400 group-hover:text-blue-600" /></div>
                       <div className="truncate max-w-[150px] sm:max-w-none">
                          <h5 className="text-[12px] md:text-heading-3 font-black text-slate-800 dark:text-white uppercase tracking-tight line-clamp-1">{att.file_name}</h5>
                          <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">By {att.uploader?.full_name?.split(' ')[0] || "System"}</p>
                       </div>
                    </div>
                    <a href={att.file_url} target="_blank" rel="noreferrer" className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 dark:bg-white/5 rounded-lg md:rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-600/20 transition-all shadow-sm"><Send className="h-4 w-4 md:h-5 md:w-5 rotate-45" /></a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskDetailModal

