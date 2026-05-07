import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"

function ProposalsPanel() {
  const { user, profile } = useAuth()

  const [partners, setPartners] = useState([]) // Only accepted partners
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const [form, setForm] = useState({
    to_company: "",
    title: "",
    description: "",
    proposal_type: "partnership",
  })

  const fetchData = async () => {
    setLoading(true)

    // 1. Fetch established partners (requests where status = 'accepted')
    // We do this in two queries to avoid complex double-join errors
    
    // Sent requests that were accepted
    const { data: sentAccepted, error: err1 } = await supabase
      .from("partner_requests")
      .select("to_company:companies!to_company (id, name)")
      .eq("status", "accepted")
      .eq("from_company", profile.company_id)

    // Received requests that were accepted
    const { data: receivedAccepted, error: err2 } = await supabase
      .from("partner_requests")
      .select("from_company:companies!from_company (id, name)")
      .eq("status", "accepted")
      .eq("to_company", profile.company_id)

    if (err1) setError(err1.message)
    if (err2) setError(err2.message)

    const partnerList = []
    sentAccepted?.forEach((r) => { if (r.to_company) partnerList.push(r.to_company) })
    receivedAccepted?.forEach((r) => { if (r.from_company) partnerList.push(r.from_company) })
    
    setPartners(partnerList)

    // 2. Fetch proposals involving our company
    const { data: propDataSent, error: err3 } = await supabase
      .from("collaboration_proposals")
      .select("*, tc:companies!to_company (id, name)")
      .eq("from_company", profile.company_id)
      
    const { data: propDataReceived, error: err4 } = await supabase
      .from("collaboration_proposals")
      .select("*, fc:companies!from_company (id, name)")
      .eq("to_company", profile.company_id)

    if (err3) setError(err3.message)
    if (err4) setError(err4.message)

    // Combine and sort proposals
    const allProps = [...(propDataSent || []), ...(propDataReceived || [])].sort((a,b) => new Date(b.created_at) - new Date(a.created_at))

    setProposals(allProps)
    setLoading(false)
  }

  useEffect(() => {
    if (profile?.company_id) fetchData()
  }, [profile?.company_id])

  const handleSendProposal = async (e) => {
    e.preventDefault()
    setError("")
    setMessage("")

    if (!form.to_company) { setError("Select a partner"); return }
    if (!form.title.trim()) { setError("Title is required"); return }

    setSaving(true)

    const targetPartner = partners.find(p => p.id === form.to_company)

    const { error: insErr } = await supabase.from("collaboration_proposals").insert([{
      from_company: profile.company_id,
      to_company: form.to_company,
      created_by: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      proposal_type: form.proposal_type,
    }])

    if (insErr) {
      setError(insErr.message)
    } else {
      await supabase.from("activity_logs").insert([{
        company_id: profile.company_id,
        user_id: user.id,
        action: `Sent ${form.proposal_type} proposal to ${targetPartner?.name}`,
        entity: "collaboration",
      }])
      setMessage("Proposal sent successfully!")
      setForm({ to_company: "", title: "", description: "", proposal_type: "partnership" })
      setTimeout(() => setMessage(""), 3000)
      fetchData()
    }
    setSaving(false)
  }

  const handleUpdateStatus = async (proposalId, newStatus, companyName, propType) => {
    const { error: updErr } = await supabase
      .from("collaboration_proposals")
      .update({ status: newStatus })
      .eq("id", proposalId)

    if (!updErr) {
      await supabase.from("activity_logs").insert([{
        company_id: profile.company_id,
        user_id: user.id,
        action: `${newStatus === 'accepted' ? 'Accepted' : 'Rejected'} ${propType} proposal from ${companyName}`,
        entity: "collaboration",
      }])
      fetchData()
    }
  }

  const statusBadge = (status) => {
    if (status === "accepted") return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">✅ Finalized Agreement</span>
    if (status === "pending")  return <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">⏳ Pending Review</span>
    if (status === "rejected") return <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">❌ Declined</span>
    return null
  }

  const typeBadge = (type) => {
    switch(type) {
      case 'partnership': return <span className="text-[9px] font-black bg-purple-100 text-purple-700 px-3 py-1 rounded-full uppercase tracking-widest">General Partnership</span>
      case 'vendor': return <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-3 py-1 rounded-full uppercase tracking-widest">Vendor Contract</span>
      case 'service_exchange': return <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-widest">Service Exchange</span>
      case 'project': return <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full uppercase tracking-widest">Shared Project</span>
      default: return <span className="text-[9px] font-black bg-slate-100 text-slate-700 px-3 py-1 rounded-full uppercase tracking-widest">Collaboration</span>
    }
  }

  if (loading) return <p className="text-slate-500 text-sm p-4">Loading proposals...</p>

  return (
    <div className="space-y-12 md:space-y-16">

      {/* Write Proposal Form */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] border-2 border-slate-200 dark:border-slate-700 p-10 md:p-16 shadow-sm">
        <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-10 md:mb-12 tracking-tight flex items-center gap-4">
          <span className="text-4xl">🚀</span> Create New Proposal
        </h3>
        {error && <p className="p-6 bg-red-50 text-red-600 rounded-2xl font-bold mb-8">{error}</p>}
        {message && <p className="p-6 bg-green-50 text-green-600 rounded-2xl font-bold mb-8">{message}</p>}

        <form onSubmit={handleSendProposal} className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          <div className="space-y-2">
            <label className="text-sm md:text-base font-black text-slate-400 uppercase tracking-widest px-2">Select Partner</label>
            <select
              value={form.to_company}
              onChange={(e) => setForm({ ...form, to_company: e.target.value })}
              className="w-full border-2 border-slate-200 dark:border-slate-700 px-8 py-5 md:py-6 rounded-2xl md:rounded-3xl outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 text-lg md:text-2xl font-black text-slate-800 dark:text-slate-100 transition-all cursor-pointer"
            >
              <option value="">-- Choose a Connected Partner --</option>
              {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm md:text-base font-black text-slate-400 uppercase tracking-widest px-2">Proposal Category</label>
            <select
              value={form.proposal_type}
              onChange={(e) => setForm({ ...form, proposal_type: e.target.value })}
              className="w-full border-2 border-slate-200 dark:border-slate-700 px-8 py-5 md:py-6 rounded-2xl md:rounded-3xl outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 text-lg md:text-2xl font-black text-slate-800 dark:text-slate-100 transition-all cursor-pointer"
            >
              <option value="partnership">General Partnership</option>
              <option value="vendor">Vendor / Supplier</option>
              <option value="service_exchange">Service Exchange Agreement</option>
              <option value="project">Shared Project</option>
              <option value="other">Other Collaboration</option>
            </select>
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm md:text-base font-black text-slate-400 uppercase tracking-widest px-2">Formal Proposal Title</label>
            <input
              type="text"
              placeholder="Enter a descriptive title for this proposal..."
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border-2 border-slate-200 dark:border-slate-700 px-8 py-5 md:py-6 rounded-2xl md:rounded-3xl outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 text-xl md:text-3xl font-black text-slate-800 dark:text-slate-100 transition-all"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm md:text-base font-black text-slate-400 uppercase tracking-widest px-2">Agreement Details & Terms</label>
            <textarea
              placeholder="Detail the scope of work, expected outcomes, and legal terms..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={5}
              className="w-full border-2 border-slate-200 dark:border-slate-600 px-8 py-6 rounded-2xl md:rounded-3xl outline-none focus:border-blue-500 resize-none text-lg md:text-2xl font-medium bg-slate-50 dark:bg-slate-900/50 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={saving || partners.length === 0}
            className="md:col-span-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-6 md:py-8 rounded-2xl md:rounded-[2.5rem] text-xl md:text-3xl font-black transition-all shadow-xl hover:-translate-y-1 active:translate-y-0"
          >
            {partners.length === 0 ? "⚠️ Establish partners to send proposals" : saving ? "🚀 Transmitting..." : "Send Formal Proposal"}
          </button>
        </form>
      </div>

      {/* Proposals List (Agreements and history) */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="px-10 py-8 md:px-16 md:py-10 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
          <h3 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">Proposal History & Agreements</h3>
        </div>
        
        {proposals.length === 0 ? (
          <div className="p-24 text-center">
            <p className="text-xl md:text-3xl text-slate-400 font-bold italic">No active proposals or finalized agreements found.</p>
          </div>
        ) : (
          <div className="divide-y-2 divide-slate-100 dark:divide-slate-800">
            {proposals.map(prop => {
              const isReceived = prop.to_company === profile.company_id
              const otherCompany = isReceived ? prop.fc?.name : prop.tc?.name
              
              return (
                <div key={prop.id} className="p-10 md:p-16 flex flex-col gap-8 transition-all hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-4">
                        {isReceived ? (
                          <span className="text-sm md:text-lg font-black text-blue-700 bg-blue-100 px-6 py-2 rounded-full border-2 border-blue-200 uppercase tracking-widest flex items-center gap-2">
                             <span className="text-xl">📥</span> FROM: {otherCompany}
                          </span>
                        ) : (
                          <span className="text-sm md:text-lg font-black text-slate-600 bg-slate-100 px-6 py-2 rounded-full border-2 border-slate-200 uppercase tracking-widest flex items-center gap-2">
                             <span className="text-xl">↗️</span> TO: {otherCompany}
                          </span>
                        )}
                        <div className="transform scale-110 origin-left">
                          {typeBadge(prop.proposal_type)}
                        </div>
                      </div>
                      <h4 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">{prop.title}</h4>
                    </div>
                    <div className="transform scale-150 origin-top-right mt-2 md:mt-4">
                      {statusBadge(prop.status)}
                    </div>
                  </div>

                  {prop.description && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-8 md:p-12 rounded-3xl border-2 border-slate-100 dark:border-slate-700 shadow-inner">
                      <p className="text-lg md:text-2xl text-slate-700 dark:text-slate-200 font-medium leading-relaxed italic">"{prop.description}"</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-base md:text-xl text-slate-400 font-bold uppercase tracking-widest">
                    <span className="text-2xl">📅</span> Sent on {new Date(prop.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>

                  {/* Actions for received pending proposals */}
                  {isReceived && prop.status === "pending" && (
                    <div className="flex flex-col sm:flex-row gap-4 md:gap-6 pt-8 border-t-2 border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => handleUpdateStatus(prop.id, "accepted", otherCompany, prop.proposal_type)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-10 py-5 md:py-6 rounded-2xl md:rounded-[2rem] text-lg md:text-2xl font-black transition-all shadow-lg active:scale-95"
                      >
                        Accept Terms & Finalize
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(prop.id, "rejected", otherCompany, prop.proposal_type)}
                        className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-10 py-5 md:py-6 rounded-2xl md:rounded-[2rem] text-lg md:text-2xl font-black transition-all"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProposalsPanel
