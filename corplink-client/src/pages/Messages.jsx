import { useEffect, useState, useRef, useCallback } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import AppLayout from "../components/layout/AppLayout"
import { 
  MessageCircle, 
  Search, 
  Send, 
  Hash, 
  Folder, 
  Users, 
  User, 
  Loader2, 
  AlertCircle,
  Paperclip,
  FileIcon,
  Image as ImageIcon,
  X,
  Clock,
  MoreVertical,
  CheckCheck,
  Zap,
  Building,
} from "lucide-react"

// ─── Constants ─────────────────────────────────────────────────────
const BUCKET_NAME = "task-attachments" // Reusing for unified storage

function Messages({ isEmployeeView = false }) {
  const { user, profile } = useAuth()
  
  const [contacts, setContacts] = useState([]) 
  const [groups, setGroups] = useState([])     
  const [activeChat, setActiveChat] = useState(null) 
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  
  // File Sharing State
  const [isUploading, setIsUploading] = useState(false)
  const [attachedFile, setAttachedFile] = useState(null)
  
  const [loading, setLoading] = useState(true)
  const [msgLoading, setMsgLoading] = useState(false)
  const [search, setSearch] = useState("")
  
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)

  const fetchData = useCallback(async () => {
    if (!profile?.company_id) return
    setLoading(true)
    
    try {
      // Fetch Profiles (Corporate Admins / Managers)
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("company_id", profile.company_id)

      // Fetch Employees
      const { data: emps } = await supabase
        .from("employees")
        .select("id, name, email, role, profile_photo")
        .eq("company_id", profile.company_id)

      // Fetch Chat Groups (Departments & Projects)
      const { data: rawChatGroups } = await supabase
        .from("chat_groups")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: true })

      const uniqueGroups = []
      const groupMap = new Set()
      
      rawChatGroups?.forEach(g => {
        const key = `${g.type}-${g.reference_id}`
        if (!g.reference_id || !groupMap.has(key)) {
          uniqueGroups.push(g)
          if (g.reference_id) groupMap.add(key)
        }
      })

      const allContacts = []
      const seenEmails = new Set()
      const myEmail = user.email?.toLowerCase()

      profs?.forEach(p => {
        const pEmail = p.email?.toLowerCase()
        if (pEmail === myEmail) return 
        seenEmails.add(pEmail)
        allContacts.push({
          id: p.id, 
          full_name: p.full_name,
          email: pEmail,
          role: p.role,
          type: 'admin'
        })
      })

      emps?.forEach(e => {
        const eEmail = e.email?.toLowerCase()
        if (seenEmails.has(eEmail)) return
        if (eEmail === myEmail) return
        
        allContacts.push({
          id: e.user_id || e.id, // Prefer user_id if joining with auth.users
          full_name: e.name,
          email: eEmail,
          role: e.role || 'Employee',
          photo: e.profile_photo,
          type: 'employee'
        })
      })

      setContacts(allContacts)
      setGroups(uniqueGroups || [])
    } catch (err) {
      console.error("Messenger Sync Error:", err)
    } finally {
      setLoading(false)
    }
  }, [user, profile])

  const fetchMessages = async (chat) => {
    if (!chat || (!chat.id && chat.type !== 'group')) return
    setMsgLoading(true)
    
    let query = supabase.from("internal_messages").select(`
      *,
      sender:profiles!sender_id (
        full_name,
        role
      )
    `)
    
    if (chat.type === 'group') {
      query = query.eq("group_id", chat.id)
    } else {
      query = query.or(`and(sender_id.eq.${user.id},receiver_id.eq.${chat.id}),and(sender_id.eq.${chat.id},receiver_id.eq.${user.id})`)
    }

    const { data, error } = await query.order("created_at", { ascending: true })
    
    if (error) {
      console.error("Fetch Messages Error:", error)
      // Fallback if profiles join fails
      const { data: fallbackData } = await supabase
        .from("internal_messages")
        .select("*")
        .eq(chat.type === 'group' ? "group_id" : "receiver_id", chat.id)
        .order("created_at", { ascending: true })
      setMessages(fallbackData || [])
    } else {
      setMessages(data || [])
    }
    
    setMsgLoading(false)
    scrollToBottom()
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  useEffect(() => {
    if (profile) fetchData()
  }, [profile, fetchData])

  useEffect(() => {
    if (activeChat) fetchMessages(activeChat)
    
    const subscription = supabase
      .channel('internal_messages_global')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'internal_messages' }, async (payload) => {
        const newMsgId = payload.new.id
        // Fetch full message with sender info for real-time update
        const { data: fullMsg } = await supabase
          .from("internal_messages")
          .select(`
            *,
            sender:profiles!sender_id (
              full_name,
              role
            )
          `)
          .eq("id", newMsgId)
          .single()

        const msg = fullMsg || payload.new

        if (activeChat?.type === 'group' && msg.group_id === activeChat.id) {
          setMessages(prev => [...prev, msg]); scrollToBottom()
        } else if (activeChat?.type === 'direct' && (msg.sender_id === activeChat.id || msg.receiver_id === activeChat.id)) {
          setMessages(prev => [...prev, msg]); scrollToBottom()
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(subscription) }
  }, [activeChat])

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0])
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if ((!newMessage.trim() && !attachedFile) || !activeChat) return

    setIsUploading(true)
    let fileUrl = null
    let fileName = null
    let fileType = null

    try {
      if (attachedFile) {
        const fileExt = attachedFile.name.split('.').pop()
        const path = `messenger/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(path, attachedFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(path)

        fileUrl = publicUrl
        fileName = attachedFile.name
        fileType = attachedFile.type
      }

      const messageData = {
        sender_id: user.id,
        message_text: newMessage.trim(),
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
      }

      if (activeChat.type === 'group') {
        messageData.group_id = activeChat.id
      } else {
        messageData.receiver_id = activeChat.id
      }

      const { error } = await supabase.from("internal_messages").insert([messageData])
      if (error) throw error

      setNewMessage("")
      setAttachedFile(null)
      scrollToBottom()
    } catch (err) {
      console.error("Send Error:", err)
      alert("Failed to send message: " + err.message)
    } finally {
      setIsUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-6">
        <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
        <p className="text-xl font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Secure Nodes...</p>
      </div>
    )
  }

  const filteredContacts = contacts.filter(c => (c.full_name || "").toLowerCase().includes(search.toLowerCase()))
  const filteredGroups = groups.filter(g => (g.name || "").toLowerCase().includes(search.toLowerCase()))

  const messengerContent = (
    <div className="bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] shadow-2xl border-2 border-slate-100 dark:border-white/5 overflow-hidden flex h-[800px] md:h-[900px] transition-all">
      {/* Sidebar */}
      <div className="w-80 md:w-[32rem] border-r-2 border-slate-100 dark:border-white/5 flex flex-col bg-slate-50/50 dark:bg-slate-900/30">
        <div className="p-8 border-b-2 border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Communication Hub</h3>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Online</span>
             </div>
          </div>
          <div className="relative">
            <Search className="absolute left-6 top-5 h-6 w-6 text-slate-400" />
            <input 
              type="text" placeholder="Search secure channels..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900 border-2 border-transparent focus:border-blue-500 rounded-2xl pl-16 pr-6 py-5 text-lg font-black outline-none transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-8">
          {/* Group Channels */}
          <div>
             <h5 className="px-6 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-5 flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" /> Workflow Channels
             </h5>
             <div className="space-y-2">
               {filteredGroups.map(group => (
                 <button 
                   key={group.id} onClick={() => setActiveChat({ id: group.id, name: group.name, type: 'group', sub: group.type })}
                   className={`w-full flex items-center gap-5 p-5 rounded-3xl transition-all ${activeChat?.id === group.id ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "hover:bg-white dark:hover:bg-white/5 text-slate-700 dark:text-slate-200"}`}
                 >
                   <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black ${activeChat?.id === group.id ? "bg-white/20" : "bg-slate-100 dark:bg-white/5"}`}>
                     {group.type === 'project' ? <Folder className="h-6 w-6" /> : group.type === 'department' ? <Building className="h-6 w-6" /> : <Hash className="h-6 w-6" />}
                   </div>
                   <div className="text-left flex-1 min-w-0">
                      <p className="font-black text-lg uppercase truncate">{group.name}</p>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${activeChat?.id === group.id ? "text-blue-100" : "text-slate-400"}`}>{group.type} channel</p>
                   </div>
                 </button>
               ))}
             </div>
          </div>

          {/* Direct Messages */}
          <div>
             <h5 className="px-6 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-5 flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-500" /> Direct Intelligence
             </h5>
             <div className="space-y-2">
               {filteredContacts.map(contact => (
                 <button 
                   key={contact.email} onClick={() => setActiveChat({ id: contact.id, name: contact.full_name, type: 'direct' })}
                   className={`w-full flex items-center gap-5 p-5 rounded-3xl transition-all ${activeChat?.id === contact.id ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "hover:bg-white dark:hover:bg-white/5 text-slate-700 dark:text-slate-200"}`}
                 >
                   <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black text-xl overflow-hidden ${activeChat?.id === contact.id ? "bg-white/20" : "bg-slate-100 dark:bg-white/5"}`}>
                      {contact.photo ? (
                        <img src={contact.photo} alt={contact.full_name} className="w-full h-full object-cover" />
                      ) : (
                        contact.full_name.charAt(0)
                      )}
                   </div>
                   <div className="text-left flex-1 min-w-0">
                      <p className="font-black text-lg uppercase truncate">{contact.full_name}</p>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${activeChat?.id === contact.id ? "text-blue-100" : "text-slate-400"}`}>{contact.role}</p>
                   </div>
                 </button>
               ))}
             </div>
          </div>
        </div>
      </div>

      {/* Main Chat Canvas */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900/10 relative">
        {activeChat ? (
          <>
            <div className="p-8 border-b-2 border-slate-100 dark:border-white/5 flex items-center justify-between bg-white dark:bg-slate-800">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg">
                  {activeChat.type === 'group' ? (activeChat.sub === 'project' ? <Folder className="h-8 w-8" /> : <Hash className="h-8 w-8" />) : activeChat.name.charAt(0)}
                </div>
                <div>
                   <h3 className="font-black text-2xl text-slate-900 dark:text-white uppercase tracking-tight">{activeChat.name}</h3>
                   <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Link Established</p>
                   </div>
                </div>
              </div>
              <button className="p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400 transition-all">
                 <MoreVertical className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 custom-scrollbar">
              {msgLoading ? (
                <div className="flex flex-col justify-center items-center h-full gap-4">
                   <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                   <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Retrieving Messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-8 opacity-40">
                  <div className="w-32 h-32 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                    <MessageCircle className="h-16 w-16" />
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black uppercase tracking-widest">Secure Channel Initialized</p>
                    <p className="text-lg font-bold mt-2">Start the conversation below</p>
                  </div>
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = String(msg.sender_id) === String(user?.id)
                  const senderName = msg.sender?.full_name || "Member"
                  return (
                    <div key={msg.id} className={`flex w-full ${isMine ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
                       <div className={`max-w-[85%] md:max-w-[70%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                          <div className="flex items-center gap-3 mb-2 px-2">
                             {!isMine && <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{senderName}</span>}
                             <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</span>
                             {isMine && <CheckCheck className="h-3 w-3 text-blue-500" />}
                          </div>
                          
                          <div className={`px-8 py-6 rounded-[2rem] shadow-sm transition-all hover:shadow-md ${
                            isMine 
                              ? "bg-blue-600 text-white rounded-tr-none shadow-blue-500/20" 
                              : "bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 text-slate-800 dark:text-slate-100 rounded-tl-none"
                          }`}>
                             {msg.file_url && (
                               <div className={`mb-4 p-4 rounded-2xl flex items-center gap-4 border-2 ${isMine ? 'bg-white/10 border-white/20' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}>
                                  {msg.file_type?.startsWith('image/') ? (
                                    <div className="relative group/img">
                                       <img src={msg.file_url} alt={msg.file_name} className="max-w-full rounded-xl cursor-pointer" />
                                       <a href={msg.file_url} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all rounded-xl text-white font-black uppercase text-xs">View Original</a>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-500">
                                        <FileIcon className="h-6 w-6" />
                                      </div>
                                      <div className="min-w-0">
                                         <p className="font-black text-sm truncate">{msg.file_name}</p>
                                         <a href={msg.file_url} target="_blank" rel="noreferrer" className={`text-[10px] font-bold uppercase tracking-widest hover:underline ${isMine ? 'text-blue-100' : 'text-blue-500'}`}>Download Asset</a>
                                      </div>
                                    </>
                                  )}
                               </div>
                             )}
                             {msg.message_text && <p className="text-lg md:text-2xl font-medium leading-relaxed">{msg.message_text}</p>}
                          </div>
                       </div>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div className="p-8 md:p-12 border-t-2 border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800">
              {attachedFile && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border-2 border-blue-200 dark:border-blue-800 flex items-center justify-between animate-in slide-in-from-bottom-2">
                   <div className="flex items-center gap-4">
                      {attachedFile.type.startsWith('image/') ? <ImageIcon className="h-6 w-6 text-blue-500" /> : <FileIcon className="h-6 w-6 text-blue-500" />}
                      <span className="font-black text-blue-700 dark:text-blue-300 text-sm">{attachedFile.name}</span>
                   </div>
                   <button onClick={() => setAttachedFile(null)} className="p-2 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full transition-all">
                      <X className="h-5 w-5 text-blue-600" />
                   </button>
                </div>
              )}
              
              <form onSubmit={handleSend} className="flex gap-4 md:gap-6">
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:border-blue-500 hover:text-blue-600 transition-all bg-slate-50 dark:bg-slate-900"
                >
                   <Paperclip className="h-6 w-6 md:h-8 md:w-8" />
                </button>
                <input 
                  type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden"
                />
                
                <input
                  type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a secure message to this channel..."
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-[2.5rem] px-8 py-5 text-lg md:text-2xl font-bold outline-none focus:border-blue-500 transition-all shadow-inner"
                />
                
                <button 
                  type="submit" 
                  disabled={isUploading || (!newMessage.trim() && !attachedFile)} 
                  className="w-16 h-16 md:w-24 md:h-24 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xl disabled:opacity-50 disabled:grayscale"
                >
                   {isUploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <span className="text-3xl md:text-5xl ml-1">➤</span>}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-10 opacity-30">
             <div className="w-48 h-48 rounded-[3rem] bg-slate-100 dark:bg-white/5 flex items-center justify-center border-4 border-dashed border-slate-200 dark:border-slate-700">
                <MessageCircle className="h-24 w-24" />
             </div>
             <div className="text-center">
                <p className="text-3xl font-black uppercase tracking-[0.3em]">Communication Array Offline</p>
                <p className="text-xl font-bold mt-4">Select a channel from the left to synchronize</p>
             </div>
          </div>
        )}
      </div>
    </div>
  )

  if (isEmployeeView) return messengerContent

  return (
    <AppLayout title="Corporate Messenger" subtitle="Unified Real-time Communication">
      {messengerContent}
    </AppLayout>
  )
}

export default Messages
