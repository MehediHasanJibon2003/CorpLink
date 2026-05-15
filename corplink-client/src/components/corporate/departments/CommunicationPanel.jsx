import { useEffect, useState, useRef } from "react"
import { supabase } from "../../../lib/supabase"
import { useAuth } from "../../../context/AuthContext"
import { RefreshCw, AlertTriangle, Paperclip, FileIcon, Image as ImageIcon, X, Loader2 } from "lucide-react"

function CommunicationPanel({ activeDept, profile }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [groupId, setGroupId] = useState(null)
  const [syncError, setSyncError] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [attachedFile, setAttachedFile] = useState(null)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const resolveGroupId = async (force = false) => {
    if (!activeDept || !profile) return
    setLoading(true)
    setSyncError(null)
    
    // Resolving Group


    // Fetch all possible groups for this dept to check for duplicates
    let { data: groups, error } = await supabase
      .from("chat_groups")
      .select("id")
      .eq("reference_id", activeDept.id)
      .eq("type", "department")
      .order('created_at', { ascending: true }) // Oldest first
    
    if (error) {
      console.error("Fetch Group Error:", error)
      setSyncError(`System Error: ${error.message || "Unknown Database Error"}`)
    }

    let targetGroup = groups?.[0]

    // Cleanup logic: If multiple groups exist, we should ideally consolidate them.
    // For now, we just ensure we use the oldest one to maintain history.
    if (groups && groups.length > 1) {
      console.warn("Duplicate groups detected for this department. Using the oldest one.");
    }

    if (!targetGroup && !error) {
      // No group found, creating one...
      const { data: newGroups, error: createError } = await supabase
        .from("chat_groups")
        .insert([{
          name: `${activeDept.name} Channel`,
          company_id: profile.company_id,
          type: 'department',
          reference_id: activeDept.id
        }])
        .select()
        .limit(1)
      
      if (createError) {
        console.error("Create Group Error:", createError)
        setSyncError(`Creation Failed: ${createError.message}`)
      } else if (newGroups) {
        targetGroup = newGroups[0]
      }
    }

    if (targetGroup) {
      setGroupId(targetGroup.id)
    } else if (!syncError) {
      setSyncError("Could not establish communication link.")
    }
    setLoading(false)
  }

  // 1. Resolve Group ID
  useEffect(() => {
    resolveGroupId()
  }, [activeDept?.id, profile?.company_id])

  // 2. Setup Subscription & Load Messages
  useEffect(() => {
    if (!groupId) return

    const fetchCurrentMessages = async () => {
      // Fetching messages...
      const { data, error } = await supabase
        .from("internal_messages")
        .select(`
          *,
          sender:profiles!sender_id (
            full_name,
            role
          )
        `)
        .eq("group_id", groupId)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Message Fetch Error:", error)
        // Fallback: Fetch without join
        const { data: simpleData } = await supabase
          .from("internal_messages")
          .select("*")
          .eq("group_id", groupId)
          .order("created_at", { ascending: true })
        if (simpleData) setMessages(simpleData)
      } else if (data) {
        // Messages fetched
        setMessages(data)
      }
      setLoading(false)
    }

    fetchCurrentMessages()

    const channel = supabase
      .channel(`dept-chat-${groupId}`)
      .on('postgres_changes', {
        event: 'INSERT', 
        schema: 'public', 
        table: 'internal_messages',
        filter: `group_id=eq.${groupId}`
      }, async (payload) => {
        // Realtime Payload Received
        // Fetch full message with sender info
        const { data, error } = await supabase
          .from("internal_messages")
          .select(`
            *,
            sender:profiles!sender_id (
              full_name,
              role
            )
          `)
          .eq("id", payload.new.id)
          .single()
        
        const newMsg = !error && data ? data : payload.new
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })
      }).subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0])
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    const msg = newMessage.trim()
    if ((!msg && !attachedFile) || !user || !groupId) return

    setIsUploading(true)
    let fileUrl = null
    let fileName = null
    let fileType = null

    try {
      if (attachedFile) {
        const fileExt = attachedFile.name.split('.').pop()
        const path = `messenger/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from("task-attachments")
          .upload(path, attachedFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from("task-attachments")
          .getPublicUrl(path)

        fileUrl = publicUrl
        fileName = attachedFile.name
        fileType = attachedFile.type
      }

      const { error } = await supabase.from("internal_messages").insert([{
        group_id: groupId,
        sender_id: user.id,
        message_text: msg,
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType
      }])

      if (error) throw error

      setNewMessage("")
      setAttachedFile(null)
    } catch (err) {
      console.error("Send Error:", err)
      alert("Delivery Failed: " + err.message)
    } finally {
      setIsUploading(false)
    }
  }

  if (loading) return (
    <div className="p-20 text-center flex flex-col items-center gap-4">
      <RefreshCw className="h-10 w-10 animate-spin text-blue-500" />
      <p className="text-heading-2 font-bold text-slate-400 uppercase tracking-widest">Synchronizing Encrypted Channel...</p>
    </div>
  )

  if (syncError) return (
    <div className="p-20 text-center flex flex-col items-center gap-6 bg-red-50/50 dark:bg-red-900/10 rounded-[3rem] border-2 border-red-100 dark:border-red-900/20">
      <AlertTriangle className="h-16 w-16 text-red-500" />
      <div>
        <h3 className="text-heading-1 font-black text-red-600 uppercase">Comm Link Failure</h3>
        <p className="text-slate-500 font-bold mt-2">{syncError}</p>
      </div>
      <button 
        onClick={() => resolveGroupId(true)}
        className="px-10 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-red-700 transition-all"
      >
        Force Sync Channel
      </button>
    </div>
  )

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-[2.5rem] shadow-sm border-2 border-slate-200 dark:border-slate-700 flex flex-col h-[500px] md:h-[750px] overflow-hidden transition-all">
      <div className="p-5 md:p-10 border-b-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
        <div className="min-w-0">
          <h3 className="text-[16px] md:text-heading-1 font-black text-slate-800 dark:text-slate-100 tracking-tight truncate">#{activeDept.name.toLowerCase().replace(/\s+/g, '-')}</h3>
          <p className="text-[10px] md:text-heading-3 text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">Internal workflow channel</p>
        </div>
        <button 
          onClick={() => resolveGroupId(true)}
          className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white dark:bg-slate-800 shadow-md hover:bg-slate-50 transition-all text-blue-600 shrink-0"
          title="Refresh Channel"
        >
          <RefreshCw className="h-5 w-5 md:h-6 md:w-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-4 md:space-y-8 custom-scrollbar bg-white dark:bg-slate-800/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 italic text-[14px] md:text-heading-1 font-medium opacity-60">
            <span className="text-[32px] md:text-6xl mb-2 md:mb-4">💬</span>
            No messages yet.
          </div>
        ) : messages.map((msg) => {
          const isMe = String(msg.sender_id) === String(user?.id)
          return (
            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[90%] md:max-w-[70%]`}>
                <div className="flex items-baseline gap-2 md:gap-3 mb-1 md:mb-2 px-1 md:px-2">
                  {!isMe && <span className="text-[9px] md:text-body font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest truncate max-w-[100px]">{msg.sender?.full_name || "Member"}</span>}
                  <span className="text-[8px] md:text-label text-slate-400 font-bold uppercase">{new Date(msg.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>
                  {isMe && <span className="text-[9px] md:text-body font-black text-blue-600 uppercase tracking-widest">You</span>}
                </div>
                <div className={`px-4 py-2.5 md:px-8 md:py-6 rounded-2xl md:rounded-[2rem] text-[13px] md:text-heading-1 shadow-sm font-medium leading-relaxed transition-all hover:shadow-md ${
                  isMe 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-600'
                }`}>
                  {msg.file_url && (
                    <div className={`mb-3 p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center gap-3 md:gap-4 border-2 ${isMe ? 'bg-white/10 border-white/20' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}>
                      {msg.file_type?.startsWith('image/') ? (
                        <div className="relative group/img">
                           <img src={msg.file_url} alt={msg.file_name} className="max-w-full rounded-lg md:rounded-xl cursor-pointer" />
                           <a href={msg.file_url} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all rounded-lg md:rounded-xl text-white font-black uppercase text-[10px]">View</a>
                        </div>
                      ) : (
                        <>
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-500/20 rounded-lg md:rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                            <FileIcon className="h-5 w-5 md:h-6 md:w-6" />
                          </div>
                          <div className="min-w-0">
                             <p className="font-black text-[10px] md:text-label truncate">{msg.file_name}</p>
                             <a href={msg.file_url} target="_blank" rel="noreferrer" className={`text-[8px] md:text-[10px] font-bold uppercase tracking-widest hover:underline ${isMe ? 'text-blue-100' : 'text-blue-500'}`}>Download</a>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  {msg.message_text}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 md:p-10 border-t-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
        {attachedFile && (
          <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <FileIcon className="h-4 w-4 text-blue-500" />
                <span className="font-black text-blue-700 dark:text-blue-300 text-[10px] truncate max-w-[150px] md:max-w-[200px]">{attachedFile.name}</span>
             </div>
             <button onClick={() => setAttachedFile(null)} className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full">
                <X className="h-4 w-4 text-blue-600" />
             </button>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-2 md:gap-6">
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 md:w-24 md:h-24 rounded-full border-2 border-slate-200 dark:border-slate-700 flex flex-shrink-0 items-center justify-center text-slate-500 hover:border-blue-500 hover:text-blue-600 transition-all"
          >
             <Paperclip className="h-5 w-5 md:h-8 md:w-8" />
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <input 
            type="text" 
            value={newMessage} 
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type message..."
            className="flex-1 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 rounded-2xl md:rounded-[3rem] px-4 md:px-8 py-3 md:py-6 outline-none focus:border-blue-500 text-[13px] md:text-heading-1 font-bold transition-all shadow-inner"
          />
          <button type="submit" disabled={isUploading} className="bg-slate-900 hover:bg-black dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-full w-12 h-12 md:w-24 md:h-24 flex flex-shrink-0 items-center justify-center transition shadow-lg">
            {isUploading ? <Loader2 className="h-5 w-5 md:h-8 md:w-8 animate-spin" /> : <span className="text-[18px] md:text-5xl">➤</span>}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CommunicationPanel

