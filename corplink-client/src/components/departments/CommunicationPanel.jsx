import { useEffect, useState, useRef } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import { RefreshCw, AlertTriangle } from "lucide-react"

function CommunicationPanel({ activeDept, profile }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [groupId, setGroupId] = useState(null)
  const [syncError, setSyncError] = useState(null)
  const messagesEndRef = useRef(null)

  const resolveGroupId = async (force = false) => {
    if (!activeDept || !profile) return
    setLoading(true)
    setSyncError(null)
    
    console.log("Resolving Group for:", activeDept.name, activeDept.id)

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
      console.log("No group found, creating one...")
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
      console.log("Fetching messages for group:", groupId)
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
        console.log("Fetched Messages:", data.length)
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
        console.log("Realtime Payload Received:", payload.new)
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

  const handleSendMessage = async (e) => {
    e.preventDefault()
    const msg = newMessage.trim()
    if (!msg || !user || !groupId) return

    const { error } = await supabase.from("internal_messages").insert([{
      group_id: groupId,
      sender_id: user.id,
      message_text: msg
    }])

    if (!error) {
      setNewMessage("")
    } else {
      console.error("Send Error:", error)
      alert("Delivery Failed: " + error.message)
    }
  }

  if (loading) return (
    <div className="p-20 text-center flex flex-col items-center gap-4">
      <RefreshCw className="h-10 w-10 animate-spin text-blue-500" />
      <p className="text-xl font-bold text-slate-400 uppercase tracking-widest">Synchronizing Encrypted Channel...</p>
    </div>
  )

  if (syncError) return (
    <div className="p-20 text-center flex flex-col items-center gap-6 bg-red-50/50 dark:bg-red-900/10 rounded-[3rem] border-2 border-red-100 dark:border-red-900/20">
      <AlertTriangle className="h-16 w-16 text-red-500" />
      <div>
        <h3 className="text-2xl font-black text-red-600 uppercase">Comm Link Failure</h3>
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
    <div className="bg-white dark:bg-slate-800 rounded-3xl md:rounded-[2.5rem] shadow-sm border-2 border-slate-200 dark:border-slate-700 flex flex-col h-[600px] md:h-[750px] overflow-hidden transition-all">
      <div className="p-6 md:p-10 border-b-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
        <div>
          <h3 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">#{activeDept.name.toLowerCase().replace(/\s+/g, '-')}</h3>
          <p className="text-sm md:text-lg text-slate-500 dark:text-slate-400 font-medium mt-1">Internal department workflow communication</p>
        </div>
        <button 
          onClick={() => resolveGroupId(true)}
          className="p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-md hover:bg-slate-50 transition-all text-blue-600"
          title="Refresh Channel"
        >
          <RefreshCw className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 md:space-y-8 custom-scrollbar bg-white dark:bg-slate-800/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 italic text-lg md:text-2xl font-medium opacity-60">
            <span className="text-4xl md:text-6xl mb-4">💬</span>
            No messages yet. Start the conversation!
          </div>
        ) : messages.map((msg) => {
          const isMe = String(msg.sender_id) === String(user?.id)
          return (
            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
                <div className="flex items-baseline gap-3 mb-2 px-2">
                  {!isMe && <span className="text-sm md:text-base font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">{msg.sender?.full_name || "Member"}</span>}
                  <span className="text-[10px] md:text-xs text-slate-400 font-bold uppercase">{new Date(msg.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>
                  {isMe && <span className="text-sm md:text-base font-black text-blue-600 uppercase tracking-widest">You</span>}
                </div>
                <div className={`px-6 py-4 md:px-8 md:py-6 rounded-[2rem] text-base md:text-2xl shadow-sm font-medium leading-relaxed transition-all hover:shadow-md ${
                  isMe 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-600'
                }`}>
                  {msg.message_text}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 md:p-10 border-t-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
        <form onSubmit={handleSendMessage} className="flex gap-4 md:gap-6">
          <input 
            type="text" 
            value={newMessage} 
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message to the department..."
            className="flex-1 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 rounded-[3rem] px-8 py-4 md:py-6 outline-none focus:border-blue-500 text-base md:text-2xl font-bold transition-all shadow-inner"
          />
          <button type="submit" className="bg-slate-900 hover:bg-black dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-full w-16 h-16 md:w-24 md:h-24 flex flex-shrink-0 items-center justify-center transition shadow-lg hover:shadow-xl hover:-translate-y-1">
            <span className="text-3xl md:text-5xl">➤</span>
          </button>
        </form>
      </div>
    </div>
  )
}

export default CommunicationPanel
