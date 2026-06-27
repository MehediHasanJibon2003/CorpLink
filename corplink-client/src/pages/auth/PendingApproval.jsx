import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { ShieldAlert, Hourglass, ArrowRight, LogOut } from "lucide-react";

export default function PendingApproval() {
  const { profile, logout } = useAuth();

  const isRejected = profile?.corporates?.status === "rejected";

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 dark:bg-[#05030f] relative overflow-hidden">
      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-10 blur-[100px]"
          style={{ background: isRejected ? "radial-gradient(circle, #ef4444, transparent 70%)" : "radial-gradient(circle, #f59e0b, transparent 70%)" }} />
      </div>

      {/* Header */}
      <div className="w-full p-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center font-black text-white text-heading-3 shadow-lg">
            C
          </div>
          <span className="text-heading-2 font-black text-slate-900 dark:text-white tracking-tight">CorpLink</span>
        </div>
        
        <button 
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-body font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="max-w-md w-full bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl text-center">
          
          <div className="flex justify-center mb-6">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg ${isRejected ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
              {isRejected ? (
                <ShieldAlert className="h-10 w-10 text-red-500" />
              ) : (
                <Hourglass className="h-10 w-10 text-amber-500 animate-pulse" />
              )}
            </div>
          </div>

          <h1 className="text-heading-1 font-black text-slate-900 dark:text-white mb-3">
            {isRejected ? "Access Denied" : "Pending Approval"}
          </h1>
          
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
            {isRejected 
              ? "Your corporate registration has been rejected by the platform administrators. If you believe this is a mistake, please contact support."
              : "Your workspace is currently under review. A Super Admin must approve your corporate account before you and your team can access the platform."}
          </p>

          <div className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5 rounded-2xl p-4 mb-8 text-left">
            <p className="text-label font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Workspace Details</p>
            <p className="text-body font-semibold text-slate-900 dark:text-white">{profile?.corporates?.name || "Unknown Corporate"}</p>
            <p className="text-label text-slate-500 mt-1">Status: <span className={isRejected ? "text-red-500 font-bold" : "text-amber-500 font-bold"}>{profile?.corporates?.status?.toUpperCase()}</span></p>
          </div>

          {!isRejected && (
            <button onClick={() => window.location.reload()} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-body font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all shadow-lg hover:shadow-blue-600/30">
              Refresh Status
              <ArrowRight className="h-4 w-4" />
            </button>
          )}

          <p className="text-label text-slate-400 mt-6">
            Need help? <a href="mailto:support@corplink.com" className="text-blue-500 hover:underline">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  )
}

