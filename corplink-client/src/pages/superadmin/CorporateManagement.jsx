import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import SuperAdminLayout from "../../components/superadmin/layout/SuperAdminLayout"
import { useConfirm } from "../../context/ConfirmContext"
import { Building2, Search, Filter, MoreHorizontal, CheckCircle2, XCircle, AlertCircle, Mail, Globe, Users, CreditCard, ChevronRight } from "lucide-react"

export default function CorporateManagement() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedCo, setSelectedCo] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [actionLoading, setActionLoading] = useState(null)
  const [activeMenu, setActiveMenu] = useState(null)
  const { showConfirm } = useConfirm()

  const fetchCompanies = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false })
    
    if (!error) setCompanies(data)
    setLoading(false)
  }

  useEffect(() => { fetchCompanies() }, [])

  const handleUpdateStatus = async (id, status, reason = "") => {
    setActionLoading(id)
    
    try {
      if (status === 'deleted') {
        const { error } = await supabase.from("companies").delete().eq("id", id)
        if (error) throw error
      } else {
        const updateData = { status }
        if (reason) updateData.rejection_reason = reason
        const { error } = await supabase.from("companies").update(updateData).eq("id", id)
        if (error) throw error
      }

      await fetchCompanies()
      setIsModalOpen(false)
      setSelectedCo(null)
      setRejectionReason("")
    } catch (err) {
      console.error("Operation failed:", err)
      alert("Action failed: " + err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredCompanies = companies.filter(co => {
    const matchesSearch = (co.name || "").toLowerCase().includes(search.toLowerCase()) || 
                          (co.email || "").toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || co.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <SuperAdminLayout title="Corporate Management" subtitle="Approve new registrations and manage corporate identities">
      
      {/* Responsive Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-8 md:mb-12">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 md:py-4 rounded-xl md:rounded-2xl bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10 outline-none focus:border-violet-500 transition-all font-bold text-slate-900 dark:text-white text-body md:text-body"
          />
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {["all", "pending", "active", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-6 py-2.5 md:py-3 rounded-full text-[10px] md:text-label font-black uppercase tracking-widest transition-all border-2 shrink-0 ${
                statusFilter === status 
                  ? "bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-600/30" 
                  : "bg-white dark:bg-white/5 text-slate-500 dark:text-violet-400 border-slate-100 dark:border-violet-500/15"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Responsive Table/Cards Container */}
      <div className="rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px] lg:min-w-full">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-violet-500/5 border-b-2 border-slate-100 dark:border-violet-500/10">
                <th className="px-6 md:px-10 py-6 md:py-8 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Corporate Identity</th>
                <th className="px-6 md:px-10 py-6 md:py-8 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Subscription</th>
                <th className="px-6 md:px-10 py-6 md:py-8 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Status</th>
                <th className="px-6 md:px-10 py-6 md:py-8 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-violet-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100 dark:divide-violet-500/5">
              {loading ? (
                <tr><td colSpan={4} className="py-20 text-center font-black text-slate-400 uppercase tracking-widest animate-pulse">Scanning Corporates...</td></tr>
              ) : filteredCompanies.length === 0 ? (
                <tr><td colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-label">No records found</td></tr>
              ) : filteredCompanies.map(co => (
                <tr key={co.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 md:px-10 py-6 md:py-8">
                    <div className="flex items-center gap-4 md:gap-5">
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-heading-3 md:text-heading-1 shadow-lg shrink-0">
                        {co.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-body md:text-heading-2 font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{co.name}</p>
                        <div className="flex flex-wrap gap-2 md:gap-4 mt-1">
                          <span className="flex items-center gap-1 text-[10px] md:text-label font-bold text-slate-500"><Mail className="h-3 w-3" /> {co.email}</span>
                          {co.website && <span className="flex items-center gap-1 text-[10px] md:text-label font-bold text-slate-500"><Globe className="h-3 w-3" /> {co.website}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 md:px-10 py-6 md:py-8">
                    <div className="flex flex-col gap-1">
                      <span className="text-label md:text-body font-black text-slate-700 dark:text-white uppercase tracking-tight">{co.plan || "Trial"} Plan</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly Cycle</span>
                    </div>
                  </td>
                  <td className="px-6 md:px-10 py-6 md:py-8">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border-2 ${
                      co.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      co.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' :
                      'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      {co.status}
                    </span>
                  </td>
                  <td className="px-6 md:px-10 py-6 md:py-8">
                    <div className="flex items-center justify-end gap-2 md:gap-3">
                      {co.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleUpdateStatus(co.id, 'active')}
                            disabled={actionLoading === co.id}
                            className="p-2 md:p-3 rounded-xl bg-emerald-50 border-2 border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                          >
                            <CheckCircle2 className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => { setSelectedCo(co); setIsModalOpen(true); }}
                            className="p-2 md:p-3 rounded-xl bg-red-50 border-2 border-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      <div className="relative">
                        <button 
                          onClick={() => setActiveMenu(activeMenu === co.id ? null : co.id)}
                          className={`p-2 md:p-3 rounded-xl border-2 transition-all ${
                            activeMenu === co.id 
                              ? "bg-violet-600 border-violet-600 text-white" 
                              : "bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 text-slate-400 hover:text-violet-500"
                          }`}
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>

                        {activeMenu === co.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)}></div>
                            <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-[#1a0b3b] border-2 border-slate-100 dark:border-white/10 rounded-2xl shadow-2xl z-20 py-3 animate-in fade-in slide-in-from-top-5 duration-200">
                              <button 
                                onClick={() => { handleUpdateStatus(co.id, co.status === 'blocked' ? 'active' : 'blocked'); setActiveMenu(null); }}
                                className="w-full px-6 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors"
                              >
                                {co.status === 'blocked' ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span className="text-body font-bold text-slate-700 dark:text-slate-200">Activate Account</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                    <span className="text-body font-bold text-slate-700 dark:text-slate-200">Block Access</span>
                                  </>
                                )}
                              </button>
                              
                              <div className="h-px bg-slate-100 dark:bg-white/5 my-2" />
                              
                              <button 
                                onClick={() => { 
                                  showConfirm({
                                    title: "Terminate Corporate Record",
                                    message: `Are you sure you want to PERMANENTLY delete ${co.name}? This action is irreversible and will wipe all associated data.`,
                                    onConfirm: () => handleUpdateStatus(co.id, 'deleted')
                                  });
                                  setActiveMenu(null);
                                }}
                                className="w-full px-6 py-3 text-left hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                              >
                                <XCircle className="h-4 w-4 text-red-500" />
                                <span className="text-body font-bold text-red-600">Terminate Record</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Responsive Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-[#0d0622] w-full max-w-lg rounded-[2.5rem] p-8 md:p-12 border-2 border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-heading-1 font-black text-white uppercase tracking-tight mb-4">Reject Registration</h3>
            <p className="text-slate-400 font-bold mb-8">Please provide a reason for rejecting <span className="text-violet-400">{selectedCo?.name}</span>. This will be sent to their email.</p>
            
            <textarea 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Invalid documents provided..."
              className="w-full h-32 bg-white/5 border-2 border-white/10 rounded-2xl p-6 text-white outline-none focus:border-red-500 transition-all font-bold mb-8"
            />

            <div className="flex gap-4">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 rounded-2xl bg-white/5 text-slate-400 font-black uppercase text-label tracking-widest hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleUpdateStatus(selectedCo.id, 'rejected', rejectionReason)}
                disabled={!rejectionReason || actionLoading}
                className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black uppercase text-label tracking-widest shadow-xl shadow-red-600/20 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  )
}

