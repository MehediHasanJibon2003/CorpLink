import { useEffect, useState, useRef } from "react"
import { supabase } from "../../lib/supabase"

function CommunicationPanel({ activeDept, profile }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("department_messages")
      .select("*, profiles(full_name, role)")
      .eq("department_id", activeDept.id)
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

  useEffect(() => {
    if (activeDept) fetchMessages()

    const channel = supabase
      .channel(`dept-${activeDept?.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'department_messages', filter: `department_id=eq.${activeDept?.id}`
      }, async (payload) => {
        // Quick fetch to get sender details correctly
        const { data } = await supabase.from("department_messages").select("*, profiles(full_name, role)").eq("id", payload.new.id).single()
        if (data) {
          const mapped = { ...data, sender: data.profiles ? { full_name: data.profiles.full_name, role: data.profiles.role } : null }
          setMessages(prev => [...prev, mapped])
        }
      }).subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeDept])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !profile) return

    const { error } = await supabase.from("department_messages").insert([{
      company_id: profile.company_id,
      department_id: activeDept.id,
      sender_id: profile.id, // Using profile.id as it's the sender
      content: newMessage.trim()
    }])

    if (!error) {
      setNewMessage("")
      fetchMessages() // Force instant update for the sender
    }
  }

  if (loading) return <div className="p-10 text-center text-slate-500">Loading channel...</div>

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl md:rounded-[2.5rem] shadow-sm border-2 border-slate-200 dark:border-slate-700 flex flex-col h-[600px] md:h-[750px] overflow-hidden transition-all">
      <div className="p-6 md:p-10 border-b-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
        <h3 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">#{activeDept.name.toLowerCase().replace(/\s+/g, '-')}</h3>
        <p className="text-sm md:text-lg text-slate-500 dark:text-slate-400 font-medium mt-1">Internal department workflow communication</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 md:space-y-8 custom-scrollbar bg-white dark:bg-slate-800/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 italic text-lg md:text-2xl font-medium opacity-60">
            <span className="text-4xl md:text-6xl mb-4">💬</span>
            No messages yet. Start the conversation!
          </div>
        ) : messages.map((msg) => {
          const isMe = msg.sender_id === profile.id
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
              <div className="flex items-baseline gap-3 mb-2 px-2">
                <span className="text-sm md:text-base font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">{msg.sender?.full_name || "Unknown"}</span>
                <span className="text-xs md:text-sm text-slate-400 font-medium">{new Date(msg.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>
              </div>
              <div className={`px-6 py-4 md:px-8 md:py-6 rounded-[2rem] max-w-[85%] md:max-w-[70%] text-base md:text-2xl shadow-md font-medium leading-relaxed ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-sm border border-slate-200 dark:border-slate-600'}`}>
                {msg.content}
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
