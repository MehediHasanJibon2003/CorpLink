import { Link } from "react-router-dom"
import { ShieldX, ArrowLeft } from "lucide-react"

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="h-10 w-10 text-red-400" />
        </div>
        <h1 className="text-3xl font-black text-white mb-3">Access Denied</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          You don't have permission to access this area. This section is
          restricted to Super Administrators only.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
