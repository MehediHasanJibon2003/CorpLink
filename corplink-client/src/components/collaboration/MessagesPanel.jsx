import { useEffect, useState, useRef, useCallback } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import { MessageSquare, Send, UserCircle, Building2, Search, ArrowRight, ShieldCheck } from "lucide-react"

function MessagesPanel() {
  const { user, profile } = useAuth()

  const [partners, setPartners] = useState([])
  const [activePartner, setActivePartner] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  
  const bottomRef = useRef(null)

  const fetchPartners = useCallback(async () => {
    if (!profile?.company_id) return
    setLoading(true)
    
    try {
      // Fetch Accepted Collaboration Partners (Internal & External)
      const { data: collabData } = await supabase
        .from("collaboration_requests")
        .select(`
          id, type, sender_id, receiver_id, corporate_id,
          sender:profiles!sender_id (id, full_name, role),
          receiver:profiles!receiver_id (id, full_name, role),
          partner_corp:corporates!corporate_id (id, name)
        `)
        .eq("status", "accepted")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id},corporate_id.eq.${profile.company_id}`)

      const partnerList = collabData?.map(c => {
        if (c.type === 'internal') {
          const person = c.sender_id === user.id ? c.receiver : c.sender
          return { id: person.id, name: person.full_name, role: person.role, type: 'internal' }
        } else {
          return { id: c.partner_corp.id, name: c.partner_corp.name, role: 'Strategic Partner', type: 'external' }
        }
      }) || []
      
      setPartners(partnerList)
      if (partnerList.length > 0 && !activePartner) {
        setActivePartner(partnerList[0])
      }
    } catch (err) {
      console.error("Fetch partners error:", err)
    } finally {
      setLoading(false)
    }
  }, [user.id, profile.company_id, activePartner])

  const fetchMessages = useCallback(async () => {
    if (!activePartner) return

    try {
      // Note: Reusing a generic partner_messages table if it exists, 
      // or using internal_messages for internal and partner_messages for external
      const tableName = activePartner.type === 'external' ? "partner_messages" : "internal_messages"
      
      const { data } = await supabase
        .from(tableName)
        .select("*")
        .or(
          activePartner.type === 'external' 
            ? `and(from_company.eq.${profile.company_id},to_company.eq.${activePartner.id}),and(from_company.eq.${activePartner.id},to_company.eq.${profile.company_id})`
            : `and(sender_id.eq.${user.id},receiver_id.eq.${activePartner.id}),and(sender_id.eq.${activePartner.id},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true })

      setMessages(data || [])
      
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    } catch (err) {
      console.error("Fetch messages error:", err)
    }
  }, [activePartner, user.id, profile.company_id])

  useEffect(() => {
    fetchPartners()
  }, [fetchPartners])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !activePartner) return

    const tableName = activePartner.type === 'external' ? "partner_messages" : "internal_messages"
    const payload = activePartner.type === 'external' ? {
      from_company: profile.company_id,
      to_company: activePartner.id,
      sender_id: user.id,
      message_text: newMessage.trim()
    } : {
      sender_id: user.id,
      receiver_id: activePartner.id,
      message_text: newMessage.trim()
    }

    const { error } = await supabase.from(tableName).insert([payload])

    if (!error) {
      setNewMessage("")
      fetchMessages()
    }
  }

  if (loading) return <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">Establishing Secure Uplink...</div>

  if (partners.length === 0) {
    return (
      <div className="py-40 text-center bg-white dark:bg-slate-800 rounded-[4rem] border-4 border-dashed border-slate-100 dark:border-slate-800">
        <MessageSquare className="h-32 w-32 mx-auto text-slate-100 dark:text-slate-800 mb-10" />
        <h3 className="text-heading-1 font-black text-slate-400 uppercase tracking-widest">No Active Channels Detected</h3>
        <p className="text-body font-bold text-slate-400 mt-4">Initiate collaboration protocols in the Discovery Hub.</p>
      </div>
    )
  }

  const [showMobileChat, setShowMobileChat] = useState(false);

  useEffect(() => {
    if (activePartner && window.innerWidth < 1280) {
      setShowMobileChat(true);
    }
  }, [activePartner]);

  if (loading) return <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">Establishing Secure Uplink...</div>

  if (partners.length === 0) {
    return (
      <div className="py-20 md:py-40 text-center bg-white dark:bg-slate-800 rounded-2xl md:rounded-[4rem] border-2 md:border-4 border-dashed border-slate-100 dark:border-slate-800">
        <MessageSquare className="h-16 w-16 md:h-32 md:w-32 mx-auto text-slate-100 dark:text-slate-800 mb-6 md:mb-10" />
        <h3 className="text-xl md:text-heading-1 font-black text-slate-400 uppercase tracking-widest">No Active Channels</h3>
        <p className="text-[12px] md:text-body font-bold text-slate-400 mt-4">Initiate collaboration in Discovery Hub.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 flex flex-col xl:flex-row rounded-2xl md:rounded-[3rem] shadow-sm overflow-hidden h-[600px] md:h-[900px] animate-in fade-in duration-700 relative">
      
      {/* Sidebar Matrix (Links List) */}
      <div className={`${showMobileChat ? 'hidden xl:flex' : 'flex'} w-full xl:w-[35rem] bg-slate-50 dark:bg-slate-900/50 border-r-2 border-slate-100 dark:border-white/5 flex-col shrink-0 h-full`}>
        <div className="p-6 md:p-10 border-b-2 border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800/50">
          <h3 className="text-body md:text-heading-1 font-black text-slate-900 dark:text-white uppercase tracking-widest">Active Links</h3>
        </div>
        <div className="overflow-y-auto flex-1 custom-scrollbar p-3 md:p-4 space-y-3 md:space-y-4">
          {partners.map(partner => (
            <button
              key={partner.id}
              onClick={() => { setActivePartner(partner); if(window.innerWidth < 1280) setShowMobileChat(true); }}
              className={`w-full text-left p-4 md:p-6 rounded-2xl md:rounded-3xl transition-all flex items-center gap-4 md:gap-6 border-2 ${
                activePartner?.id === partner.id 
                  ? "bg-blue-600 border-blue-400 shadow-xl shadow-blue-500/20" 
                  : "bg-white dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              }`}
            >
              <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-[18px] md:text-heading-1 shadow-md shrink-0 ${
                activePartner?.id === partner.id ? "bg-white text-blue-600" : "bg-slate-100 dark:bg-slate-900 text-slate-400"
              }`}>
                {partner.name.charAt(0)}
              </div>
              <div className="truncate">
                <p className={`font-black text-[15px] md:text-heading-2 tracking-tight truncate uppercase ${activePartner?.id === partner.id ? "text-white" : "text-slate-900 dark:text-white"}`}>
                  {partner.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                   {partner.type === 'internal' ? <UserCircle className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                   <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${activePartner?.id === partner.id ? "text-blue-100" : "text-slate-400"}`}>{partner.type}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Primary Communication Channel (Chat) */}
      <div className={`${!showMobileChat ? 'hidden xl:flex' : 'flex'} flex-1 flex-col h-full bg-white dark:bg-slate-900/10`}>
        <div className="p-4 md:p-10 border-b-2 border-slate-100 dark:border-white/5 flex items-center justify-between bg-white dark:bg-slate-800">
          <div className="flex items-center gap-4 md:gap-6">
            <button 
              onClick={() => setShowMobileChat(false)}
              className="xl:hidden w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500"
            >
              <ArrowRight className="h-5 w-5 rotate-180" />
            </button>
            <div className="w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-indigo-600 font-black text-white flex items-center justify-center text-[18px] md:text-heading-1 shadow-xl border-2 md:border-4 border-white dark:border-slate-700 shrink-0">
              {activePartner?.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-[16px] md:text-heading-1 font-black text-slate-900 dark:text-white leading-none uppercase truncate max-w-[150px] md:max-w-none">{activePartner?.name}</h3>
              <p className="text-[8px] md:text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1.5 md:mt-3 flex items-center gap-1.5 md:gap-2">
                 <ShieldCheck className="h-3 w-3 md:h-4 md:w-4" /> <span className="hidden sm:inline">Secure Link Active</span><span className="sm:hidden">Secure</span>
              </p>
            </div>
          </div>
        </div>

        {/* Message Matrix */}
        <div className="flex-1 overflow-y-auto p-6 md:p-16 space-y-6 md:space-y-10 bg-slate-50 dark:bg-slate-950/20 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-4 md:gap-8 opacity-50">
              <MessageSquare className="h-16 w-16 md:h-32 md:w-32" />
              <p className="text-[14px] md:text-heading-1 font-black uppercase tracking-widest italic">Initiate Dialogue...</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMine = msg.sender_id === user.id
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl md:rounded-[2.5rem] px-5 md:px-10 py-3 md:py-6 shadow-sm group relative ${
                    isMine 
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-br-none" 
                      : "bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 text-slate-800 dark:text-white rounded-bl-none"
                  }`}>
                    <p className="text-[13px] md:text-heading-2 font-medium leading-relaxed">{msg.message_text}</p>
                    <div className={`text-[8px] md:text-[10px] mt-2 md:mt-4 font-black uppercase tracking-widest flex items-center gap-2 ${isMine ? "text-slate-400" : "text-slate-400"}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Transmission Input */}
        <div className="p-4 md:p-10 border-t-2 border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800">
          <form onSubmit={handleSend} className="flex gap-3 md:gap-6 items-center">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Message..."
              className="flex-1 bg-slate-50 dark:bg-slate-900 border-2 md:border-4 border-transparent focus:border-blue-500/30 rounded-xl md:rounded-3xl px-5 md:px-10 py-3 md:py-6 text-[14px] md:text-heading-1 font-black text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-300 shadow-inner"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white w-12 h-12 md:w-24 md:h-24 rounded-xl md:rounded-3xl flex items-center justify-center transition-all shadow-xl active:scale-95 shrink-0"
            >
              <ArrowRight className="h-6 w-6 md:h-10 md:w-10" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default MessagesPanel

