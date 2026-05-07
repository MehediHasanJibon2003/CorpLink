import { useEffect, useState, useRef } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import AppLayout from "../components/layout/AppLayout"
import { MessageCircle, Search, Send, Hash, Folder, Users, User, Loader2, AlertCircle } from "lucide-react"

function Messages({ isEmployeeView = false }) {
  const { user, profile } = useAuth()
  
  const [contacts, setContacts] = useState([]) 
  const [groups, setGroups] = useState([])     
  const [activeChat, setActiveChat] = useState(null) 
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  
  const [loading, setLoading] = useState(true)
  const [msgLoading, setMsgLoading] = useState(false)
  const [search, setSearch] = useState("")
  
  const bottomRef = useRef(null)

  const fetchData = async () => {
    if (!profile?.company_id) return
    setLoading(true)
    
    try {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("company_id", profile.company_id)

      const { data: emps } = await supabase
        .from("employees")
        .select("id, name, email, role, onboarded")
        .eq("company_id", profile.company_id)

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
          onboarded: true
        })
      })

      emps?.forEach(e => {
        const eEmail = e.email?.toLowerCase()
        if (seenEmails.has(eEmail)) return
        if (eEmail === myEmail) return
        
        allContacts.push({
          id: null, 
          full_name: e.name,
          email: eEmail,
          role: e.role,
          onboarded: false
        })
      })

      setContacts(allContacts)
      setGroups(uniqueGroups || [])
    } catch (err) {
      console.error("Messenger Sync Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (chat) => {
    if (!chat || (!chat.id && chat.type !== 'group')) return
    setMsgLoading(true)
    
    let query = supabase.from("internal_messages").select("*")
    
    if (chat.type === 'group') {
      query = query.eq("group_id", chat.id)
    } else {
      query = query.or(`and(sender_id.eq.${user.id},receiver_id.eq.${chat.id}),and(sender_id.eq.${chat.id},receiver_id.eq.${user.id})`)
    }

    const { data, error } = await query.order("created_at", { ascending: true })
    if (error) console.error("Fetch Messages Error:", error)
    setMessages(data || [])
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
  }, [profile])

  useEffect(() => {
    if (activeChat) fetchMessages(activeChat)
    
    const subscription = supabase
      .channel('internal_messages_global')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'internal_messages' }, payload => {
        const newMsg = payload.new
        if (activeChat?.type === 'group' && newMsg.group_id === activeChat.id) {
          setMessages(prev => [...prev, newMsg]); scrollToBottom()
        } else if (activeChat?.type === 'direct' && (newMsg.sender_id === activeChat.id || newMsg.receiver_id === activeChat.id)) {
          setMessages(prev => [...prev, newMsg]); scrollToBottom()
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(subscription) }
  }, [activeChat])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeChat) return

    const messageData = {
      sender_id: user.id,
      message_text: newMessage.trim(),
    }

    if (activeChat.type === 'group') {
      messageData.group_id = activeChat.id
    } else {
      messageData.receiver_id = activeChat.id
    }

    const { error } = await supabase.from("internal_messages").insert([messageData])
    if (!error) {
      setNewMessage("")
      scrollToBottom()
    }
  }

  if (loading) return <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">Syncing Communication Hub...</div>

  const filteredContacts = contacts.filter(c => (c.full_name || "").toLowerCase().includes(search.toLowerCase()))
  const filteredGroups = groups.filter(g => (g.name || "").toLowerCase().includes(search.toLowerCase()))

  const messengerContent = (
    <div className="bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] shadow-sm border-2 border-slate-100 dark:border-white/5 overflow-hidden flex h-[750px] md:h-[850px]">
      {/* Sidebar */}
      <div className="w-80 md:w-[32rem] border-r-2 border-slate-100 dark:border-white/5 flex flex-col bg-slate-50/50 dark:bg-slate-900/30">
        <div className="p-8 border-b-2 border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white mb-6">Messenger Hub</h3>
          <div className="relative">
            <Search className="absolute left-6 top-5 h-6 w-6 text-slate-400" />
            <input 
              type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900 border-2 border-transparent focus:border-blue-500 rounded-2xl pl-16 pr-6 py-5 text-lg font-black outline-none"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-8">
          <div>
             <h5 className="px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2"><Users className="h-3 w-3" /> Broadcast Channels</h5>
             <div className="space-y-2">
               {filteredGroups.map(group => (
                 <button 
                   key={group.id} onClick={() => setActiveChat({ id: group.id, name: group.name, type: 'group' })}
                   className={`w-full flex items-center gap-5 p-5 rounded-3xl transition-all ${activeChat?.id === group.id ? "bg-blue-600 text-white" : "hover:bg-white dark:hover:bg-white/5 text-slate-700 dark:text-slate-200"}`}
                 >
                   <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center font-black">
                     {group.type === 'project' ? <Folder className="h-6 w-6" /> : <Hash className="h-6 w-6" />}
                   </div>
                   <div className="text-left"><p className="font-black text-lg uppercase">{group.name}</p></div>
                 </button>
               ))}
             </div>
          </div>

          <div>
             <h5 className="px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2"><User className="h-3 w-3" /> Team Colleagues</h5>
             <div className="space-y-2">
               {filteredContacts.map(contact => (
                 <button 
                   key={contact.email} onClick={() => setActiveChat({ id: contact.id, name: contact.full_name, type: 'direct' })}
                   className={`w-full flex items-center gap-5 p-5 rounded-3xl transition-all ${activeChat?.name === contact.full_name ? "bg-blue-600 text-white" : "hover:bg-white dark:hover:bg-white/5 text-slate-700 dark:text-slate-200"}`}
                 >
                   <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center font-black text-xl">{contact.full_name.charAt(0)}</div>
                   <div className="text-left"><p className="font-black text-lg uppercase">{contact.full_name}</p></div>
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
                <div className="h-16 w-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl">{activeChat.name.charAt(0)}</div>
                <h3 className="font-black text-2xl text-slate-900 dark:text-white uppercase tracking-tight">{activeChat.name}</h3>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
              {msgLoading ? (
                <div className="flex justify-center items-center h-full"><Loader2 className="h-12 w-12 animate-spin text-blue-500" /></div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-6 opacity-40">
                  <MessageCircle className="h-24 w-24" />
                  <p className="text-xl font-black uppercase tracking-widest">No messages yet</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = String(msg.sender_id) === String(user?.id)
                  return (
                    <div key={msg.id} className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}>
                       <div className={`max-w-[75%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                          <p className="text-[10px] font-black text-slate-400 mb-1 px-2">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</p>
                          <div className={`px-6 py-4 rounded-2xl shadow-sm ${
                            isMine ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 text-slate-800 dark:text-slate-100"
                          }`}>
                             <p className="text-base md:text-xl font-medium">{msg.message_text}</p>
                          </div>
                       </div>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            <div className="p-8 border-t-2 border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800">
              <form onSubmit={handleSend} className="flex gap-4">
                <input
                  type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-2xl px-6 py-4 outline-none focus:border-blue-500"
                />
                <button type="submit" disabled={!newMessage.trim()} className="px-8 bg-blue-600 text-white rounded-2xl font-black uppercase hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/20">Send</button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-6 opacity-40">
             <MessageCircle className="h-32 w-32" />
             <p className="text-2xl font-black uppercase tracking-widest">Select a channel to chat</p>
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
