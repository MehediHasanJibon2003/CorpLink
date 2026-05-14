import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { 
  X, Shield, Calendar, AlertTriangle, CheckCircle2, 
  Clock, RefreshCw, Ban, ChevronRight, Hash
} from "lucide-react";

export default function SubscriptionControlModal({ subscription, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [formData, setFormData] = useState({
    plan_id: subscription?.plan_id || "",
    status: subscription?.status || "active",
    expiry_date: subscription?.expiry_date ? new Date(subscription.expiry_date).toISOString().split('T')[0] : "",
    grace_period_days: subscription?.grace_period_days || 7,
    auto_renew: subscription?.auto_renew ?? true
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const { data } = await supabase.from("subscription_plans").select("*").eq("is_active", true);
    setPlans(data || []);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedPlan = plans.find(p => p.id === formData.plan_id);
      
      const updatePayload = {
        plan_id: formData.plan_id || null,
        plan: selectedPlan ? selectedPlan.name : subscription.plan,
        status: formData.status,
        grace_period_days: formData.grace_period_days,
        auto_renew: formData.auto_renew,
        expiry_date: formData.expiry_date ? new Date(formData.expiry_date).toISOString() : null
      };

      const { error } = await supabase
        .from("subscriptions")
        .update(updatePayload)
        .eq("id", subscription.id);

      if (error) throw error;

      // Log History
      await supabase.from("subscription_history").insert([{
        company_id: subscription.company_id,
        old_plan: subscription.plan,
        new_plan: selectedPlan ? selectedPlan.name : subscription.plan,
        action: 'manual_update',
        performed_by: (await supabase.auth.getUser()).data.user.id
      }]);

      onSuccess();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async () => {
    const newStatus = formData.status === 'active' ? 'deactivated' : 'active';
    setFormData(prev => ({ ...prev, status: newStatus }));
  };

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
                Control Subscription
              </h2>
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-1">
                Editing: {subscription?.companies?.name}
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
            
            {/* Status Toggle Card */}
            <div className={`p-6 rounded-3xl border-2 transition-all flex items-center justify-between ${
              formData.status === 'active' 
                ? "bg-emerald-50/50 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/20" 
                : "bg-red-50/50 border-red-100 dark:bg-red-500/5 dark:border-red-500/20"
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  formData.status === 'active' ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                }`}>
                  {formData.status === 'active' ? <CheckCircle2 className="h-5 w-5" /> : <Ban className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-label font-black uppercase tracking-widest text-slate-500">Service Status</p>
                  <p className={`text-heading-3 font-black uppercase ${formData.status === 'active' ? "text-emerald-600" : "text-red-600"}`}>
                    {formData.status}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={toggleStatus}
                className={`px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${
                  formData.status === 'active' 
                    ? "bg-red-100 text-red-600 hover:bg-red-600 hover:text-white" 
                    : "bg-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                }`}
              >
                {formData.status === 'active' ? "Deactivate" : "Reactivate"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* Plan Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Current Plan</label>
                <select 
                  value={formData.plan_id}
                  onChange={e => setFormData({...formData, plan_id: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-2xl focus:border-amber-500 outline-none transition font-black uppercase text-label"
                >
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
                    onChange={e => setFormData({...formData, expiry_date: e.target.value})}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-2xl focus:border-amber-500 outline-none transition font-black text-label"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* Grace Period */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Grace Period (Days)</label>
                <div className="relative">
                  <Clock className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="number"
                    value={formData.grace_period_days}
                    onChange={e => setFormData({...formData, grace_period_days: parseInt(e.target.value)})}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-2xl focus:border-amber-500 outline-none transition font-black text-center"
                  />
                </div>
              </div>

              {/* Auto Renew */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Auto Renew</label>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, auto_renew: !formData.auto_renew})}
                  className={`w-full h-14 rounded-2xl border-2 flex items-center justify-center gap-3 transition-all font-black uppercase text-[10px] tracking-widest ${
                    formData.auto_renew 
                      ? "bg-slate-900 text-white border-slate-900" 
                      : "bg-slate-50 text-slate-400 border-slate-100"
                  }`}
                >
                  <RefreshCw className={`h-4 w-4 ${formData.auto_renew ? 'animate-spin-slow' : ''}`} />
                  {formData.auto_renew ? "Enabled" : "Disabled"}
                </button>
              </div>
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
            {loading ? "Updating..." : "Push Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

