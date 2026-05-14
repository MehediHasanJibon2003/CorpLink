import { AlertTriangle } from "lucide-react"

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md shadow-2xl border border-slate-100 dark:border-white/5 p-8 transform scale-100 animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl -mr-16 -mt-16" />
        
        <div className="flex flex-col items-center text-center relative z-10">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-inner border border-red-100 dark:border-red-500/20">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
          <h3 className="text-heading-1 font-black text-slate-900 dark:text-white uppercase tracking-tight mb-3">
            {title || "Confirm Action"}
          </h3>
          <p className="text-body font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-relaxed">
            {message || "Are you sure you want to proceed? This action cannot be undone."}
          </p>
        </div>

        <div className="flex gap-4 mt-10 relative z-10">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all hover:-translate-y-0.5"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

