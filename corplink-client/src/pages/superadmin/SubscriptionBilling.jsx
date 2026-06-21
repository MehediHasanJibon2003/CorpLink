import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import SuperAdminLayout from "../../components/superadmin/layout/SuperAdminLayout"
import { 
  ChevronRight, ArrowUpRight, Edit3, Settings,
  Bell, AlertTriangle, Send, Zap, Ban, FileText, CheckCircle2,
  AlertCircle, Clock, DollarSign, CreditCard, RefreshCw, Sparkles, Plus, Trash2,
  Shield, BarChart3, TrendingUp, PieChart, Activity
} from "lucide-react"
import PlanManagementModal from "../../components/superadmin/PlanManagementModal"
import SubscriptionControlModal from "../../components/superadmin/SubscriptionControlModal"
import PaymentActionModal from "../../components/superadmin/PaymentActionModal"
import InvoiceDetailsModal from "../../components/superadmin/InvoiceDetailsModal"
import GatewayConfigModal from "../../components/superadmin/GatewayConfigModal"
import { useConfirm } from "../../context/ConfirmContext"

export default function SubscriptionBilling() {
  const { showConfirm } = useConfirm()
  const [activeTab, setActiveTab] = useState("subscriptions")
  const [subs, setSubs] = useState([])
  const [plans, setPlans] = useState([])
  const [invoices, setInvoices] = useState([])
  const [alerts, setAlerts] = useState([])
  const [gateways, setGateways] = useState([])
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    mrr: 0,
    activeSubs: 0,
    expiredSubs: 0,
    planStats: []
  })
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [selectedSub, setSelectedSub] = useState(null)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [isSubModalOpen, setIsSubModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isInvoiceViewOpen, setIsInvoiceViewOpen] = useState(false)
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false)
  const [selectedGateway, setSelectedGateway] = useState(null)
  const [invoiceFilter, setInvoiceFilter] = useState("all")
  const [sendingReminder, setSendingReminder] = useState({})

  const fetchData = async () => {
    setLoading(true)
    const { data: sData } = await supabase.from("subscriptions").select("*, companies(name)").order("created_at", { ascending: false })
    const { data: pData } = await supabase.from("subscription_plans").select("*").order("price", { ascending: true })
    const { data: iData } = await supabase.from("invoices").select("*, companies(name), subscription_plans(name)").order("created_at", { ascending: false })
    const { data: aData } = await supabase.from("billing_alerts").select("*, companies(name)").order("created_at", { ascending: false })
    const { data: gData } = await supabase.from("payment_gateways").select("*").order("name", { ascending: true })
    
    setSubs(sData || [])
    setPlans(pData || [])
    setInvoices(iData || [])
    setAlerts(aData || [])
    setGateways(gData || [])
    
    // Calculate Metrics
    const totalRev = (iData || []).filter(i => i.status === 'paid').reduce((acc, curr) => acc + Number(curr.amount), 0)
    const active = (sData || []).filter(s => s.status === 'active')
    const expired = (sData || []).filter(s => s.status === 'deactivated' || (s.expiry_date && new Date(s.expiry_date) < new Date()))
    
    // MRR Calculation
    const mrr = active.reduce((acc, curr) => {
      const plan = (pData || []).find(p => p.id === curr.plan_id)
      return acc + (plan ? Number(plan.price) : 0)
    }, 0)

    // Plan Statistics
    const pStats = (pData || []).map(p => ({
      name: p.name,
      count: (sData || []).filter(s => s.plan_id === p.id).length,
      revenue: (iData || []).filter(i => i.plan_id === p.id && i.status === 'paid').reduce((acc, curr) => acc + Number(curr.amount), 0),
      color: p.color
    }))

    setMetrics({
      totalRevenue: totalRev,
      mrr: mrr,
      activeSubs: active.length,
      expiredSubs: expired.length,
      planStats: pStats
    })

    setLoading(false)
  }

  const handleDeletePlan = (id) => {
    showConfirm({
      title: "Delete Plan",
      message: "Are you sure you want to delete this plan? This may affect existing subscriptions.",
      onConfirm: async () => {
        const { error } = await supabase.from("subscription_plans").delete().eq("id", id)
        if (error) alert(error.message)
        else fetchData()
      }
    })
  }

  const openPlanModal = (plan = null) => {
    setSelectedPlan(plan)
    setIsPlanModalOpen(true)
  }

  const handleSendReminder = async (billingAlert) => {
    setSendingReminder(prev => ({ ...prev, [billingAlert.id]: true }))
    try {
      await supabase.from('notifications').insert([{
        company_id: billingAlert.company_id,
        title: 'Billing Reminder',
        message: billingAlert.message || `Your subscription requires attention.`,
        type: 'billing',
        is_read: false
      }])
    } catch (err) {
      console.error('Reminder send failed:', err.message)
    } finally {
      setSendingReminder(prev => ({ ...prev, [billingAlert.id]: false }))
    }
  }

  useEffect(() => { fetchData() }, [])

  return (
    <SuperAdminLayout title="Subscriptions" subtitle="Manage tiers and platform revenue">
      
      {/* Responsive Tabs Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-row gap-3 md:gap-6 mb-8 md:mb-12">
        {[
          { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
          { id: "plans",         label: "Plans",          icon: Sparkles },
          { id: "invoices",      label: "Invoices",       icon: FileText },
          { id: "alerts",        label: "Alerts",         icon: Bell },
          { id: "gateways",      label: "Gateways",       icon: Shield },
          { id: "analytics",     label: "Analytics",      icon: BarChart3 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center justify-center lg:justify-start gap-2 md:gap-3 px-4 md:px-8 py-3.5 md:py-5 rounded-xl md:rounded-[2rem] font-black uppercase text-[9px] md:text-label tracking-widest transition-all border-2 ${
              activeTab === tab.id 
                ? "bg-violet-600 text-white border-violet-600 shadow-lg" 
                : "bg-white dark:bg-white/5 text-slate-500 dark:text-violet-400 border-slate-100 dark:border-violet-500/15"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5 md:h-5 md:w-5" />
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="relative z-10">
        
        {/* TAB 1: SUBSCRIPTIONS */}
        {activeTab === "subscriptions" && (
          <div className="rounded-3xl md:rounded-[3rem] overflow-hidden bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-violet-500/5 border-b-2 border-slate-100 dark:border-violet-500/10">
                    <th className="px-10 py-8 text-badge font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Company</th>
                    <th className="px-10 py-8 text-badge font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Plan</th>
                    <th className="px-10 py-8 text-badge font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Status</th>
                    <th className="px-10 py-8 text-badge font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Expiry</th>
                    <th className="px-10 py-8 text-badge font-black uppercase tracking-widest text-slate-500 dark:text-violet-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-100 dark:divide-violet-500/5">
                  {loading ? (
                    <tr><td colSpan={5} className="py-20 text-center animate-pulse font-black text-slate-400">Scanning Subscriptions...</td></tr>
                  ) : subs.map(sub => (
                    <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] group">
                      <td className="px-10 py-8">
                        <p className="text-heading-3 font-black text-slate-900 dark:text-white uppercase tracking-tight">{sub.companies?.name || 'Unknown'}</p>
                        <p className="text-badge font-bold text-slate-500 truncate">ID: {sub.company_id.substring(0, 8)}...</p>
                      </td>
                      <td className="px-10 py-8 font-black uppercase text-label text-violet-600 dark:text-violet-400">{sub.plan}</td>
                      <td className="px-10 py-8">
                        <span className={`px-4 py-1.5 rounded-full text-badge font-black uppercase border-2 ${sub.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-10 py-8 font-black uppercase text-badge text-slate-500">
                        {sub.expiry_date ? new Date(sub.expiry_date).toLocaleDateString() : "Lifetime"}
                      </td>
                      <td className="px-10 py-8 text-right">
                        <button 
                          onClick={() => { setSelectedSub(sub); setIsSubModalOpen(true); }}
                          className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-violet-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                        >
                          <Settings className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y-2 divide-slate-100 dark:divide-violet-500/5">
              {loading ? (
                <div className="py-20 text-center animate-pulse font-black text-slate-400 uppercase tracking-widest text-badge">Scanning...</div>
              ) : subs.map(sub => (
                <div key={sub.id} className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-heading-3 font-black text-slate-900 dark:text-white uppercase tracking-tight truncate max-w-[200px]">{sub.companies?.name || 'Unknown'}</p>
                      <p className="text-badge font-bold text-slate-500 mt-0.5">{sub.plan} Plan</p>
                    </div>
                    <button 
                      onClick={() => { setSelectedSub(sub); setIsSubModalOpen(true); }}
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-400"
                    >
                      <Settings className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${sub.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                      {sub.status}
                    </span>
                    <p className="text-badge font-black text-slate-400 uppercase tracking-widest">
                      Expires: {sub.expiry_date ? new Date(sub.expiry_date).toLocaleDateString() : "Lifetime"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: PLANS */}
        {activeTab === "plans" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {plans.map(plan => (
              <div 
                key={plan.id} 
                className="rounded-3xl md:rounded-[3rem] p-6 md:p-10 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 relative overflow-hidden group text-center flex flex-col items-center transition-all"
                style={{ 
                  borderColor: plan.color ? `${plan.color}30` : undefined,
                  background: plan.color ? `linear-gradient(135deg, ${plan.color}08 0%, transparent 100%)` : undefined
                }}
              >
                <h3 className="text-heading-3 md:text-heading-1 font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2 w-full">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-2 mb-6 md:mb-8 w-full">
                  <span className="text-heading-1 md:text-5xl font-black" style={{ color: plan.color || '#7c3aed' }}>${plan.price}</span>
                  <span className="text-badge font-bold uppercase tracking-widest text-slate-400">/ {plan.billing_cycle}</span>
                </div>
                <div className="space-y-2 md:space-y-3 mb-8 md:mb-10 w-full flex flex-col items-center">
                  {plan.features?.slice(0, 4).map((f, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-badge md:text-body font-bold text-slate-600 dark:text-violet-300">
                      <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" style={{ color: plan.color || '#10b981' }} /> {f}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 md:gap-4 mt-auto w-full">
                  <button 
                    onClick={() => openPlanModal(plan)}
                    className="flex-1 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-slate-100 dark:bg-white/5 font-black uppercase text-badge md:text-label tracking-widest text-slate-600 dark:text-violet-400 transition-all flex items-center justify-center gap-2 hover:bg-violet-600 hover:text-white"
                  >
                    <Edit3 className="h-4 w-4" /> Edit
                  </button>
                  <button 
                    onClick={() => handleDeletePlan(plan.id)}
                    className="p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <button 
              onClick={() => openPlanModal(null)}
              className="rounded-3xl md:rounded-[3rem] p-8 md:p-10 border-2 border-dashed border-slate-200 dark:border-violet-500/20 flex flex-col items-center justify-center gap-4 text-slate-400 hover:text-violet-500 transition-all min-h-[200px]"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400"><Plus className="h-6 w-6 md:h-8 md:w-8" /></div>
              <span className="font-black uppercase tracking-widest text-badge md:text-body">Add Plan</span>
            </button>
          </div>
        )}

        {/* TAB 3: INVOICES */}
        {activeTab === "invoices" && (
          <div className="space-y-6">
            {/* Invoice Filter */}
            <div className="flex gap-3 mb-6 overflow-x-auto pb-2 no-scrollbar">
              {['all', 'pending', 'paid', 'failed', 'refunded'].map(status => (
                <button
                  key={status}
                  onClick={() => setInvoiceFilter(status)}
                  className={`px-5 py-2 rounded-xl text-badge font-black uppercase tracking-widest transition-all border-2 shrink-0 ${
                    invoiceFilter === status 
                      ? "bg-slate-900 dark:bg-violet-600 text-white border-slate-900 dark:border-violet-600 shadow-lg" 
                      : "bg-white dark:bg-white/5 text-slate-400 border-slate-100 dark:border-white/10"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="rounded-3xl md:rounded-[3rem] overflow-hidden bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-violet-500/5 border-b-2 border-slate-100 dark:border-violet-500/10">
                      <th className="px-10 py-8 text-badge font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Invoice</th>
                      <th className="px-10 py-8 text-badge font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Corporate</th>
                      <th className="px-10 py-8 text-badge font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Amount</th>
                      <th className="px-10 py-8 text-badge font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Status</th>
                      <th className="px-10 py-8 text-badge font-black uppercase tracking-widest text-slate-500 dark:text-violet-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-100 dark:divide-violet-500/5">
                    {invoices.filter(inv => invoiceFilter === 'all' || inv.status === invoiceFilter).length === 0 ? (
                      <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase text-label tracking-widest">No Invoices Found</td></tr>
                    ) : invoices.filter(inv => invoiceFilter === 'all' || inv.status === invoiceFilter).map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] group">
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 shrink-0"><FileText className="h-5 w-5" /></div>
                            <p className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-label">{inv.invoice_number}</p>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <p className="font-black text-slate-900 dark:text-white uppercase text-label truncate max-w-[150px]">{inv.companies?.name}</p>
                          <p className="text-badge font-bold text-slate-500">{inv.subscription_plans?.name} Plan</p>
                        </td>
                        <td className="px-10 py-8 font-black text-violet-600 text-heading-3">${inv.amount}</td>
                        <td className="px-10 py-8">
                          <span className={`px-4 py-1 rounded-full text-badge font-black uppercase border-2 flex items-center gap-2 w-fit ${
                            inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                            inv.status === 'failed' ? 'bg-red-50 text-red-600 border-red-100' : 
                            inv.status === 'refunded' ? 'bg-slate-50 text-slate-600 border-slate-100' : 
                            'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-10 py-8 text-right flex justify-end gap-3">
                          <button 
                            onClick={() => { setSelectedInvoice(inv); setIsInvoiceViewOpen(true); }}
                            className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-violet-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                          >
                            <FileText className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => { setSelectedInvoice(inv); setIsPaymentModalOpen(true); }}
                            className="px-6 py-2 rounded-xl bg-slate-900 dark:bg-violet-600 text-white font-black uppercase text-badge tracking-widest hover:scale-105 transition-all opacity-0 group-hover:opacity-100"
                          >
                            Process
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y-2 divide-slate-100 dark:divide-violet-500/5">
                {invoices.filter(inv => invoiceFilter === 'all' || inv.status === invoiceFilter).length === 0 ? (
                  <div className="py-20 text-center text-slate-400 font-bold uppercase text-badge">No Invoices Found</div>
                ) : invoices.filter(inv => invoiceFilter === 'all' || inv.status === invoiceFilter).map(inv => (
                  <div key={inv.id} className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 shrink-0"><FileText className="h-5 w-5" /></div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white uppercase text-badge">{inv.invoice_number}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">{inv.companies?.name}</p>
                        </div>
                      </div>
                      <p className="text-heading-3 font-black text-violet-600">${inv.amount}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border-2 ${
                          inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                       }`}>
                          {inv.status}
                       </span>
                       <div className="flex gap-2">
                          <button onClick={() => { setSelectedInvoice(inv); setIsInvoiceViewOpen(true); }} className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-400">
                             <FileText className="h-5 w-5" />
                          </button>
                          <button onClick={() => { setSelectedInvoice(inv); setIsPaymentModalOpen(true); }} className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-violet-600 text-white font-black uppercase text-[10px]">
                             Process
                          </button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ALERTS */}
        {activeTab === "alerts" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
               <div className="bg-amber-50 dark:bg-amber-500/5 p-5 md:p-6 rounded-2xl md:rounded-3xl border-2 border-amber-100 dark:border-amber-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-amber-600">Renewals</h4>
                  </div>
                  <p className="text-heading-2 md:text-heading-1 font-black text-slate-900 dark:text-white">{alerts.filter(a => a.type === 'renewal_warning').length}</p>
               </div>
               <div className="bg-red-50 dark:bg-red-500/5 p-5 md:p-6 rounded-2xl md:rounded-3xl border-2 border-red-100 dark:border-red-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Ban className="h-4 w-4 text-red-500" />
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-red-600">Expired</h4>
                  </div>
                  <p className="text-heading-2 md:text-heading-1 font-black text-slate-900 dark:text-white">{alerts.filter(a => a.type === 'expired').length}</p>
               </div>
               <div className="bg-violet-50 dark:bg-violet-500/5 p-5 md:p-6 rounded-2xl md:rounded-3xl border-2 border-violet-100 dark:border-violet-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="h-4 w-4 text-violet-500" />
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-violet-600">Upgrades</h4>
                  </div>
                  <p className="text-heading-2 md:text-heading-1 font-black text-slate-900 dark:text-white">{alerts.filter(a => a.type === 'upgrade_suggestion').length}</p>
               </div>
            </div>

            <div className="space-y-4">
               {alerts.length === 0 ? (
                 <div className="py-20 text-center bg-slate-50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-slate-200">
                    <Bell className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                    <p className="font-black uppercase text-badge text-slate-400 tracking-widest">No Urgent Alerts</p>
                 </div>
               ) : alerts.map(billingAlert => (
                 <div key={billingAlert.id} className="p-5 md:p-8 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-3xl flex flex-col lg:flex-row items-center justify-between gap-6 hover:border-violet-500/30 transition-all">
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
                       <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                         billingAlert.priority === 'high' ? 'bg-red-500 text-white' : 
                         billingAlert.priority === 'medium' ? 'bg-amber-500 text-white' : 'bg-violet-500 text-white'
                       }`}>
                          {billingAlert.type === 'renewal_warning' ? <Clock className="h-5 w-5 md:h-6 md:w-6" /> : 
                           billingAlert.type === 'expired' ? <AlertCircle className="h-5 w-5 md:h-6 md:w-6" /> : <Zap className="h-5 w-5 md:h-6 md:w-6" />}
                       </div>
                       <div>
                          <h4 className="text-heading-3 font-black text-slate-900 dark:text-white uppercase tracking-tight truncate max-w-[200px]">{billingAlert.companies?.name}</h4>
                          <p className="text-badge font-bold text-slate-500 uppercase tracking-widest mt-1 line-clamp-1">{billingAlert.message}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <button 
                          onClick={() => handleSendReminder(billingAlert)}
                          disabled={sendingReminder[billingAlert.id]}
                          className="flex-1 lg:flex-none px-6 py-3 rounded-xl bg-slate-900 dark:bg-violet-600 text-white font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                        >
                          {sendingReminder[billingAlert.id] ? (
                            <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending…</>
                          ) : (
                            <><Send className="h-3.5 w-3.5" /> Send</>
                          )}
                        </button>
                       <button 
                         onClick={async () => {
                           await supabase.from("billing_alerts").delete().eq("id", billingAlert.id);
                           fetchData();
                         }}
                         className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400"
                       >
                         <Trash2 className="h-4 w-4" />
                       </button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* TAB 5: GATEWAYS */}
        {activeTab === "gateways" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {gateways.map(gw => (
              <div key={gw.id} className="p-6 md:p-8 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-3xl flex flex-col justify-between group hover:border-violet-600/30 transition-all">
                <div className="space-y-5">
                  <div className="flex justify-between items-start">
                    {gw.logo_url ? (
                      <img src={gw.logo_url} alt={gw.name} className="h-6 md:h-10 object-contain dark:invert" />
                    ) : (
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 dark:bg-white/10 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-400">
                         <CreditCard className="h-5 w-5 md:h-6 md:w-6" />
                      </div>
                    )}
                    <button 
                      onClick={async () => {
                        await supabase.from("payment_gateways").update({ is_active: !gw.is_active }).eq("id", gw.id);
                        fetchData();
                      }}
                      className={`w-12 md:w-14 h-7 md:h-8 rounded-full relative transition-all ${gw.is_active ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-white/10'}`}
                    >
                      <div className={`absolute top-0.5 md:top-1 w-6 h-6 rounded-full bg-white transition-all ${gw.is_active ? 'right-0.5 md:right-1' : 'left-0.5 md:left-1'}`} />
                    </button>
                  </div>
                  <div>
                    <h4 className="text-heading-3 md:text-heading-2 font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{gw.display_name}</h4>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                      Status: <span className={gw.is_active ? "text-emerald-500" : "text-red-500"}>{gw.is_active ? 'Online' : 'Offline'}</span>
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => { setSelectedGateway(gw); setIsGatewayModalOpen(true); }}
                  className="mt-6 md:mt-8 w-full py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 text-slate-500 dark:text-violet-400 font-black uppercase text-badge md:text-[10px] tracking-widest hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all flex items-center justify-center gap-2"
                >
                  <Settings className="h-4 w-4" /> Configure
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TAB 6: ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="space-y-10 animate-in fade-in duration-500">
            {/* Top Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              <div className="p-5 md:p-8 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 rounded-3xl md:rounded-[3rem] shadow-sm relative overflow-hidden">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-emerald-500 mb-3 md:mb-4" />
                <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">Revenue</p>
                <h3 className="text-heading-3 md:text-heading-1 font-black text-slate-900 dark:text-white mt-1">${metrics.totalRevenue.toLocaleString()}</h3>
              </div>

              <div className="p-5 md:p-8 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 rounded-3xl md:rounded-[3rem] shadow-sm relative overflow-hidden">
                <Activity className="h-5 w-5 md:h-6 md:w-6 text-violet-500 mb-3 md:mb-4" />
                <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">MRR</p>
                <h3 className="text-heading-3 md:text-heading-1 font-black text-slate-900 dark:text-white mt-1">${metrics.mrr.toLocaleString()}</h3>
              </div>

              <div className="p-5 md:p-8 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 rounded-3xl md:rounded-[3rem] shadow-sm relative overflow-hidden">
                <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-blue-500 mb-3 md:mb-4" />
                <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">Active</p>
                <h3 className="text-heading-3 md:text-heading-1 font-black text-slate-900 dark:text-white mt-1">{metrics.activeSubs}</h3>
              </div>

              <div className="p-5 md:p-8 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 rounded-3xl md:rounded-[3rem] shadow-sm relative overflow-hidden">
                <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-red-500 mb-3 md:mb-4" />
                <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">Expired</p>
                <h3 className="text-heading-3 md:text-heading-1 font-black text-slate-900 dark:text-white mt-1">{metrics.expiredSubs}</h3>
              </div>
            </div>

            {/* Middle Section: Plan Stats & Visuals */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
               {/* Per-Plan Revenue */}
               <div className="lg:col-span-2 p-6 md:p-10 bg-slate-900 text-white rounded-3xl md:rounded-[3rem] shadow-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-8 md:mb-10">
                     <div>
                        <h4 className="text-heading-3 md:text-heading-2 font-black uppercase tracking-tighter">Revenue by Plan</h4>
                        <p className="text-[9px] md:text-label font-bold text-slate-400 uppercase tracking-widest mt-1">Income breakdown per tier</p>
                     </div>
                     <PieChart className="h-5 w-5 md:h-6 md:w-6 text-violet-400" />
                  </div>
                  
                  <div className="space-y-6 md:space-y-8">
                     {metrics.planStats.map(stat => (
                        <div key={stat.name} className="space-y-2 md:space-y-3">
                           <div className="flex justify-between items-end">
                              <div>
                                 <span className="text-badge md:text-label font-black uppercase tracking-widest" style={{ color: stat.color }}>{stat.name}</span>
                                 <p className="text-[10px] md:text-body font-bold text-slate-400">{stat.count} Subs</p>
                              </div>
                              <span className="text-label md:text-heading-3 font-black">${stat.revenue.toLocaleString()}</span>
                           </div>
                           <div className="h-2 md:h-3 w-full bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(stat.revenue / (metrics.totalRevenue || 1)) * 100}%`, backgroundColor: stat.color }} />
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Retention Visual */}
               <div className="p-6 md:p-10 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 rounded-3xl md:rounded-[3rem] flex flex-col justify-between">
                  <div>
                    <h4 className="text-heading-3 md:text-heading-2 font-black text-slate-900 dark:text-white uppercase tracking-tighter">Retention</h4>
                    <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Monthly performance</p>
                  </div>

                  <div className="flex-1 flex items-center justify-center py-6 md:py-10">
                     <div className="relative">
                        <svg className="w-32 h-32 md:w-48 md:h-48 -rotate-90">
                           <circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100 dark:text-white/5" />
                           <circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={300} strokeDashoffset={300 - (300 * (metrics.activeSubs / ((metrics.activeSubs + metrics.expiredSubs) || 1)))} className="text-violet-600 transition-all duration-1000" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <span className="text-heading-2 md:text-heading-1 font-black text-slate-900 dark:text-white">{Math.round((metrics.activeSubs / ((metrics.activeSubs + metrics.expiredSubs) || 1)) * 100)}%</span>
                        </div>
                     </div>
                  </div>

                  <button className="w-full py-3.5 md:py-4 bg-slate-900 dark:bg-violet-600 text-white rounded-2xl font-black uppercase text-badge md:text-[10px] tracking-widest">
                     Reports
                  </button>
               </div>
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

        {isPaymentModalOpen && (
          <PaymentActionModal 
            invoice={selectedInvoice}
            onClose={() => setIsPaymentModalOpen(false)}
            onSuccess={() => {
              setIsPaymentModalOpen(false);
              fetchData();
            }}
          />
        )}

        {isInvoiceViewOpen && (
          <InvoiceDetailsModal 
            invoice={selectedInvoice}
            onClose={() => setIsInvoiceViewOpen(false)}
          />
        )}

        {isGatewayModalOpen && (
          <GatewayConfigModal 
            gateway={selectedGateway}
            onClose={() => setIsGatewayModalOpen(false)}
            onSuccess={() => {
              setIsGatewayModalOpen(false);
              fetchData();
            }}
          />
        )}

      </div>
    </SuperAdminLayout>
  )
}

