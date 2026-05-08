import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { X, Shield, Key, Eye, EyeOff, Save, CheckCircle2 } from "lucide-react";

export default function GatewayConfigModal({ gateway, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [config, setConfig] = useState(gateway.config || {});

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("payment_gateways")
        .update({ config, is_active: true })
        .eq("id", gateway.id);

      if (error) throw error;
      onSuccess();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg overflow-hidden rounded-[3rem] shadow-2xl border-2 border-slate-100 dark:border-white/10 flex flex-col animate-in zoom-in-95 duration-200">
        
        <div className="px-10 py-8 border-b-2 border-slate-50 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
              <Key className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{gateway.display_name}</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configure Credentials</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition text-slate-400">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-10 space-y-6">
          <div className="space-y-4">
            {gateway.name === 'stripe' ? (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Publishable Key</label>
                  <input 
                    type="text"
                    value={config.public_key || ""}
                    onChange={e => setConfig({...config, public_key: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:border-violet-600 font-bold"
                    placeholder="pk_test_..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Secret Key</label>
                  <div className="relative">
                    <input 
                      type={showKeys ? "text" : "password"}
                      value={config.secret_key || ""}
                      onChange={e => setConfig({...config, secret_key: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:border-violet-600 font-bold"
                      placeholder="sk_test_..."
                    />
                    <button type="button" onClick={() => setShowKeys(!showKeys)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400">
                      {showKeys ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </>
            ) : gateway.name === 'bank_transfer' ? (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Bank Account Details</label>
                <textarea 
                  value={config.bank_details || ""}
                  onChange={e => setConfig({...config, bank_details: e.target.value})}
                  rows={4}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-3xl outline-none focus:border-violet-600 font-bold text-sm"
                  placeholder="Bank Name: ...&#10;A/C No: ...&#10;Branch: ..."
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Store ID / App Key</label>
                  <input 
                    type="text"
                    value={config.app_key || ""}
                    onChange={e => setConfig({...config, app_key: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:border-violet-600 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-2">App Secret</label>
                  <input 
                    type="password"
                    value={config.app_secret || ""}
                    onChange={e => setConfig({...config, app_secret: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:border-violet-600 font-bold"
                  />
                </div>
              </>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 bg-violet-600 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-violet-600/30 hover:scale-[1.02] transition-all"
          >
            {loading ? "Saving..." : <><Save className="h-5 w-5" /> Save Configuration</>}
          </button>
        </form>
      </div>
    </div>
  );
}
