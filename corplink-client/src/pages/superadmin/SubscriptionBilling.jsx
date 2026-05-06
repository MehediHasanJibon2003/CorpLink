import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import SuperAdminLayout from "../../components/superadmin/layout/SuperAdminLayout"
import { 
  CreditCard, RefreshCw, Sparkles, Plus, Trash2, 
  FileText, CheckCircle2, AlertCircle, Clock, DollarSign,
  ChevronRight, ArrowUpRight
} from "lucide-react"

export default function SubscriptionBilling() {
  const [activeTab, setActiveTab] = useState("subscriptions") // subscriptions, plans, invoices
  const [subs, setSubs] = useState([])
  const [plans, setPlans] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    
    // Fetch Subscriptions
    const { data: sData } = await supabase.from("subscriptions").select("*, companies(name, email)").order("created_at", { ascending: false })
    
    // Fetch Plans
    const { data: pData } = await supabase.from("subscription_plans").select("*").order("price", { ascending: true })
    
    // Fetch Invoices
    const { data: iData } = await supabase.from("invoices").select("*, companies(name), subscription_plans(name)").order("created_at", { ascending: false })

    setSubs(sData || [])
    setPlans(pData || [])
    setInvoices(iData || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleUpdateSub = async (id, field, value) => {
    setSaving(id)
    await supabase.from("subscriptions").update({ [field]: value }).eq("id", id)
    await fetchData()
    setSaving(null)
  }

  const handleUpdateInvoice = async (id, status) => {
    setSaving(id)
    const updateData = { status }
    if (status === 'paid') updateData.paid_at = new Date().toISOString()
    await supabase.from("invoices").update(updateData).eq("id", id)
    await fetchData()
    setSaving(null)
  }

  const handleDeletePlan = async (id) => {
    if (!window.confirm("Are you sure? This may affect existing subscriptions.")) return
    await supabase.from("subscription_plans").delete().eq("id", id)
    await fetchData()
  }

  return (
    <SuperAdminLayout title="Subscriptions & Billing" subtitle="Manage corporate tiers, monitor revenue, and track invoices">
      
      {/* Tabs */}
      <div className="flex gap-4 md:gap-6 mb-12 relative z-10">
        {[
          { id: "subscriptions", label: "Active Subscriptions", icon: CreditCard },
          { id: "plans",         label: "Subscription Plans",   icon: Sparkles },
          { id: "invoices",      label: "Invoices & Payments",  icon: FileText },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-8 py-5 rounded-[2rem] font-black uppercase tracking-widest transition-all border-2 ${
              activeTab === tab.id 
                ? "bg-violet-600 text-white border-violet-600 shadow-xl shadow-violet-600/30" 
                : "bg-white dark:bg-white/5 text-slate-500 dark:text-violet-400 border-slate-100 dark:border-violet-500/15 hover:border-violet-500/30"
            }`}
          >
            <tab.icon className="h-5 w-5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative z-10">
        
        {/* TAB 1: SUBSCRIPTIONS */}
        {activeTab === "subscriptions" && (
          <div className="rounded-[3rem] overflow-hidden bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-violet-500/5 border-b-2 border-slate-100 dark:border-violet-500/10">
                    <th className="px-10 py-8 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Company</th>
                    <th className="px-10 py-8 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Current Plan</th>
                    <th className="px-10 py-8 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Status</th>
                    <th className="px-10 py-8 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Expiry</th>
                    <th className="px-10 py-8 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-100 dark:divide-violet-500/5 text-slate-700 dark:text-violet-200">
                  {loading ? (
                    <tr><td colSpan={5} className="py-20 text-center animate-pulse font-black uppercase tracking-widest text-slate-400">Loading subscriptions...</td></tr>
                  ) : subs.map(sub => (
                    <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-10 py-8">
                        <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{sub.companies?.name}</p>
                        <p className="text-sm font-bold text-slate-500">{sub.companies?.email}</p>
                      </td>
                      <td className="px-10 py-8">
                        <select 
                          value={sub.plan} 
                          onChange={(e) => handleUpdateSub(sub.id, 'plan', e.target.value)}
                          className="bg-violet-50 dark:bg-violet-500/10 border-2 border-violet-100 dark:border-violet-500/20 rounded-xl px-4 py-2 font-black uppercase text-xs tracking-widest outline-none text-violet-600 dark:text-violet-400"
                        >
                          <option value="basic">Basic</option>
                          <option value="standard">Standard</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </td>
                      <td className="px-10 py-8">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${
                          sub.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-10 py-8 font-black uppercase text-xs tracking-widest">
                        {sub.expiry_date ? new Date(sub.expiry_date).toLocaleDateString() : "Lifetime"}
                      </td>
                      <td className="px-10 py-8">
                        <button 
                          onClick={() => handleUpdateSub(sub.id, 'status', sub.status === 'active' ? 'expired' : 'active')}
                          className={`px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${
                            sub.status === 'active' ? 'bg-red-50 text-red-600 border-2 border-red-100' : 'bg-emerald-50 text-emerald-600 border-2 border-emerald-100'
                          }`}
                        >
                          {sub.status === 'active' ? "Suspend" : "Activate"}
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
          <div className="grid md:grid-cols-3 gap-8 animate-in fade-in duration-500">
            {plans.map(plan => (
              <div key={plan.id} className="rounded-[3rem] p-10 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 blur-3xl -translate-y-10 translate-x-10" />
                <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-5xl font-black text-violet-600">${plan.price}</span>
                  <span className="text-slate-400 font-bold uppercase text-xs tracking-widest">/ {plan.billing_cycle}</span>
                </div>
                <div className="space-y-4 mb-10">
                  {plan.features?.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-violet-300">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" /> {f}
                    </div>
                  ))}
                </div>
                <div className="flex gap-4">
                  <button className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 font-black uppercase text-xs tracking-widest text-slate-600 dark:text-violet-400 border-2 border-transparent hover:border-violet-500/30 transition-all">Edit</button>
                  <button onClick={() => handleDeletePlan(plan.id)} className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-500 border-2 border-red-100 dark:border-red-900/30"><Trash2 className="h-5 w-5" /></button>
                </div>
              </div>
            ))}
            <button className="rounded-[3rem] p-10 border-2 border-dashed border-slate-200 dark:border-violet-500/20 flex flex-col items-center justify-center gap-4 text-slate-400 hover:text-violet-500 hover:border-violet-500/50 transition-all group">
              <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform"><Plus className="h-8 w-8" /></div>
              <span className="font-black uppercase tracking-widest text-sm">Add New Plan</span>
            </button>
          </div>
        )}

        {/* TAB 3: INVOICES */}
        {activeTab === "invoices" && (
          <div className="rounded-[3rem] overflow-hidden bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm animate-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-violet-500/5 border-b-2 border-slate-100 dark:border-violet-500/10">
                    <th className="px-10 py-8 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Invoice</th>
                    <th className="px-10 py-8 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Corporate</th>
                    <th className="px-10 py-8 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Amount</th>
                    <th className="px-10 py-8 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Status</th>
                    <th className="px-10 py-8 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Due Date</th>
                    <th className="px-10 py-8 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-100 dark:divide-violet-500/5">
                  {invoices.length === 0 ? (
                    <tr><td colSpan={6} className="py-20 text-center text-slate-400 font-bold">No invoices generated yet</td></tr>
                  ) : invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center text-violet-600"><FileText className="h-5 w-5" /></div>
                          <p className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">{inv.invoice_number || "INV-001"}</p>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <p className="font-black text-slate-900 dark:text-white uppercase text-sm">{inv.companies?.name}</p>
                        <p className="text-xs font-bold text-slate-500">{inv.subscription_plans?.name} Plan</p>
                      </td>
                      <td className="px-10 py-8 font-black text-violet-600 text-lg">${inv.amount}</td>
                      <td className="px-10 py-8">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 flex items-center gap-2 w-fit ${
                          inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {inv.status === 'paid' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-10 py-8 text-xs font-black uppercase tracking-widest text-slate-500">
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex gap-3">
                          {inv.status !== 'paid' && (
                            <button onClick={() => handleUpdateInvoice(inv.id, 'paid')} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-600/20">Mark Paid</button>
                          )}
                          <button className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-violet-600 transition-colors"><ArrowUpRight className="h-5 w-5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </SuperAdminLayout>
  )
}
