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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[500px]">
      <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl">
        <h3 className="font-bold text-slate-800">#{activeDept.name.toLowerCase().replace(/\s+/g, '-')}</h3>
        <p className="text-xs text-slate-500">Internal department workflow communication</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : messages.map((msg) => {
          const isMe = msg.sender_id === profile.id
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="flex items-baseline gap-2 mb-1 px-1">
                <span className="text-xs font-semibold text-slate-700">{msg.sender?.full_name || "Unknown"}</span>
                <span className="text-[10px] text-slate-400">{new Date(msg.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>
              </div>
              <div className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-slate-100 text-slate-800 rounded-tl-sm'}`}>
                {msg.content}
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-100 bg-white rounded-b-xl">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input 
            type="text" 
            value={newMessage} 
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message to the department..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 outline-none focus:border-blue-400 text-sm"
          />
          <button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white rounded-full p-2 w-10 flex flex-shrink-0 items-center justify-center transition">
            ➤
          </button>
        </form>
      </div>
    </div>
  )
}

export default CommunicationPanel
