import { useEffect, useState, useCallback } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import { Inbox, Send, UserCheck, ShieldAlert, Clock, CheckCircle2, XCircle } from "lucide-react"

function PartnerRequestsPanel() {
  const { user, profile } = useAuth()

  const [received, setReceived] = useState([])
  const [sent, setSent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const fetchRequests = useCallback(async () => {
    if (!profile?.company_id) return
    setLoading(true)

    try {
      // Received requests (I am the receiver or my company is the target)
      const { data: recData } = await supabase
        .from("collaboration_requests")
        .select(`
          *,
          sender:profiles!sender_id (full_name, role),
          partner_corp:corporates!corporate_id (name)
        `)
        .or(`receiver_id.eq.${user.id},corporate_id.eq.${profile.company_id}`)
        .order("created_at", { ascending: false })

      // Sent requests (I am the sender)
      const { data: sentData } = await supabase
        .from("collaboration_requests")
        .select(`
          *,
          receiver:profiles!receiver_id (full_name, role),
          partner_corp:corporates!corporate_id (name)
        `)
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false })

      setReceived(recData || [])
      setSent(sentData || [])
    } catch (err) {
      console.error("Fetch requests error:", err)
      setError("Strategic Data Retrieval Failed.")
    } finally {
      setLoading(false)
    }
  }, [user.id, profile.company_id])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleUpdateStatus = async (requestId, newStatus, targetName) => {
    setError("")
    setMessage("")

    const { error } = await supabase
      .from("collaboration_requests")
      .update({ status: newStatus })
      .eq("id", requestId)

    if (error) {
      setError(error.message)
      return
    }

    setMessage(`Protocol ${newStatus === 'accepted' ? 'Authorized' : 'Terminated'}.`)
    setTimeout(() => setMessage(""), 3000)
    fetchRequests()
  }

  const statusConfig = {
    pending: { label: "Pending", class: "bg-amber-100 text-amber-700", icon: Clock },
    accepted: { label: "Accepted", class: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
    rejected: { label: "Rejected", class: "bg-red-100 text-red-700", icon: XCircle },
  }

  const RequestCard = ({ req, isSent }) => {
    const config = statusConfig[req.status] || statusConfig.pending
    const Icon = config.icon
    
    let displayName = ""
    let displayRole = ""
    
    if (req.type === 'internal') {
      const person = isSent ? req.receiver : req.sender
      displayName = person?.full_name || "Colleague"
      displayRole = person?.role || "Team Member"
    } else {
      displayName = req.partner_corp?.name || "Partner Corp"
      displayRole = "Strategic Entity"
    }

    return (
      <div className="group bg-white dark:bg-slate-800 rounded-2xl md:rounded-[2.5rem] border-2 border-slate-100 dark:border-white/5 p-6 md:p-10 hover:border-blue-500/30 transition-all hover:shadow-xl">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 md:mb-8">
           <div className="flex items-center gap-4 md:gap-6">
              <div className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center font-black text-heading-3 md:text-heading-1 text-slate-800 dark:text-white shadow-inner shrink-0">
                {displayName.charAt(0)}
              </div>
              <div>
                <h4 className="text-[16px] md:text-heading-1 font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">{displayName}</h4>
                <p className="text-[8px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1.5 md:mt-2">{displayRole}</p>
              </div>
           </div>
           <div className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full flex items-center gap-2 w-fit ${config.class}`}>
              <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">{config.label}</span>
           </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-5 md:p-8 rounded-2xl md:rounded-3xl text-[13px] md:text-heading-3 text-slate-700 dark:text-slate-300 font-medium italic border-2 border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-700 transition-all">
          "{req.message}"
        </div>

        <div className="mt-6 md:mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
           <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 md:h-4 md:w-4" />
              {new Date(req.created_at).toLocaleDateString()}
           </span>
           
           {!isSent && req.status === 'pending' && (
             <div className="flex gap-2 md:gap-4 w-full sm:w-auto">
                <button 
                  onClick={() => handleUpdateStatus(req.id, 'accepted', displayName)}
                  className="flex-1 sm:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg md:rounded-xl font-black uppercase tracking-widest text-[8px] md:text-[10px] shadow-lg active:scale-95 transition-all"
                >
                  Authorize
                </button>
                <button 
                  onClick={() => handleUpdateStatus(req.id, 'rejected', displayName)}
                  className="flex-1 sm:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-lg md:rounded-xl font-black uppercase tracking-widest text-[8px] md:text-[10px] hover:bg-red-500 hover:text-white transition-all active:scale-95"
                >
                  Terminate
                </button>
             </div>
           )}
        </div>
      </div>
    )
  }

  if (loading) return <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">Synchronizing Intelligence...</div>

  return (
    <div className="space-y-12 md:space-y-16 animate-in fade-in duration-700 pb-20">
      {(error || message) && (
        <div className={`p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] font-black uppercase tracking-widest border-2 md:border-4 text-[10px] md:text-label ${error ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
          {error || message}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 md:gap-24">
        {/* Received Matrix */}
        <div className="space-y-8 md:space-y-12">
           <div className="flex items-center gap-4 md:gap-6">
              <div className="h-14 w-14 md:h-20 md:w-20 rounded-2xl md:rounded-[2rem] bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/20 shrink-0">
                 <Inbox className="h-7 w-7 md:h-10 md:w-10" />
              </div>
              <div>
                 <h3 className="text-2xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">Incoming <br className="hidden md:block" /> Protocols</h3>
                 <p className="text-[10px] md:text-body font-black text-slate-400 uppercase tracking-widest mt-1">Pending Authorization</p>
              </div>
           </div>

           <div className="space-y-6 md:space-y-8">
              {received.length === 0 ? (
                <div className="py-12 md:py-20 text-center border-2 md:border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl md:rounded-[3rem]">
                   <p className="text-[14px] md:text-heading-1 font-black text-slate-300 uppercase tracking-widest">No inbound requests.</p>
                </div>
              ) : (
                received.map(req => <RequestCard key={req.id} req={req} isSent={false} />)
              )}
           </div>
        </div>

        {/* Sent Matrix */}
        <div className="space-y-8 md:space-y-12">
           <div className="flex items-center gap-4 md:gap-6">
              <div className="h-14 w-14 md:h-20 md:w-20 rounded-2xl md:rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-xl shrink-0">
                 <Send className="h-7 w-7 md:h-10 md:w-10" />
              </div>
              <div>
                 <h3 className="text-2xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">Transmitted <br className="hidden md:block" /> Requests</h3>
                 <p className="text-[10px] md:text-body font-black text-slate-400 uppercase tracking-widest mt-1">Global Broadcast</p>
              </div>
           </div>

           <div className="space-y-6 md:space-y-8">
              {sent.length === 0 ? (
                <div className="py-12 md:py-20 text-center border-2 md:border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl md:rounded-[3rem]">
                   <p className="text-[14px] md:text-heading-1 font-black text-slate-300 uppercase tracking-widest">No outbound requests.</p>
                </div>
              ) : (
                sent.map(req => <RequestCard key={req.id} req={req} isSent={true} />)
              )}
           </div>
        </div>
      </div>
    </div>
  )
}

export default PartnerRequestsPanel

