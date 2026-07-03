import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { X, Shield, Calendar, CheckCircle2, Ban } from "lucide-react";

export default function SubscriptionControlModal({ subscription, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);

  // The 'subscription' prop here is actually the mapped 'companyRow' object.
  // The actual subscription record is inside subscription.sub.
  // If subscription.sub is missing or has no id, this is a new assignment (INSERT).
  const isNew = !subscription?.sub?.id;

  const [generateInvoice, setGenerateInvoice] = useState(isNew);

  const [formData, setFormData] = useState({
    plan:        subscription?.plan || "",
    status:      subscription?.status || "active",
    expiry_date: subscription?.expiry_date
      ? new Date(subscription.expiry_date).toISOString().split("T")[0]
      : "",
  });

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    const { data } = await supabase.from("subscription_plans").select("*").eq("is_active", true);
    // Find the correct plan UUID if we only have the plan name
    if (subscription?.plan) {
      const matchedPlan = data?.find(p => p.name.toLowerCase() === subscription.plan.toLowerCase());
      if (matchedPlan) setFormData(prev => ({ ...prev, plan: matchedPlan.id }));
    }
    setPlans(data || []);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let error;

      // Find the selected plan's name to use as the plan value
      const selectedPlan = plans.find(p => p.id === formData.plan);
      const planValue = selectedPlan ? selectedPlan.name.toLowerCase() : null;

      let subId = null;

      if (isNew) {
        // No subscription yet → INSERT
        const res = await supabase.from("subscriptions").insert([{
          company_id: subscription.company_id,
          plan:         planValue,
          status:       formData.status,
          start_date:   new Date().toISOString(),
          expiry_date:  formData.expiry_date ? new Date(formData.expiry_date).toISOString() : null,
        }]).select().single();
        
        error = res.error;
        subId = res.data?.id || `sub-${Math.floor(Math.random() * 9000)}`;
      } else {
        // Existing subscription → UPDATE
        const payload = {
          plan:        planValue, // Now updating plan as well
          status:      formData.status,
          expiry_date: formData.expiry_date ? new Date(formData.expiry_date).toISOString() : null,
        };
        const res = await supabase
          .from("subscriptions")
          .update(payload)
          .eq("id", subscription.sub.id);
          
        error = res.error;
        subId = subscription.sub.id;
      }

      if (!error && selectedPlan && generateInvoice) {
        const invRes = await supabase.from("invoices").insert([{
          company_id: subscription.company_id,
          subscription_id: subId,
          plan_id: selectedPlan.id,
          amount: selectedPlan.price,
          status: "pending",
          invoice_number: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }]);
        
        if (invRes.error) {
          alert("Invoice generation failed: " + invRes.error.message);
          console.error("Invoice Error:", invRes.error);
        }
      }

      if (error) throw error;
      onSuccess();
    } catch (err) {
      alert("Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const companyLabel =
    subscription?.companyName ||
    subscription?.companies?.name ||
    subscription?.company_id?.substring(0, 8) ||
    "—";

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl overflow-hidden rounded-[3rem] shadow-2xl border-2 border-slate-100 dark:border-white/10 flex flex-col animate-in slide-in-from-bottom-8 duration-300">

        {/* Header */}
        <div className="px-10 py-8 border-b-2 border-slate-50 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-heading-2 font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {isNew ? "Assign Subscription" : "Control Subscription"}
              </h2>
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-1">
                Company: {companyLabel}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition text-slate-400">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-10 space-y-8">
          <form id="control-form" onSubmit={handleUpdate} className="space-y-8">

            {/* Status Toggle */}
            <div className={`p-6 rounded-3xl border-2 transition-all flex items-center justify-between ${
              formData.status === "active"
                ? "bg-emerald-50/50 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/20"
                : "bg-red-50/50 border-red-100 dark:bg-red-500/5 dark:border-red-500/20"
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  formData.status === "active" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                }`}>
                  {formData.status === "active" ? <CheckCircle2 className="h-5 w-5" /> : <Ban className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-label font-black uppercase tracking-widest text-slate-500">Service Status</p>
                  <p className={`text-heading-3 font-black uppercase ${
                    formData.status === "active" ? "text-emerald-600" : "text-red-600"
                  }`}>
                    {formData.status}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  status: prev.status === "active" ? "deactivated" : "active"
                }))}
                className={`px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${
                  formData.status === "active"
                    ? "bg-red-100 text-red-600 hover:bg-red-600 hover:text-white"
                    : "bg-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                }`}
              >
                {formData.status === "active" ? "Deactivate" : "Reactivate"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* Plan Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Plan</label>
                <select
                  value={formData.plan}
                  onChange={e => setFormData({ ...formData, plan: e.target.value })}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-2xl focus:border-amber-500 outline-none transition font-black uppercase text-label"
                >
                  <option value="">— No Plan —</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                  ))}
                </select>
              </div>

              {/* Expiry Date */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Expiry Date</label>
                <div className="relative">
                  <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-2xl focus:border-amber-500 outline-none transition font-black text-label"
                  />
                </div>
              </div>
            </div>

            {/* Generate Invoice Toggle */}
            <div className="pt-4 border-t-2 border-slate-100 dark:border-white/5">
              <label className="flex items-center gap-4 cursor-pointer p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition">
                <div 
                  className={`w-12 h-6 rounded-full relative transition-all ${generateInvoice ? 'bg-amber-500' : 'bg-slate-200 dark:bg-white/10'}`}
                  onClick={() => setGenerateInvoice(!generateInvoice)}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${generateInvoice ? 'right-1' : 'left-1'}`} />
                </div>
                <div>
                  <p className="text-label font-black text-slate-900 dark:text-white uppercase tracking-widest">Generate New Invoice</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Creates a new pending invoice for the selected plan</p>
                </div>
              </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-10 py-8 border-t-2 border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-8 py-4 text-label font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition"
          >
            Cancel
          </button>
          <button
            form="control-form"
            type="submit"
            disabled={loading}
            className="px-10 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-amber-500/30 disabled:opacity-50"
          >
            {loading ? "Saving..." : isNew ? "Assign Plan" : "Push Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
