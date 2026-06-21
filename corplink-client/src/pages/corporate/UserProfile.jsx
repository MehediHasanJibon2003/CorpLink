import { useEffect, useState, useRef } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import AppLayout from "../../components/layout/AppLayout"
import { Camera, Edit3, Shield, Monitor, Key, Lock, Activity, Loader2, Eye, EyeOff, X, CheckCircle } from "lucide-react"

export default function UserProfile() {
  const { user, profile } = useAuth()
  const [logs, setLogs] = useState([])
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null)
  const fileInputRef = useRef(null)

  // Edit profile modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', date_of_birth: '', current_address: '', permanent_address: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [displayName, setDisplayName] = useState(profile?.full_name || '')
  const [profileData, setProfileData] = useState({
    phone: profile?.phone || '',
    date_of_birth: profile?.date_of_birth || '',
    current_address: profile?.current_address || '',
    permanent_address: profile?.permanent_address || '',
  })

  // Change Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)

  useEffect(() => {
    if (profile?.avatar_url) setAvatarUrl(profile.avatar_url)
    if (profile?.full_name) setDisplayName(profile.full_name)
    setProfileData({
      phone: profile?.phone || '',
      date_of_birth: profile?.date_of_birth || '',
      current_address: profile?.current_address || '',
      permanent_address: profile?.permanent_address || '',
    })
  }, [profile?.avatar_url, profile?.full_name, profile?.phone, profile?.date_of_birth, profile?.current_address, profile?.permanent_address])

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)
    setLogs(data || [])
  }

  useEffect(() => {
    if (user?.id) {
      fetchLogs()
    }
  }, [user])

  const handleEditProfile = () => {
    setEditForm({
      full_name: displayName,
      phone: profileData.phone,
      date_of_birth: profileData.date_of_birth,
      current_address: profileData.current_address,
      permanent_address: profileData.permanent_address,
    })
    setEditError('')
    setShowEditModal(true)
  }

  const handleEditSave = async (e) => {
    e.preventDefault()
    if (!editForm.full_name.trim()) {
      setEditError('Name cannot be empty.')
      return
    }
    setEditSaving(true)
    setEditError('')
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name.trim(),
          phone: editForm.phone.trim() || null,
          date_of_birth: editForm.date_of_birth || null,
          current_address: editForm.current_address.trim() || null,
          permanent_address: editForm.permanent_address.trim() || null,
        })
        .eq('id', user.id)

      if (error) throw error

      setDisplayName(editForm.full_name.trim())
      setProfileData({
        phone: editForm.phone.trim(),
        date_of_birth: editForm.date_of_birth,
        current_address: editForm.current_address.trim(),
        permanent_address: editForm.permanent_address.trim(),
      })
      setShowEditModal(false)

      await supabase.from('activity_logs').insert([{
        user_id: user.id,
        company_id: profile.company_id,
        action: 'Updated Profile Name',
        entity: 'profile'
      }])
      fetchLogs()
    } catch (err) {
      setEditError(err.message || 'Failed to save changes.')
    } finally {
      setEditSaving(false)
    }
  }

  const handleAvatarClick = () => {
    if (!uploading) fileInputRef.current?.click()
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const newAvatarUrl = publicUrlData.publicUrl

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Sync avatar to employees table so it appears in the Directory
      if (profile?.email) {
        await supabase
          .from('employees')
          .update({ avatar_url: newAvatarUrl })
          .eq('email', profile.email)
      }

      setAvatarUrl(newAvatarUrl)
      
      await supabase.from('activity_logs').insert([
        {
          user_id: user.id,
          company_id: profile.company_id,
          action: 'Updated Profile Picture',
          entity: 'profile'
        }
      ])
      
      fetchLogs()
    } catch (error) {
      alert("Error uploading avatar: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  // ── Change Password ──────────────────────────────────────────────
  const handleChangePassword = () => {
    setPasswordForm({ newPassword: '', confirmPassword: '' })
    setPasswordError('')
    setPasswordSuccess('')
    setShowPasswordModal(true)
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    const { newPassword, confirmPassword } = passwordForm

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    setPasswordLoading(true)
    setPasswordError('')
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      setPasswordSuccess('Password updated successfully!')
      await supabase.from('activity_logs').insert([{
        user_id: user.id,
        company_id: profile.company_id,
        action: 'Changed Password',
        entity: 'auth'
      }])
      fetchLogs()
      setTimeout(() => {
        setShowPasswordModal(false)
        setPasswordSuccess('')
      }, 2000)
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.')
    } finally {
      setPasswordLoading(false)
    }
  }
  // ────────────────────────────────────────────────────────────────

  return (
    <AppLayout title="My Profile" subtitle="Manage your personal details and security settings">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 md:gap-10">
        
        {/* Left Column: Personal Info */}
        <div className="xl:col-span-1 flex flex-col gap-8 md:gap-10">
          <div className="border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl md:rounded-[2.5rem] shadow-sm p-6 md:p-10 flex flex-col items-center text-center transition-all hover:shadow-md">
            
            {/* Avatar with Camera Overlay */}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              disabled={uploading}
            />
            <div className={`relative group cursor-pointer mb-6 ${uploading ? 'opacity-75 pointer-events-none' : ''}`} onClick={handleAvatarClick}>
              <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-slate-800 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-4xl md:text-5xl font-black shadow-inner border-4 border-white dark:border-slate-700 transition-transform group-hover:scale-105 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile?.full_name?.charAt(0) || "U"
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera className="text-white h-8 w-8" />
                )}
              </div>
              {!uploading && (
                <div className="absolute bottom-0 right-0 bg-white dark:bg-slate-700 p-2 rounded-full shadow-lg border border-slate-100 dark:border-slate-600">
                  <Edit3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              )}
            </div>

            <h3 className="text-[20px] md:text-heading-2 font-black text-slate-900 dark:text-white tracking-tight">{displayName}</h3>
            <p className="text-[12px] md:text-body text-slate-500 dark:text-slate-400 mt-1 font-bold">{profile?.email}</p>
            
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <span className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-[10px] md:text-badge font-black capitalize tracking-widest shadow-sm">
                {profile?.role ? profile.role.replace(/_/g, ' ') : "Employee"}
              </span>
              <span className="px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] md:text-badge font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-800/50">
                Active
              </span>
            </div>

            <button onClick={handleEditProfile} className="mt-8 w-full py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-xl text-[11px] md:text-[12px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-600">
              Edit Profile
            </button>
            
            <div className="w-full mt-8 md:mt-10 pt-8 border-t-2 border-slate-100 dark:border-slate-700 text-left space-y-6">
              <div>
                <p className="text-[9px] md:text-label text-slate-400 font-black uppercase tracking-widest mb-1">Organization</p>
                <p className="text-[14px] md:text-heading-3 font-black text-slate-800 dark:text-slate-100">{profile?.companies?.name || "CorpLink Enterprise"}</p>
              </div>
              {profile?.company_id && (
                <div>
                  <p className="text-[9px] md:text-label text-slate-400 font-black uppercase tracking-widest mb-1">Invite Code</p>
                  <code className="text-[12px] md:text-[13px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 inline-block">
                    {profile.company_id.slice(0, 8)}
                  </code>
                </div>
              )}
              <div>
                <p className="text-[9px] md:text-label text-slate-400 font-black uppercase tracking-widest mb-1">License Plan</p>
                <span className="inline-block mt-1 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-sm">
                  Pro Enterprise
                </span>
              </div>
              <div>
                <p className="text-[9px] md:text-label text-slate-400 font-black uppercase tracking-widest mb-1">Member Since</p>
                <p className="text-[14px] md:text-body font-bold text-slate-700 dark:text-slate-300">{new Date(profile?.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</p>
              </div>
              {profileData.phone && (
                <div>
                  <p className="text-[9px] md:text-label text-slate-400 font-black uppercase tracking-widest mb-1">Phone</p>
                  <p className="text-[14px] md:text-body font-bold text-slate-700 dark:text-slate-300">{profileData.phone}</p>
                </div>
              )}
              {profileData.date_of_birth && (
                <div>
                  <p className="text-[9px] md:text-label text-slate-400 font-black uppercase tracking-widest mb-1">Date of Birth</p>
                  <p className="text-[14px] md:text-body font-bold text-slate-700 dark:text-slate-300">{new Date(profileData.date_of_birth).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              )}
              {profileData.current_address && (
                <div>
                  <p className="text-[9px] md:text-label text-slate-400 font-black uppercase tracking-widest mb-1">Current Address</p>
                  <p className="text-[13px] md:text-body font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{profileData.current_address}</p>
                </div>
              )}
              {profileData.permanent_address && (
                <div>
                  <p className="text-[9px] md:text-label text-slate-400 font-black uppercase tracking-widest mb-1">Permanent Address</p>
                  <p className="text-[13px] md:text-body font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{profileData.permanent_address}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Security & Activity */}
        <div className="xl:col-span-2 flex flex-col gap-8 md:gap-10">
          
          {/* Security & Sessions */}
          <div className="border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl md:rounded-[2.5rem] shadow-sm p-6 md:p-10">
            <h3 className="text-[18px] md:text-heading-2 font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3 mb-8">
              <Shield className="h-6 w-6 text-blue-500" /> Security & Access
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 md:p-6 border-2 border-slate-100 dark:border-slate-700 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-900/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Key className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-black text-slate-800 dark:text-slate-100">Password</h4>
                    <p className="text-[10px] md:text-[11px] font-bold text-slate-500">Update your account password</p>
                  </div>
                </div>
                <button onClick={handleChangePassword} className="w-full py-2.5 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 transition-all">
                  Change Password
                </button>
              </div>

              <div className="p-5 md:p-6 border-2 border-slate-100 dark:border-slate-700 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-900/30 flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <Monitor className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-black text-slate-800 dark:text-slate-100">Active Session</h4>
                    <p className="text-[10px] md:text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Current Device
                    </p>
                  </div>
                </div>
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Windows 11 • Chrome Browser<br/>IP: 192.168.1.1</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl md:rounded-[2.5rem] shadow-sm p-6 md:p-10">
            <div className="flex items-center justify-between mb-8 md:mb-10">
              <h3 className="text-[18px] md:text-heading-2 font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                <Activity className="h-6 w-6 text-blue-500" /> Recent Activity
              </h3>
            </div>

            {logs.length === 0 ? (
              <div className="p-8 md:p-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-[13px] md:text-body text-slate-500 dark:text-slate-400 font-bold italic">No recent activity logs found in the security vault.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6 p-4 md:p-6 border-2 border-slate-100 dark:border-slate-700 rounded-xl md:rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg md:rounded-xl flex items-center justify-center text-xl md:text-heading-1 shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                        {log.entity === 'auth' ? <Lock className="h-5 w-5 md:h-6 md:w-6" /> : '📂'}
                      </div>
                      <div className="sm:hidden flex-1">
                         <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">
                           {log.entity || 'System'}
                         </p>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[14px] md:text-heading-3 font-black text-slate-800 dark:text-slate-100 mb-1 leading-tight truncate">{log.action}</h4>
                      <div className="hidden sm:flex items-center gap-3 mt-1">
                        <p className="text-[9px] md:text-label text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">
                          {log.entity || 'System'}
                        </p>
                        <span className="text-slate-300 dark:text-slate-600">|</span>
                        <p className="text-[10px] md:text-[12px] text-slate-400 dark:text-slate-500 font-bold italic">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                      <p className="sm:hidden text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit Profile Modal ── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 w-full max-w-md p-8 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h3 className="text-[18px] md:text-heading-2 font-black text-slate-900 dark:text-white tracking-tight mb-6 flex items-center gap-3">
              <Edit3 className="h-5 w-5 text-blue-500" /> Edit Profile
            </h3>
            <form onSubmit={handleEditSave} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Full Name</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-5 py-3 text-[14px] font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all"
                  placeholder="Your full name"
                  disabled={editSaving}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-5 py-3 text-[14px] font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all"
                  placeholder="+880 1XXX-XXXXXX"
                  disabled={editSaving}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={editForm.date_of_birth}
                  onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-5 py-3 text-[14px] font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all"
                  disabled={editSaving}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Current Address</label>
                <textarea
                  value={editForm.current_address}
                  onChange={(e) => setEditForm({ ...editForm, current_address: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-5 py-3 text-[14px] font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all resize-none"
                  placeholder="Flat, Road, Area, City"
                  rows={2}
                  disabled={editSaving}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Permanent Address</label>
                <textarea
                  value={editForm.permanent_address}
                  onChange={(e) => setEditForm({ ...editForm, permanent_address: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-5 py-3 text-[14px] font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all resize-none"
                  placeholder="Village/Town, District"
                  rows={2}
                  disabled={editSaving}
                />
              </div>
              {editError && (
                <p className="text-[11px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-4 py-2 rounded-lg">{editError}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl text-[11px] font-black uppercase tracking-widest text-white transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  {editSaving ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                  ) : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !passwordLoading && setShowPasswordModal(false)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 w-full max-w-md p-8 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] md:text-heading-2 font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                <Key className="h-5 w-5 text-blue-500" /> Change Password
              </h3>
              {!passwordLoading && (
                <button onClick={() => setShowPasswordModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              )}
            </div>

            {/* Success state */}
            {passwordSuccess ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
                <p className="text-[15px] font-black text-slate-800 dark:text-white">{passwordSuccess}</p>
                <p className="text-[12px] text-slate-500 font-bold">Closing automatically…</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                {/* New Password */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPwd ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-5 py-3 pr-12 text-[14px] font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all"
                      placeholder="Min. 8 characters"
                      disabled={passwordLoading}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {/* Strength indicator */}
                  {passwordForm.newPassword && (
                    <div className="mt-2 flex gap-1">
                      {[...Array(4)].map((_, i) => {
                        const len = passwordForm.newPassword.length
                        const filled = i < (len < 8 ? 1 : len < 12 ? 2 : len < 16 ? 3 : 4)
                        const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-400']
                        return <div key={i} className={`h-1 flex-1 rounded-full transition-all ${filled ? colors[Math.min(Math.floor((passwordForm.newPassword.length - 1) / 4), 3)] : 'bg-slate-200 dark:bg-slate-700'}`} />
                      })}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPwd ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-5 py-3 pr-12 text-[14px] font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all"
                      placeholder="Re-enter new password"
                      disabled={passwordLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {/* Match indicator */}
                  {passwordForm.confirmPassword && (
                    <p className={`mt-1.5 text-[11px] font-bold ${passwordForm.newPassword === passwordForm.confirmPassword ? 'text-emerald-500' : 'text-red-500'}`}>
                      {passwordForm.newPassword === passwordForm.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>

                {passwordError && (
                  <p className="text-[11px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-2.5 rounded-lg">{passwordError}</p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    disabled={passwordLoading}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl text-[11px] font-black uppercase tracking-widest text-white transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                  >
                    {passwordLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</>
                    ) : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  )
}
