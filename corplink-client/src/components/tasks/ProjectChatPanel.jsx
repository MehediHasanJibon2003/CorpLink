import { useEffect, useState, useRef } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"

function ProjectChatPanel({ activeProject, profile }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [groupId, setGroupId] = useState(null)
  const messagesEndRef = useRef(null)

  // 1. Resolve Group ID
  useEffect(() => {
  const resolveGroupId = async (force = false) => {
    if (!activeProject || !profile) return
    setLoading(true)
    
    // Fetch all possible groups to check for duplicates
    let { data: groups, error } = await supabase
      .from("chat_groups")
      .select("id")
      .eq("reference_id", activeProject.id)
      .eq("type", "project")
      .order('created_at', { ascending: true }) // Oldest first
    
    let targetGroup = groups?.[0]
    
    if (error) {
      console.error("Fetch Group Error:", error)
    }

    if (!targetGroup && !error) {
      const { data: newGroups, error: createError } = await supabase
        .from("chat_groups")
        .insert([{
          name: `${activeProject.name} Workspace`,
          company_id: profile.company_id,
          type: 'project',
          reference_id: activeProject.id
        }])
        .select()
        .limit(1)
      
      if (createError) {
        console.error("Create Group Error:", createError)
      } else if (newGroups) {
        targetGroup = newGroups[0]
      }
    }

    if (targetGroup) {
      setGroupId(targetGroup.id)
    }
    setLoading(false)
  }

    resolveGroupId()
  }, [activeProject?.id, profile?.company_id])

  // 2. Setup Subscription & Load Messages
  useEffect(() => {
    if (!groupId) return

    const fetchCurrentMessages = async () => {
      const { data, error } = await supabase
        .from("internal_messages")
        .select("*, profiles(full_name, role)")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true })

      if (!error && data) {
        const mapped = data.map(msg => ({
          ...msg,
          sender: msg.profiles ? { full_name: msg.profiles.full_name, role: msg.profiles.role } : null
        }))
        setMessages(mapped)
      }
      setLoading(false)
    }

    fetchCurrentMessages()

    const channel = supabase
      .channel(`proj-chat-${groupId}`)
      .on('postgres_changes', {
        event: 'INSERT', 
        schema: 'public', 
        table: 'internal_messages',
        filter: `group_id=eq.${groupId}`
      }, async (payload) => {
        const { data } = await supabase
          .from("internal_messages")
          .select("*, profiles(full_name, role)")
          .eq("id", payload.new.id)
          .single()
        
        if (data) {
          const mapped = { 
            ...data, 
            sender: data.profiles ? { full_name: data.profiles.full_name, role: data.profiles.role } : null 
          }
          setMessages(prev => {
            if (prev.find(m => m.id === mapped.id)) return prev
            return [...prev, mapped]
          })
        }
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
    if (!msg || !user) return

    let gid = groupId
    if (!gid && activeProject) {
      const { data } = await supabase
        .from("chat_groups")
        .select("id")
        .eq("reference_id", activeProject.id)
        .maybeSingle()
      if (data) {
        gid = data.id
        setGroupId(gid)
      }
    }

    if (!gid) return

    const { error } = await supabase.from("internal_messages").insert([{
      group_id: gid,
      sender_id: user.id,
      message_text: msg
    }])

    if (!error) {
      setNewMessage("")
    } else {
      alert("Delivery Failed: " + error.message)
    }
  }

  if (loading) return <div className="p-10 text-center text-slate-500 font-black uppercase tracking-widest animate-pulse">Syncing Project Workspace...</div>

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl md:rounded-[2.5rem] shadow-sm border-2 border-slate-200 dark:border-slate-700 flex flex-col h-[600px] md:h-[750px] overflow-hidden transition-all">
      <div className="p-6 md:p-10 border-b-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
        <h3 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
          #{activeProject.name.toLowerCase().replace(/\s+/g, '-')}
        </h3>
        <p className="text-sm md:text-lg text-slate-500 dark:text-slate-400 font-medium mt-1">Strategic project-level collaboration channel</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 md:space-y-8 custom-scrollbar bg-white dark:bg-slate-800/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 italic text-lg md:text-2xl font-medium opacity-60">
            <span className="text-4xl md:text-6xl mb-4">🚀</span>
            Secure workspace active. Start broadcasting!
          </div>
        ) : messages.map((msg) => {
          const isMe = String(msg.sender_id) === String(user?.id)
          return (
            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
                <div className="flex items-baseline gap-3 mb-2 px-2">
                  {!isMe && <span className="text-sm md:text-base font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">{msg.sender?.full_name || "Member"}</span>}
                  <span className="text-[10px] md:text-xs text-slate-400 font-bold uppercase">{new Date(msg.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>
                  {isMe && <span className="text-sm md:text-base font-black text-indigo-600 uppercase tracking-widest">You</span>}
                </div>
                <div className={`px-6 py-4 md:px-8 md:py-6 rounded-[2rem] text-base md:text-2xl shadow-sm font-medium leading-relaxed transition-all hover:shadow-md ${
                  isMe 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
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
            placeholder="Broadcast to project team..."
            className="flex-1 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 rounded-[3rem] px-8 py-4 md:py-6 outline-none focus:border-indigo-500 text-base md:text-2xl font-bold transition-all shadow-inner"
          />
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-16 h-16 md:w-24 md:h-24 flex flex-shrink-0 items-center justify-center transition shadow-lg hover:shadow-xl hover:-translate-y-1">
            <span className="text-3xl md:text-5xl">➤</span>
          </button>
        </form>
      </div>
    </div>
  )
}

export default ProjectChatPanel
