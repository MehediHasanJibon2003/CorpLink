import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import SuperAdminLayout from "../../components/superadmin/layout/SuperAdminLayout"
import { 
  Users, Search, Filter, MoreHorizontal, UserX, UserCheck, 
  Mail, Building2, Shield, Trash2, Key, ChevronRight 
} from "lucide-react"
import { useConfirm } from "../../context/ConfirmContext"

export default function UserManagement() {
  const { showConfirm } = useConfirm()
  const [users, setUsers] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [companyFilter, setCompanyFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [actionLoading, setActionLoading] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    const { data: profiles, error } = await supabase.from("profiles").select("*, companies(name)").order("created_at", { ascending: false })
    const { data: comps } = await supabase.from("companies").select("id, name")
    if (!error) setUsers(profiles)
    if (comps) setCompanies(comps)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleToggleBlock = async (userId, currentStatus) => {
    setActionLoading(userId)
    await supabase.from("profiles").update({ is_blocked: !currentStatus }).eq("id", userId)
    await fetchData()
    setActionLoading(null)
  }

  const handleDeleteUser = (userId, name) => {
    showConfirm({
      title: "Delete User",
      message: `Are you sure you want to delete ${name}? This action cannot be undone.`,
      onConfirm: async () => {
        setActionLoading(userId)
        await supabase.from("profiles").delete().eq("id", userId)
        await fetchData()
        setActionLoading(null)
      }
    })
  }

  const handleResetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
    if (!error) alert(`Sent to ${email}`)
  }

  const handleChangeRole = async (userId, newRole) => {
    setActionLoading(userId)
    await supabase.from("profiles").update({ role: newRole }).eq("id", userId)
    await fetchData()
    setActionLoading(null)
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.full_name || "").toLowerCase().includes(search.toLowerCase()) || (u.email || "").toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === "all" || u.role === roleFilter
    const matchesCompany = companyFilter === "all" || u.company_id === companyFilter
    const matchesStatus = statusFilter === "all" || (statusFilter === "blocked" ? u.is_blocked : !u.is_blocked)
    return matchesSearch && matchesRole && matchesCompany && matchesStatus
  })

  return (
    <SuperAdminLayout title="User Management" subtitle="Manage identity and access platform-wide">
      
      {/* Responsive Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-10">
        <div className="sm:col-span-2 lg:col-span-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10 outline-none focus:border-violet-500 font-bold text-slate-900 dark:text-white text-body"
          />
        </div>
        
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-4 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-violet-500/10 outline-none focus:border-violet-500 font-black uppercase text-[10px] tracking-widest text-slate-700 dark:text-violet-200">
          <option value="all">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="corporate_admin">Corporate Admin</option>
          <option value="employee">Employee</option>
        </select>

        <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="px-4 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-violet-500/10 outline-none focus:border-violet-500 font-black uppercase text-[10px] tracking-widest text-slate-700 dark:text-violet-200">
          <option value="all">All Companies</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-violet-500/10 outline-none focus:border-violet-500 font-black uppercase text-[10px] tracking-widest text-slate-700 dark:text-violet-200">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {/* Responsive Table Container */}
      <div className="rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px] lg:min-w-full">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-violet-500/5 border-b-2 border-slate-100 dark:border-violet-500/10">
                <th className="px-8 py-6 md:py-8 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Identity</th>
                <th className="px-8 py-6 md:py-8 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Context</th>
                <th className="px-8 py-6 md:py-8 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Status</th>
                <th className="px-8 py-6 md:py-8 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-violet-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100 dark:divide-violet-500/5">
              {loading ? (
                <tr><td colSpan={4} className="py-20 text-center font-black text-slate-400 uppercase tracking-widest animate-pulse">Fetching users...</td></tr>
              ) : filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-6 md:py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-body md:text-heading-2 shrink-0">
                        {user.full_name?.charAt(0) || "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-body md:text-heading-3 font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{user.full_name}</p>
                        <p className="text-[10px] md:text-label font-bold text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 md:py-8">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-label font-bold text-slate-700 dark:text-white truncate">
                        <Building2 className="h-3.5 w-3.5 text-violet-500 shrink-0" /> {user.companies?.name || "Platform Admin"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5 text-pink-500 shrink-0" />
                        <select 
                          value={user.role} 
                          disabled={actionLoading === user.id}
                          onChange={(e) => handleChangeRole(user.id, e.target.value)}
                          className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none cursor-pointer"
                        >
                          <option value="employee">Employee</option>
                          <option value="corporate_admin">Corporate Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 md:py-8">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border-2 ${
                      user.is_blocked ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {user.is_blocked ? "Suspended" : "Active"}
                    </span>
                  </td>
                  <td className="px-8 py-6 md:py-8">
                    <div className="flex items-center justify-end gap-2 md:gap-3">
                      <button 
                        onClick={() => handleToggleBlock(user.id, user.is_blocked)}
                        disabled={actionLoading === user.id}
                        className={`p-2 md:p-3 rounded-xl border-2 transition-all ${user.is_blocked ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}
                      >
                        {user.is_blocked ? <UserCheck className="h-4 w-4 md:h-5 md:w-5" /> : <UserX className="h-4 w-4 md:h-5 md:w-5" />}
                      </button>
                      <button 
                        onClick={() => handleResetPassword(user.email)}
                        className="p-2 md:p-3 rounded-xl bg-blue-50 border-2 border-blue-100 text-blue-600 transition-all"
                      >
                        <Key className="h-4 w-4 md:h-5 md:w-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id, user.full_name)}
                        className="p-2 md:p-3 rounded-xl bg-red-50 border-2 border-red-100 text-red-600 transition-all"
                      >
                        <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SuperAdminLayout>
  )
}

