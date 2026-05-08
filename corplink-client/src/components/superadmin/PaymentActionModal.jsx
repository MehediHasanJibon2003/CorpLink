import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { 
  X, DollarSign, CheckCircle2, AlertCircle, 
  RotateCcw, FileText, Calendar, Hash, Info
} from "lucide-react";

export default function PaymentActionModal({ invoice, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    status: invoice?.status || "pending",
    payment_method: "manual",
    transaction_id: invoice?.transaction_id || "",
    notes: invoice?.notes || ""
  });

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Update Invoice
      const { error: invError } = await supabase
        .from("invoices")
        .update({
          status: formData.status,
          payment_method: formData.payment_method,
          transaction_id: formData.transaction_id,
          notes: formData.notes
        })
        .eq("id", invoice.id);

      if (invError) throw invError;

      // 2. Insert into Payments History
      if (formData.status === 'paid' || formData.status === 'refunded') {
        await supabase.from("payments").insert([{
          invoice_id: invoice.id,
          company_id: invoice.company_id,
          amount: invoice.amount,
          status: formData.status === 'paid' ? 'successful' : 'refunded',
          payment_gateway: formData.payment_method,
          transaction_reference: formData.transaction_id
        }]);
      }

      // 3. If paid, ensure subscription is active
      if (formData.status === 'paid') {
        await supabase.from("subscriptions")
          .update({ status: 'active' })
          .eq("company_id", invoice.company_id);
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
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl overflow-hidden rounded-[3rem] shadow-2xl border-2 border-slate-100 dark:border-white/10 flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-10 py-8 border-b-2 border-slate-50 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Process Payment
              </h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                INV: {invoice?.invoice_number}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition text-slate-400">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-10 space-y-8">
          {/* Summary Card */}
          <div className="bg-slate-50 dark:bg-white/5 rounded-3xl p-6 border-2 border-slate-100 dark:border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-emerald-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Total Amount</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">${invoice?.amount}</p>
              </div>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-black uppercase text-slate-400">Due Date</p>
               <p className="font-bold text-slate-600 dark:text-slate-300">{new Date(invoice?.billing_date).toLocaleDateString()}</p>
            </div>
          </div>

          <form id="payment-form" onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Payment Status</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-2xl font-black text-xs uppercase outline-none focus:border-emerald-500 transition"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Confirm Payment</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Payment Method</label>
                <select 
                  value={formData.payment_method}
                  onChange={e => setFormData({...formData, payment_method: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-2xl font-black text-xs uppercase outline-none focus:border-emerald-500 transition"
                >
                  <option value="manual">Manual Bank Transfer</option>
                  <option value="stripe">Stripe Gateway</option>
                  <option value="paypal">PayPal</option>
                  <option value="cash">Direct Cash</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Transaction / Reference ID</label>
              <div className="relative">
                <Hash className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  value={formData.transaction_id}
                  onChange={e => setFormData({...formData, transaction_id: e.target.value})}
                  placeholder="e.g. TXN-99008877"
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-2xl font-bold text-sm outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Internal Notes</label>
              <textarea 
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                placeholder="Add any specific details about this payment..."
                rows={3}
                className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-3xl font-bold text-sm outline-none focus:border-emerald-500 transition"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-10 py-8 border-t-2 border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition"
          >
            Cancel
          </button>
          <button 
            form="payment-form"
            type="submit"
            disabled={loading}
            className="px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/30 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {loading ? "Processing..." : "Update Transaction"}
          </button>
        </div>
      </div>
    </div>
  );
}
