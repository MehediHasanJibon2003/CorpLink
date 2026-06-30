import { useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { 
  X, Download, Mail, Printer, FileText, 
  CheckCircle2, AlertCircle, Building2, Globe, Loader2
} from "lucide-react";

export default function InvoiceDetailsModal({ invoice, onClose }) {
  const printRef = useRef();
  const [emailing, setEmailing] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // To restore React state
  };

  const handleEmailInvoice = async () => {
    setEmailing(true);
    try {
      await supabase.from('notifications').insert([{
        company_id: invoice.company_id,
        title: 'Invoice Ready',
        message: `Invoice #${invoice.invoice_number} is ready.`,
        type: 'billing',
        is_read: false
      }]);
      setEmailSuccess(true);
      setTimeout(() => setEmailSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to email invoice:", err);
    } finally {
      setEmailing(false);
    }
  };

  if (!invoice) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[3rem] shadow-2xl border-2 border-slate-100 dark:border-white/10 flex flex-col animate-in slide-in-from-bottom-8 duration-300">
        
        {/* Header / Actions */}
        <div className="px-10 py-6 border-b-2 border-slate-50 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5 no-print">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="text-heading-3 font-black text-slate-900 dark:text-white uppercase tracking-tight">Invoice Details</h2>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition shadow-lg shadow-slate-900/20"
            >
              <Download className="h-4 w-4" /> Download PDF
            </button>
            <button 
              className={`p-3 rounded-xl border-2 transition flex items-center justify-center min-w-[48px] ${emailSuccess ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-500/20 text-emerald-500' : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-400 hover:text-violet-600'}`}
              title="Email to Corporate"
              onClick={handleEmailInvoice}
              disabled={emailing}
            >
              {emailing ? <Loader2 className="h-5 w-5 animate-spin" /> : emailSuccess ? <CheckCircle2 className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
            </button>
            <button onClick={onClose} className="p-3 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition text-slate-400">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Invoice Body (Printable Area) */}
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-white" ref={printRef}>
          <style>{`
            @media print {
              .no-print { display: none !important; }
              body { background: white !important; }
              .invoice-card { box-shadow: none !important; border: 1px solid #eee !important; }
            }
          `}</style>
          
          <div className="max-w-3xl mx-auto space-y-12 text-slate-900">
            {/* Branding & Invoice No */}
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-900 flex items-center justify-center text-white rounded-2xl font-black text-heading-1">C</div>
                    <h1 className="text-heading-1 font-black tracking-tighter uppercase">CorpLink <span className="text-violet-600">Pro</span></h1>
                 </div>
                 <div className="text-label font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                   Corporate Management Platform <br />
                   San Francisco, CA 94103 <br />
                   support@corplink.com
                 </div>
              </div>
              <div className="text-right space-y-2">
                 <h2 className="text-5xl font-black text-slate-200 uppercase tracking-tighter">Invoice</h2>
                 <p className="text-body font-black text-slate-900 uppercase tracking-widest">#{invoice.invoice_number}</p>
                 <span className={`inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase border-2 ${invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                    {invoice.status}
                 </span>
              </div>
            </div>

            <hr className="border-t-2 border-slate-100" />

            {/* Bill To / Dates */}
            <div className="grid grid-cols-2 gap-12">
               <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bill To:</p>
                  <div className="space-y-1">
                    <h3 className="text-heading-2 font-black uppercase text-slate-900">{invoice.companies?.name}</h3>
                    <p className="text-body font-bold text-slate-500">{invoice.companies?.industry || "Enterprise Corporate"}</p>
                    <p className="text-label font-medium text-slate-400">Client ID: {invoice.company_id.substring(0, 12)}</p>
                  </div>
               </div>
               <div className="flex justify-end gap-12">
                  <div className="space-y-4 text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date Issued:</p>
                    <p className="font-black text-slate-900">{new Date(invoice.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="space-y-4 text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Due Date:</p>
                    <p className="font-black text-slate-900">{new Date(invoice.billing_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
               </div>
            </div>

            {/* Table */}
            <div className="border-2 border-slate-100 rounded-[2rem] overflow-hidden">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-slate-50 border-b-2 border-slate-100">
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Subscription Plan / Service</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Amount</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-100">
                     <tr>
                        <td className="px-8 py-10">
                           <p className="text-heading-3 font-black text-slate-900 uppercase">{invoice.subscription_plans?.name || 'Corporate'} Plan</p>
                           <p className="text-label font-bold text-slate-500 mt-1">Full access to enterprise modules and collaboration hub.</p>
                        </td>
                        <td className="px-8 py-10 text-right">
                           <p className="text-heading-2 font-black text-slate-900">${invoice.amount}</p>
                        </td>
                     </tr>
                  </tbody>
                  <tfoot>
                     <tr className="bg-slate-900 text-white">
                        <td className="px-8 py-6 text-body font-black uppercase tracking-widest">Total Amount Due</td>
                        <td className="px-8 py-6 text-right">
                           <p className="text-heading-1 font-black">${invoice.amount}</p>
                        </td>
                     </tr>
                  </tfoot>
               </table>
            </div>

            {/* Notes */}
            <div className="space-y-4">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Terms & Instructions:</p>
               <p className="text-label font-bold text-slate-500 leading-relaxed max-w-lg">
                  Please make payment by the due date. For bank transfers, include the invoice number in the reference field. 
                  Thank you for using CorpLink for your organizational workflow management.
               </p>
            </div>

            {/* Footer Branding */}
            <div className="pt-12 flex items-center justify-between border-t-2 border-slate-50">
               <div className="flex items-center gap-2">
                 <Globe className="h-4 w-4 text-violet-600" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">www.corplink.pro</span>
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Generated on {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

