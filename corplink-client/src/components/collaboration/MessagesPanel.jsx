import { useEffect, useState, useRef } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"

function MessagesPanel() {
  const { user, profile } = useAuth()

  const [partners, setPartners] = useState([])
  const [activePartner, setActivePartner] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  
  const bottomRef = useRef(null)

  const fetchPartners = async () => {
    setLoading(true)
    
    // Sent requests that were accepted
    const { data: sentAccepted } = await supabase
      .from("partner_requests")
      .select("to_company:companies!to_company (id, name)")
      .eq("status", "accepted")
      .eq("from_company", profile.company_id)

    // Received requests that were accepted
    const { data: receivedAccepted } = await supabase
      .from("partner_requests")
      .select("from_company:companies!from_company (id, name)")
      .eq("status", "accepted")
      .eq("to_company", profile.company_id)

    const partnerList = []
    sentAccepted?.forEach((r) => { if (r.to_company) partnerList.push(r.to_company) })
    receivedAccepted?.forEach((r) => { if (r.from_company) partnerList.push(r.from_company) })
    
    setPartners(partnerList)
    if (partnerList.length > 0 && !activePartner) {
      setActivePartner(partnerList[0])
    }
    setLoading(false)
  }

  const fetchMessages = async () => {
    if (!activePartner) return

    const { data, error } = await supabase
      .from("partner_messages")
      .select("*")
      .or(`and(from_company.eq.${profile.company_id},to_company.eq.${activePartner.id}),and(from_company.eq.${activePartner.id},to_company.eq.${profile.company_id})`)
      .order("created_at", { ascending: true })

    if (error) console.error("Fetch Messages Error:", error)
    
    setMessages(data || [])
    
    // Auto scroll
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  useEffect(() => {
    if (profile?.company_id) fetchPartners()
  }, [profile?.company_id])

  useEffect(() => {
    fetchMessages()
  }, [activePartner])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !activePartner) return

    const { error } = await supabase.from("partner_messages").insert([{
      from_company: profile.company_id,
      to_company: activePartner.id,
      sender_id: user.id,
      message_text: newMessage.trim()
    }])

    if (!error) {
      setNewMessage("")
      fetchMessages() // Re-fetch immediately to show message
    } else {
      console.error("Send Message Error:", error)
      alert("Failed to send: " + error.message)
    }
  }

  if (loading) return <p className="text-slate-500 p-4">Loading contacts...</p>

  if (partners.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-10 text-center">
        <div className="text-4xl mb-3">💬</div>
        <h3 className="font-semibold text-slate-700">No active partners</h3>
        <p className="text-slate-500 text-sm mt-1">Connect with other companies in the Discover tab first.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 border flex flex-col md:flex-row border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden h-[600px]">
      {/* Sidebar: Partners List */}
      <div className="md:w-1/3 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white">
          <h3 className="font-semibold text-slate-800">Partner Contacts</h3>
        </div>
        <div className="overflow-y-auto flex-1">
          {partners.map(partner => (
            <button
              key={partner.id}
              onClick={() => setActivePartner(partner)}
              className={`w-full text-left p-4 border-b border-slate-100 transition flex items-center gap-3
                ${activePartner?.id === partner.id ? "bg-blue-50/50" : "hover:bg-slate-100"}
              `}
            >
              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center">
                {partner.name.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <p className={`font-semibold text-sm ${activePartner?.id === partner.id ? "text-blue-700" : "text-slate-700"}`}>
                  {partner.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Partner</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="md:w-2/3 flex flex-col h-full bg-white">
        {/* Chat header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 shadow-sm z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 font-bold text-white flex items-center justify-center">
            {activePartner?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 leading-tight">{activePartner?.name}</h3>
            <p className="text-xs text-green-600">Company connected</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.length === 0 ? (
            <div className="text-center text-slate-400 mt-10 text-sm">
              No messages yet. Send the first message!
            </div>
          ) : (
            messages.map(msg => {
              const isMine = msg.from_company === profile.company_id
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                    isMine 
                      ? "bg-blue-600 text-white rounded-br-sm" 
                      : "bg-white dark:bg-slate-800 border border-slate-200 text-slate-800 dark:text-slate-100 rounded-bl-sm shadow-sm"
                  }`}>
                    {msg.message_text}
                    <div className={`text-[10px] mt-1 text-right ${isMine ? "text-blue-200" : "text-slate-400"}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${activePartner?.name}...`}
              className="flex-1 border border-slate-300 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-semibold transition"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default MessagesPanel
