import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import SuperAdminLayout from "../../components/superadmin/layout/SuperAdminLayout"
import { 
  CreditCard, RefreshCw, Sparkles, Plus, Trash2, 
  FileText, CheckCircle2, AlertCircle, Clock, DollarSign,
  ChevronRight, ArrowUpRight, Edit3, Settings
} from "lucide-react"
import PlanManagementModal from "../../components/superadmin/PlanManagementModal"
import SubscriptionControlModal from "../../components/superadmin/SubscriptionControlModal"

export default function SubscriptionBilling() {
  const [activeTab, setActiveTab] = useState("subscriptions")
  const [subs, setSubs] = useState([])
  const [plans, setPlans] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [selectedSub, setSelectedSub] = useState(null)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [isSubModalOpen, setIsSubModalOpen] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const { data: sData } = await supabase.from("subscriptions").select("*, companies(name)").order("created_at", { ascending: false })
    const { data: pData } = await supabase.from("subscription_plans").select("*").order("price", { ascending: true })
    const { data: iData } = await supabase.from("invoices").select("*, companies(name), subscription_plans(name)").order("created_at", { ascending: false })
    setSubs(sData || [])
    setPlans(pData || [])
    setInvoices(iData || [])
    setLoading(false)
  }

  const handleDeletePlan = async (id) => {
    if (!confirm("Are you sure you want to delete this plan? This may affect existing subscriptions.")) return
    const { error } = await supabase.from("subscription_plans").delete().eq("id", id)
    if (error) alert(error.message)
    else fetchData()
  }

  const openPlanModal = (plan = null) => {
    setSelectedPlan(plan)
    setIsPlanModalOpen(true)
  }

  useEffect(() => { fetchData() }, [])

  return (
    <SuperAdminLayout title="Subscriptions" subtitle="Manage tiers and platform revenue">
      
      {/* Responsive Tabs Navigation */}
      <div className="flex gap-3 md:gap-6 mb-8 md:mb-12 overflow-x-auto pb-2 no-scrollbar">
        {[
          { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
          { id: "plans",         label: "Plans",          icon: Sparkles },
          { id: "invoices",      label: "Invoices",       icon: FileText },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 md:gap-3 px-6 md:px-8 py-4 md:py-5 rounded-2xl md:rounded-[2rem] font-black uppercase text-[10px] md:text-xs tracking-widest transition-all border-2 shrink-0 ${
              activeTab === tab.id 
                ? "bg-violet-600 text-white border-violet-600 shadow-xl" 
                : "bg-white dark:bg-white/5 text-slate-500 dark:text-violet-400 border-slate-100 dark:border-violet-500/15"
            }`}
          >
            <tab.icon className="h-4 w-4 md:h-5 md:w-5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative z-10">
        
        {/* TAB 1: SUBSCRIPTIONS */}
        {activeTab === "subscriptions" && (
          <div className="rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px] lg:min-w-full">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-violet-500/5 border-b-2 border-slate-100 dark:border-violet-500/10">
                    <th className="px-8 py-6 md:py-8 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Company</th>
                    <th className="px-8 py-6 md:py-8 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Plan</th>
                    <th className="px-8 py-6 md:py-8 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Status</th>
                    <th className="px-8 py-6 md:py-8 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Expiry</th>
                    <th className="px-8 py-6 md:py-8 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-violet-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-100 dark:divide-violet-500/5">
                  {loading ? (
                    <tr><td colSpan={5} className="py-20 text-center animate-pulse font-black text-slate-400">Loading...</td></tr>
                  ) : subs.map(sub => (
                    <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] group">
                      <td className="px-8 py-6 md:py-8">
                        <p className="text-base md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{sub.companies?.name || 'Unknown Company'}</p>
                        <p className="text-[10px] font-bold text-slate-500 truncate">ID: {sub.company_id.substring(0, 8)}...</p>
                      </td>
                      <td className="px-8 py-6 md:py-8 font-black uppercase text-[10px] md:text-xs text-violet-600 dark:text-violet-400">{sub.plan}</td>
                      <td className="px-8 py-6 md:py-8">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase border-2 ${sub.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 md:py-8 font-black uppercase text-[10px] text-slate-500">
                        {sub.expiry_date ? new Date(sub.expiry_date).toLocaleDateString() : "Lifetime"}
                      </td>
                      <td className="px-8 py-6 md:py-8 text-right">
                        <button 
                          onClick={() => { setSelectedSub(sub); setIsSubModalOpen(true); }}
                          className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-amber-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Settings className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PLANS */}
        {activeTab === "plans" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {plans.map(plan => (
              <div 
                key={plan.id} 
                className="rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-10 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 relative overflow-hidden group text-center flex flex-col items-center transition-all"
                style={{ 
                  borderColor: plan.color ? `${plan.color}30` : undefined,
                  background: plan.color ? `linear-gradient(135deg, ${plan.color}08 0%, transparent 100%)` : undefined
                }}
              >
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2 w-full">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-2 mb-8 w-full">
                  <span className="text-4xl md:text-5xl font-black" style={{ color: plan.color || '#7c3aed' }}>${plan.price}</span>
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">/ {plan.billing_cycle}</span>
                </div>
                <div className="space-y-3 mb-10 w-full flex flex-col items-center">
                  {plan.features?.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs md:text-sm font-bold text-slate-600 dark:text-violet-300">
                      <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: plan.color || '#10b981' }} /> {f}
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-10 w-full">
                  <button 
                    onClick={() => openPlanModal(plan)}
                    className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 font-black uppercase text-[10px] md:text-xs tracking-widest text-slate-600 dark:text-violet-400 transition-all flex items-center justify-center gap-2 hover:text-white"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = plan.color || '#7c3aed'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                  >
                    <Edit3 className="h-4 w-4" /> Edit
                  </button>
                  <button 
                    onClick={() => handleDeletePlan(plan.id)}
                    className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <button 
              onClick={() => openPlanModal(null)}
              className="rounded-[2.5rem] md:rounded-[3rem] p-10 border-2 border-dashed border-slate-200 dark:border-violet-500/20 flex flex-col items-center justify-center gap-4 text-slate-400 hover:text-violet-500 transition-all min-h-[300px]"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center"><Plus className="h-6 w-6 md:h-8 md:w-8" /></div>
              <span className="font-black uppercase tracking-widest text-[10px] md:text-sm">Add New Plan</span>
            </button>
          </div>
        )}

        {/* TAB 3: INVOICES */}
        {activeTab === "invoices" && (
          <div className="rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px] lg:min-w-full">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-violet-500/5 border-b-2 border-slate-100 dark:border-violet-500/10">
                    <th className="px-8 py-6 md:py-8 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Invoice</th>
                    <th className="px-8 py-6 md:py-8 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Corporate</th>
                    <th className="px-8 py-6 md:py-8 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Amount</th>
                    <th className="px-8 py-6 md:py-8 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-100 dark:divide-violet-500/5">
                  {invoices.length === 0 ? (
                    <tr><td colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">No Invoices</td></tr>
                  ) : invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <td className="px-8 py-6 md:py-8">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 shrink-0"><FileText className="h-4 w-4 md:h-5 md:w-5" /></div>
                          <p className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-[10px] md:text-sm">{inv.invoice_number}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6 md:py-8">
                        <p className="font-black text-slate-900 dark:text-white uppercase text-[10px] md:text-sm truncate max-w-[150px]">{inv.companies?.name}</p>
                        <p className="text-[9px] md:text-xs font-bold text-slate-500">{inv.subscription_plans?.name} Plan</p>
                      </td>
                      <td className="px-8 py-6 md:py-8 font-black text-violet-600 text-sm md:text-lg">${inv.amount}</td>
                      <td className="px-8 py-6 md:py-8">
                        <span className={`px-3 md:px-4 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase border-2 flex items-center gap-2 w-fit ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isPlanModalOpen && (
          <PlanManagementModal 
            plan={selectedPlan}
            onClose={() => setIsPlanModalOpen(false)}
            onSuccess={() => {
              setIsPlanModalOpen(false);
              fetchData();
            }}
          />
        )}

        {isSubModalOpen && (
          <SubscriptionControlModal 
            subscription={selectedSub}
            onClose={() => setIsSubModalOpen(false)}
            onSuccess={() => {
              setIsSubModalOpen(false);
              fetchData();
            }}
          />
        )}

      </div>
    </SuperAdminLayout>
  )
}
