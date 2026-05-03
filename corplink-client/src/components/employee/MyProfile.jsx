import { useEffect, useState, useRef } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import { logAdminActivity } from "../../utils/logger"
import {
  UserCircle,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  Camera,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit3,
  X,
  Clock,
  ShieldCheck,
} from "lucide-react"

// ─── Skeleton ──────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg ${className}`} />
}

// ─── Toast ─────────────────────────────────────────────────────────
function Toast({ message, type }) {
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold
      ${type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}
    >
      {type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
      {message}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────
function MyProfile() {
  const { user, profile } = useAuth()
  const fileInputRef = useRef()

  const [employeeData, setEmployeeData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])

  // Edit form state
  const [phone, setPhone] = useState("")
  const [photoUrl, setPhotoUrl] = useState("")
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)

  const showToast = (message, type = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    if (user?.id && profile?.company_id) {
      fetchProfileData()
      fetchActivity()
    }
  }, [user, profile])

  const fetchProfileData = async () => {
    setLoading(true)
    try {
      const emailToSearch = user?.email || profile?.email
      
      // Try employees table by email (user_id may not be set yet)
      let emp = null
      
      if (profile?.employee_id) {
        const { data } = await supabase
          .from("employees")
          .select("id, name, email, phone, designation, department_id, profile_photo, joined_at, is_active, role")
          .eq("id", profile.employee_id)
          .eq("company_id", profile.company_id)
          .maybeSingle()
        emp = data
      } else if (emailToSearch) {
        const { data } = await supabase
          .from("employees")
          .select("id, name, email, phone, designation, department_id, profile_photo, joined_at, is_active, role")
          .eq("email", emailToSearch.toLowerCase())
          .eq("company_id", profile.company_id)
          .maybeSingle()
        emp = data
      }

      if (emp) {
        setEmployeeData(emp)
        setPhone(emp.phone || "")
        setPhotoUrl(emp.profile_photo || "")
      } else {
        // Fallback to profile data
        setEmployeeData({
          name: profile.full_name || profile.name || "Employee",
          email: profile.email || user.email,
          phone: profile.phone || "",
          designation: profile.designation || profile.role || "Employee",
          joined_at: profile.created_at,
          profile_photo: profile.profile_photo || "",
        })
        setPhone(profile.phone || "")
        setPhotoUrl(profile.profile_photo || "")
      }
    } catch (err) {
      console.error("MyProfile fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchActivity = async () => {
    const { data } = await supabase
      .from("activity_logs")
      .select("id, action, entity, created_at")
      .eq("user_id", user.id)
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })
      .limit(5)

    setRecentActivity(data || [])
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)

    try {
      const ext = file.name.split(".").pop()
      const path = `profile-photos/${user.id}-${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from("profile-photos")
        .upload(path, file, { upsert: true })

      if (uploadErr) throw uploadErr

      const { data: urlData } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(path)

      setPhotoUrl(urlData.publicUrl)
      showToast("Photo uploaded! Save your profile to apply.", "success")
    } catch (err) {
      showToast("Photo upload failed. Check Supabase Storage bucket.", "error")
      console.error("Photo upload error:", err)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      // Update employees table (use employee_id from profile, or fallback to email match)
      let updateErr = null
      
      if (profile?.employee_id) {
        const { error } = await supabase
          .from("employees")
          .update({ phone: phone.trim(), profile_photo: photoUrl })
          .eq("id", profile.employee_id)
          .eq("company_id", profile.company_id)
        updateErr = error
      } else {
        const { error } = await supabase
          .from("employees")
          .update({ phone: phone.trim(), profile_photo: photoUrl })
          .eq("email", (user?.email || profile?.email || "").toLowerCase())
          .eq("company_id", profile.company_id)
        updateErr = error
      }

      if (updateErr) {
        // Fallback: update profiles table
        await supabase.from("profiles").update({
          phone: phone.trim(),
          profile_photo: photoUrl,
        }).eq("id", user.id)
      }

      await logAdminActivity({
        company_id: profile.company_id,
        user_id: user.id,
        action: "Updated personal profile",
        entity: "profile",
      })

      setEmployeeData(prev => ({ ...prev, phone, profile_photo: photoUrl }))
      setEditMode(false)
      showToast("Profile updated successfully!", "success")
      fetchActivity()
    } catch (err) {
      showToast("Failed to save profile.", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match.", "error")
      return
    }
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters.", "error")
      return
    }
    setChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      showToast("Password changed successfully!", "success")
      setShowPasswordForm(false)
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      showToast(err.message || "Failed to change password.", "error")
    } finally {
      setChangingPassword(false)
    }
  }

  const timeAgo = (dateStr) => {
    if (!dateStr) return "N/A"
    const diff = Date.now() - new Date(dateStr).getTime()
    const hrs = Math.floor(diff / 3600000)
    if (hrs < 1) return "Just now"
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-72" />
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    )
  }

  const displayName = employeeData?.name || profile?.full_name || profile?.name || "Employee"
  const displayEmail = employeeData?.email || user?.email || ""
  const initials = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCircle className="h-6 w-6 text-blue-500" />
            My Profile
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            View and manage your personal information
          </p>
        </div>
        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
          >
            <Edit3 className="h-4 w-4" />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => { setEditMode(false); setPhone(employeeData?.phone || ""); setPhotoUrl(employeeData?.profile_photo || "") }}
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Profile Card ── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 text-center">
          {/* Avatar */}
          <div className="relative inline-block mb-4">
            {(photoUrl || employeeData?.profile_photo) ? (
              <img
                src={photoUrl || employeeData?.profile_photo}
                alt={displayName}
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 dark:border-blue-900 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-extrabold text-white shadow-md">
                {initials}
              </div>
            )}
            {editMode && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white shadow-lg transition"
              >
                {uploadingPhoto ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>

          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">{displayName}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 capitalize">
            {employeeData?.designation || employeeData?.role || profile?.role || "Employee"}
          </p>

          {/* Active badge */}
          <div className="inline-flex items-center gap-1.5 mt-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-800">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active Employee
          </div>

          {/* Join Date */}
          {employeeData?.joined_at && (
            <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mt-4">
              <Calendar className="h-3.5 w-3.5" />
              Joined {new Date(employeeData.joined_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          )}
        </div>

        {/* ── Info + Edit Section ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Personal Information */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 dark:text-white mb-5 text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Personal Information
            </h3>
            <div className="grid sm:grid-cols-2 gap-5">
              {/* Name (read-only) */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <UserCircle className="h-3.5 w-3.5" /> Full Name
                </label>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-700/50 px-3 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                  {displayName}
                </p>
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Mail className="h-3.5 w-3.5" /> Email
                </label>
                <p className="text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-700/50 px-3 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700 truncate">
                  {displayEmail}
                </p>
              </div>

              {/* Phone (editable) */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Phone className="h-3.5 w-3.5" /> Phone Number
                </label>
                {editMode ? (
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2.5 border border-blue-300 dark:border-blue-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-700/50 px-3 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                    {employeeData?.phone || "Not set"}
                  </p>
                )}
              </div>

              {/* Designation (read-only) */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Briefcase className="h-3.5 w-3.5" /> Designation
                </label>
                <p className="text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-700/50 px-3 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                  {employeeData?.designation || "Not specified"}
                </p>
              </div>
            </div>
          </div>

          {/* Security — Password Change */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <ShieldCheck className="h-4 w-4" />
                Security
              </h3>
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Lock className="h-3.5 w-3.5" />
                {showPasswordForm ? "Cancel" : "Change Password"}
              </button>
            </div>

            {showPasswordForm ? (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-60"
                >
                  {changingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                  {changingPassword ? "Changing..." : "Update Password"}
                </button>
              </form>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Your password is managed securely. Click "Change Password" to update it.
              </p>
            )}
          </div>

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Recent Activity
              </h3>
              <div className="space-y-3">
                {recentActivity.map(log => (
                  <div key={log.id} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Clock className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{log.action}</p>
                    </div>
                    <p className="text-[11px] text-slate-400 shrink-0">{timeAgo(log.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

export default MyProfile
