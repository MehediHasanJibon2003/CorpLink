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
      case 'partnership': return <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">General Partnership</span>
      case 'vendor': return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Vendor Contract</span>
      case 'project': return <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Shared Project</span>
      default: return <span className="text-xs bg-slate-100 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded">Other</span>
    }
  }

  if (loading) return <p className="text-slate-500 text-sm p-4">Loading proposals...</p>

  return (
    <div className="space-y-6">

      {/* Write Proposal Form */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">🚀 Create New Proposal</h3>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        {message && <p className="text-green-500 text-sm mb-3">{message}</p>}

        <form onSubmit={handleSendProposal} className="grid md:grid-cols-2 gap-4">
          <select
            value={form.to_company}
            onChange={(e) => setForm({ ...form, to_company: e.target.value })}
            className="border border-slate-300 px-4 py-3 rounded-xl outline-none focus:border-blue-500"
          >
            <option value="">-- Select Partner --</option>
            {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <select
            value={form.proposal_type}
            onChange={(e) => setForm({ ...form, proposal_type: e.target.value })}
            className="border border-slate-300 px-4 py-3 rounded-xl outline-none focus:border-blue-500"
          >
            <option value="partnership">General Partnership</option>
            <option value="vendor">Vendor / Supplier</option>
            <option value="project">Shared Project</option>
            <option value="other">Other</option>
          </select>

          <input
            type="text"
            placeholder="Proposal Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="md:col-span-2 border border-slate-300 px-4 py-3 rounded-xl outline-none focus:border-blue-500"
          />

          <textarea
            placeholder="Details / Terms of the proposal"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="md:col-span-2 border border-slate-300 px-4 py-3 rounded-xl outline-none focus:border-blue-500 resize-none"
          />

          <button
            type="submit"
            disabled={saving || partners.length === 0}
            className="md:col-span-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition"
          >
            {partners.length === 0 ? "You need accepted partners first" : saving ? "Sending..." : "Send Proposal"}
          </button>
        </form>
      </div>

      {/* Proposals List (Agreements and history) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800">Proposal History & Agreements</h3>
        </div>
        
        {proposals.length === 0 ? (
          <p className="text-slate-500 text-sm p-5">No proposals found.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {proposals.map(prop => {
              const isReceived = prop.to_company === profile.company_id
              const otherCompany = isReceived ? prop.fc?.name : prop.tc?.name
              
              return (
                <div key={prop.id} className="p-5 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {isReceived ? (
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">FROM: {otherCompany}</span>
                        ) : (
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 px-2 py-0.5 rounded">TO: {otherCompany}</span>
                        )}
                        {typeBadge(prop.proposal_type)}
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 cursor-default">{prop.title}</h4>
                    </div>
                    {statusBadge(prop.status)}
                  </div>

                  {prop.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">{prop.description}</p>
                  )}

                  <div className="text-xs text-slate-400">
                    Sent on {new Date(prop.created_at).toLocaleDateString()}
                  </div>

                  {/* Actions for received pending proposals */}
                  {isReceived && prop.status === "pending" && (
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleUpdateStatus(prop.id, "accepted", otherCompany, prop.proposal_type)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm transition"
                      >
                        Accept Terms
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(prop.id, "rejected", otherCompany, prop.proposal_type)}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 dark:text-slate-200 px-4 py-1.5 rounded-lg text-sm transition"
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
