import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { 
  X, Sparkles, DollarSign, Clock, Users, 
  CheckCircle2, Plus, Trash2, Shield,
  Layout, MessageCircle, Radio, FolderKanban,
  Building, Globe, BarChart
} from "lucide-react";

const MODULE_OPTIONS = [
  { id: "tasks", name: "Task Management", icon: FolderKanban },
  { id: "feed", name: "Corporate Feed", icon: Radio },
  { id: "messages", name: "Instant Messaging", icon: MessageCircle },
  { id: "departments", name: "Dept & Team Management", icon: Building },
  { id: "collaboration", name: "Collaboration Hub", icon: Globe },
  { id: "partnerships", name: "External Partnerships", icon: Shield },
  { id: "advanced_analytics", name: "Advanced Analytics", icon: BarChart },
];

export default function PlanManagementModal({ plan, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    billing_cycle: "monthly",
    trial_days: 14,
    max_employees: 100,
    description: "",
    features: [],
    allowed_modules: [],
    is_active: true,
    color: "#7c3aed"
  });
  
  const [newFeature, setNewFeature] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (plan) {
      setFormData({
        ...plan,
        features: plan.features || [],
        allowed_modules: plan.allowed_modules || []
      });
    }
  }, [plan]);

  const toggleModule = (moduleId) => {
    setFormData(prev => ({
      ...prev,
      allowed_modules: prev.allowed_modules.includes(moduleId)
        ? prev.allowed_modules.filter(id => id !== moduleId)
        : [...prev.allowed_modules, moduleId]
    }));
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature("");
    }
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (plan?.id) {
        // Update
        const { error } = await supabase
          .from("subscription_plans")
          .update(formData)
          .eq("id", plan.id);
        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from("subscription_plans")
          .insert([formData]);
        if (error) throw error;
      }
      onSuccess();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[3rem] shadow-2xl border-2 border-slate-100 dark:border-white/10 flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-10 py-8 border-b-2 border-slate-50 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-heading-1 font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {plan ? "Configure Plan" : "Create New Plan"}
              </h2>
              <p className="text-label font-bold text-slate-500 uppercase tracking-widest mt-1">Define capabilities & pricing tiers</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition text-slate-400">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
          <form id="plan-form" onSubmit={handleSubmit} className="space-y-10">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Plan Name</label>
                <input 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-2xl focus:border-violet-600 outline-none transition font-black uppercase text-body text-center"
                  placeholder="e.g. PROFESSIONAL"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Monthly Price ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-violet-600" />
                  <input 
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-2xl focus:border-violet-600 outline-none transition font-black text-heading-3 text-violet-600 text-center"
                  />
                </div>
              </div>
            </div>

            {/* Thresholds & Color */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Trial Period (Days)</label>
                <div className="relative">
                  <Clock className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="number"
                    value={formData.trial_days}
                    onChange={e => setFormData({...formData, trial_days: parseInt(e.target.value)})}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-2xl focus:border-violet-600 outline-none transition font-black text-center"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Max Employees</label>
                <div className="relative">
                  <Users className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="number"
                    value={formData.max_employees}
                    onChange={e => setFormData({...formData, max_employees: parseInt(e.target.value)})}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-2xl focus:border-violet-600 outline-none transition font-black text-center"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Theme Color</label>
                <div className="flex gap-2">
                  <input 
                    type="color"
                    value={formData.color}
                    onChange={e => setFormData({...formData, color: e.target.value})}
                    className="h-14 w-20 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 rounded-2xl cursor-pointer p-1"
                  />
                  <input 
                    type="text"
                    value={formData.color}
                    onChange={e => setFormData({...formData, color: e.target.value})}
                    className="flex-1 px-4 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-2xl focus:border-violet-600 outline-none transition font-black uppercase text-label text-center"
                  />
                </div>
              </div>
            </div>

            {/* Module Add-ons */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Layout className="h-5 w-5 text-violet-600" />
                <h3 className="text-body font-black uppercase tracking-widest text-slate-800 dark:text-white">Module Access (Add-ons)</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {MODULE_OPTIONS.map(mod => (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => toggleModule(mod.id)}
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                      formData.allowed_modules.includes(mod.id)
                        ? "bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-600/20"
                        : "bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-500"
                    }`}
                  >
                    <mod.icon className="h-5 w-5 shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-tight leading-tight">{mod.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-6">
              <h3 className="text-body font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Feature Highlights
              </h3>
              <div className="flex gap-4">
                <input 
                  value={newFeature}
                  onChange={e => setNewFeature(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  className="flex-1 px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:border-emerald-500 transition font-bold text-center"
                  placeholder="e.g. 24/7 Priority Support"
                />
                <button 
                  type="button"
                  onClick={addFeature}
                  className="px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Plus className="h-6 w-6" />
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {formData.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 group">
                    <span className="text-[10px] font-black text-slate-600 dark:text-white uppercase">{feature}</span>
                    <button 
                      type="button"
                      onClick={() => removeFeature(idx)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Plan Description</label>
              <textarea 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-[2rem] focus:border-violet-600 outline-none transition font-bold"
                placeholder="Brief summary of this plan..."
              />
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
            form="plan-form"
            type="submit"
            disabled={loading}
            className="px-10 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-violet-600/30 disabled:opacity-50"
          >
            {loading ? "Processing..." : (plan ? "Save Changes" : "Deploy Plan")}
          </button>
        </div>
      </div>
    </div>
  );
}

