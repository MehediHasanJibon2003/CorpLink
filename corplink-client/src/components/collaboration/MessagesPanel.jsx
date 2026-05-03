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
    <div className="bg-white dark:bg-slate-800 border-2 flex flex-col xl:flex-row border-slate-200 dark:border-slate-700 rounded-3xl md:rounded-[3rem] shadow-sm overflow-hidden h-[800px] md:h-[900px]">
      {/* Sidebar: Partners List */}
      <div className="w-full xl:w-[35rem] bg-slate-50 dark:bg-slate-900/50 border-r-2 border-slate-200 dark:border-slate-700 flex flex-col shrink-0">
        <div className="p-8 md:p-10 border-b-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
          <h3 className="text-xl md:text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-[0.1em]">Partner Contacts</h3>
        </div>
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {partners.map(partner => (
            <button
              key={partner.id}
              onClick={() => setActivePartner(partner)}
              className={`w-full text-left p-8 md:p-10 border-b-2 border-slate-100 dark:border-slate-800 transition-all flex items-center gap-6 md:gap-8
                ${activePartner?.id === partner.id ? "bg-blue-600 shadow-lg scale-[1.02] z-10" : "hover:bg-slate-100 dark:hover:bg-slate-700/30"}
              `}
            >
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center font-black text-2xl md:text-4xl shadow-md
                ${activePartner?.id === partner.id ? "bg-white text-blue-600" : "bg-blue-600 text-white"}
              `}>
                {partner.name.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <p className={`font-black text-xl md:text-3xl tracking-tight truncate ${activePartner?.id === partner.id ? "text-white" : "text-slate-800 dark:text-slate-100"}`}>
                  {partner.name}
                </p>
                <p className={`text-sm md:text-lg font-bold uppercase tracking-widest mt-1 ${activePartner?.id === partner.id ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}`}>Verified Partner</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900/10">
        {/* Chat header */}
        <div className="p-8 md:p-10 border-b-2 border-slate-200 dark:border-slate-700 shadow-sm z-10 flex items-center justify-between bg-white dark:bg-slate-800">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 font-black text-white flex items-center justify-center text-3xl md:text-4xl shadow-lg border-2 border-white dark:border-slate-700">
              {activePartner?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-slate-100 leading-tight tracking-tight">{activePartner?.name}</h3>
              <div className="flex items-center gap-3 mt-1">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                <p className="text-sm md:text-lg text-emerald-600 font-bold uppercase tracking-widest">Connected</p>
              </div>
            </div>
          </div>
          <button className="hidden md:flex p-4 text-slate-400 hover:text-slate-600 transition-colors">
             <span className="text-3xl">⚙️</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-10 md:p-16 space-y-8 md:space-y-12 bg-slate-50 dark:bg-slate-900/50 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-6 opacity-50">
              <span className="text-8xl">💬</span>
              <p className="text-xl md:text-3xl font-bold italic tracking-tight">Initiate your professional collaboration dialogue...</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMine = msg.from_company === profile.company_id
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-[2rem] md:rounded-[3rem] px-8 py-5 md:px-12 md:py-8 shadow-sm transition-all hover:shadow-md ${
                    isMine 
                      ? "bg-blue-600 text-white rounded-br-none scale-105" 
                      : "bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none"
                  }`}>
                    <p className="text-lg md:text-2xl font-medium leading-relaxed">{msg.message_text}</p>
                    <div className={`text-xs md:text-base mt-4 font-bold uppercase tracking-widest flex items-center justify-end gap-2 ${isMine ? "text-blue-200" : "text-slate-400"}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                      {isMine && <span>✓✓</span>}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="p-8 md:p-12 border-t-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <form onSubmit={handleSend} className="flex gap-6 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Type your message to ${activePartner?.name}...`}
                className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-3xl md:rounded-[2.5rem] px-10 py-6 md:py-8 text-xl md:text-3xl font-medium outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 transition-all shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white w-20 h-20 md:w-28 md:h-28 rounded-3xl md:rounded-[2.5rem] flex items-center justify-center transition-all shadow-xl hover:-translate-y-1 active:scale-95 shrink-0"
            >
              <span className="text-3xl md:text-5xl">➡️</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default MessagesPanel
