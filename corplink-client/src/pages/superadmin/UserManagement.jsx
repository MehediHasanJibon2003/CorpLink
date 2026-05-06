import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import SuperAdminLayout from "../../components/superadmin/layout/SuperAdminLayout"
import { 
  Users, Search, Filter, MoreHorizontal, UserX, UserCheck, 
  Mail, Building2, Shield, Trash2, Key, ChevronRight 
} from "lucide-react"

export default function UserManagement() {
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
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*, companies(name)")
      .order("created_at", { ascending: false })

    const { data: comps } = await supabase.from("companies").select("id, name")
    
    if (!error) setUsers(profiles)
    if (comps) setCompanies(comps)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleToggleBlock = async (userId, currentStatus) => {
    setActionLoading(userId)
    const { error } = await supabase
      .from("profiles")
      .update({ is_blocked: !currentStatus })
      .eq("id", userId)
    
    if (!error) await fetchData()
    setActionLoading(null)
  }

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${name}? This cannot be undone.`)) return
    setActionLoading(userId)
    const { error } = await supabase.from("profiles").delete().eq("id", userId)
    if (!error) await fetchData()
    setActionLoading(null)
  }

  const handleResetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (!error) alert(`Password reset email sent to ${email}`)
    else alert(error.message)
  }

  const handleChangeRole = async (userId, newRole) => {
    setActionLoading(userId)
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId)
    
    if (!error) await fetchData()
    setActionLoading(null)
  }

  const filteredUsers = users.filter(u => {
    const fullName = u.full_name || ""
    const email = u.email || ""
    const matchesSearch = fullName.toLowerCase().includes(search.toLowerCase()) || 
                         email.toLowerCase().includes(search.toLowerCase())
    
    const matchesRole = roleFilter === "all" || u.role === roleFilter
    const matchesCompany = companyFilter === "all" || u.company_id === companyFilter
    const matchesStatus = statusFilter === "all" || (statusFilter === "blocked" ? u.is_blocked : !u.is_blocked)
    
    return matchesSearch && matchesRole && matchesCompany && matchesStatus
  })

  return (
    <SuperAdminLayout title="User Management" subtitle="Manage all platform users, control roles, and enforce security policies">
      
      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="md:col-span-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/10 outline-none focus:border-violet-500 transition-all font-bold text-slate-900 dark:text-white"
          />
        </div>
        
        <select 
          value={roleFilter} 
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-6 py-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-violet-500/10 outline-none focus:border-violet-500 font-bold text-slate-700 dark:text-violet-200"
        >
          <option value="all">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="corporate_admin">Corporate Admin</option>
          <option value="admin">Admin</option>
          <option value="employee">Employee</option>
        </select>

        <select 
          value={companyFilter} 
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="px-6 py-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-violet-500/10 outline-none focus:border-violet-500 font-bold text-slate-700 dark:text-violet-200"
        >
          <option value="all">All Companies</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-6 py-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-violet-500/10 outline-none focus:border-violet-500 font-bold text-slate-700 dark:text-violet-200"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="blocked">Blocked Only</option>
        </select>
      </div>

      {/* User Table */}
      <div className="rounded-[2.5rem] overflow-hidden bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-violet-500/15 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-violet-500/5 border-b-2 border-slate-100 dark:border-violet-500/10">
                <th className="px-10 py-8 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">User Identity</th>
                <th className="px-10 py-8 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Company & Role</th>
                <th className="px-10 py-8 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Status</th>
                <th className="px-10 py-8 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-violet-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100 dark:divide-violet-500/5">
              {loading ? (
                <tr><td colSpan={4} className="py-20 text-center font-black text-slate-400 uppercase tracking-widest animate-pulse">Loading Users...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={4} className="py-20 text-center text-slate-400 font-bold">No users found matching your criteria</td></tr>
              ) : filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
                        {user.full_name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{user.full_name}</p>
                        <p className="text-sm font-bold text-slate-500 dark:text-violet-400/70">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-white font-bold">
                        <Building2 className="h-4 w-4 text-violet-500" /> {user.companies?.name || "Platform Admin"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-pink-500" />
                        <select 
                          value={user.role} 
                          disabled={actionLoading === user.id}
                          onChange={(e) => handleChangeRole(user.id, e.target.value)}
                          className="bg-transparent border-none p-0 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-violet-400 outline-none cursor-pointer"
                        >
                          <option value="employee">Employee</option>
                          <option value="manager">Manager</option>
                          <option value="hr">HR</option>
                          <option value="admin">Admin</option>
                          <option value="corporate_admin">Corporate Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    {user.is_blocked ? (
                      <span className="px-4 py-1.5 rounded-full bg-red-50 text-red-600 border-2 border-red-100 text-[10px] font-black uppercase tracking-widest">Suspended</span>
                    ) : (
                      <span className="px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-100 text-[10px] font-black uppercase tracking-widest">Active</span>
                    )}
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleToggleBlock(user.id, user.is_blocked)}
                        disabled={actionLoading === user.id}
                        title={user.is_blocked ? "Reactivate" : "Suspend"}
                        className={`p-3 rounded-xl border-2 transition-all hover:scale-110 active:scale-95 ${user.is_blocked ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}
                      >
                        {user.is_blocked ? <UserCheck className="h-5 w-5" /> : <UserX className="h-5 w-5" />}
                      </button>
                      
                      <button 
                        onClick={() => handleResetPassword(user.email)}
                        disabled={actionLoading === user.id}
                        title="Reset Password"
                        className="p-3 rounded-xl bg-blue-50 border-2 border-blue-100 text-blue-600 hover:scale-110 active:scale-95 transition-all"
                      >
                        <Key className="h-5 w-5" />
                      </button>

                      <button 
                        onClick={() => handleDeleteUser(user.id, user.full_name)}
                        disabled={actionLoading === user.id}
                        title="Delete User"
                        className="p-3 rounded-xl bg-red-50 border-2 border-red-100 text-red-600 hover:scale-110 active:scale-95 transition-all"
                      >
                        <Trash2 className="h-5 w-5" />
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
