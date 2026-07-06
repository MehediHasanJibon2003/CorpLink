import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { logAdminActivity } from "../../utils/logger";
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
} from "lucide-react";

// ─── Skeleton ──────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg ${className}`}
    />
  );
}

// ─── Toast ─────────────────────────────────────────────────────────
function Toast({ message, type }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-body font-semibold
      ${type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}
    >
      {type === "success" ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      {message}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────
function MyProfile() {
  const { user, profile, setProfile } = useAuth();
  const fileInputRef = useRef();

  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  // Edit form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [currentAddress, setCurrentAddress] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (user?.id && profile?.company_id) {
      fetchProfileData();
      fetchActivity();
    }
  }, [user, profile?.company_id]);

  useEffect(() => {
    if (profile) {
      setDateOfBirth(profile.date_of_birth || "");
      setCurrentAddress(profile.current_address || "");
      setPermanentAddress(profile.permanent_address || "");
    }
  }, [profile]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const emailToSearch = user?.email || profile?.email;

      // Try employees table by email (user_id may not be set yet)
      let emp = null;

      if (profile?.employee_id) {
        const { data } = await supabase
          .from("employees")
          .select(
            "id, name, email, phone, designation, department_id, profile_photo, joined_at, is_active, role",
          )
          .eq("id", profile.employee_id)
          .eq("company_id", profile.company_id)
          .maybeSingle();
        emp = data;
      } else if (emailToSearch) {
        const { data } = await supabase
          .from("employees")
          .select(
            "id, name, email, phone, designation, department_id, profile_photo, joined_at, is_active, role",
          )
          .eq("email", emailToSearch.toLowerCase())
          .eq("company_id", profile.company_id)
          .maybeSingle();
        emp = data;
      }

      if (emp) {
        setEmployeeData(emp);
        setName(emp.name || "");
        setPhone(emp.phone || "");
        setPhotoUrl(emp.profile_photo || "");
      } else {
        // Fallback to profile data
        setEmployeeData({
          name: profile.full_name || profile.name || "Employee",
          email: profile.email || user.email,
          phone: profile.phone || "",
          designation: profile.designation || profile.role || "Employee",
          joined_at: profile.created_at,
          profile_photo: profile.avatar_url || "",
        });
        setName(profile.full_name || profile.name || "Employee");
        setPhone(profile.phone || "");
        setPhotoUrl(profile.avatar_url || "");
      }
      setDateOfBirth(profile?.date_of_birth || "");
      setCurrentAddress(profile?.current_address || "");
      setPermanentAddress(profile?.permanent_address || "");
    } catch (err) {
      console.error("MyProfile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivity = async () => {
    const { data } = await supabase
      .from("activity_logs")
      .select("id, action, entity, created_at")
      .eq("user_id", user.id)
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })
      .limit(5);

    setRecentActivity(data || []);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);

    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}-${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      setPhotoUrl(urlData.publicUrl);
      showToast("Photo uploaded! Save your profile to apply.", "success");
    } catch (err) {
      showToast("Photo upload failed. Check Supabase Storage bucket.", "error");
      console.error("Photo upload error:", err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      showToast("Name cannot be empty.", "error");
      return;
    }
    setSaving(true);
    try {
      // Update employees table (use employee_id from profile, or fallback to email match)
      if (profile?.employee_id) {
        await supabase
          .from("employees")
          .update({ name: name.trim(), phone: phone.trim(), profile_photo: photoUrl })
          .eq("id", profile.employee_id)
          .eq("company_id", profile.company_id);
      } else {
        await supabase
          .from("employees")
          .update({ name: name.trim(), phone: phone.trim(), profile_photo: photoUrl })
          .eq("email", (user?.email || profile?.email || "").toLowerCase())
          .eq("company_id", profile.company_id);
      }

      // Always update profiles table
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({
          full_name: name.trim(),
          avatar_url: photoUrl,
          phone: phone.trim(),
          date_of_birth: dateOfBirth || null,
          current_address: currentAddress.trim() || null,
          permanent_address: permanentAddress.trim() || null,
        })
        .eq("id", user.id);

      if (profileErr) throw profileErr;

      await logAdminActivity({
        company_id: profile.company_id,
        user_id: user.id,
        action: "Updated personal profile details",
        entity: "profile",
      });

      setEmployeeData((prev) => ({ 
        ...prev, 
        name: name.trim(),
        phone: phone.trim(), 
        profile_photo: photoUrl 
      }));

      // Update AuthContext profile state so sidebar and headers sync immediately
      setProfile((prev) => ({
        ...prev,
        full_name: name.trim(),
        avatar_url: photoUrl,
        phone: phone.trim(),
        date_of_birth: dateOfBirth || null,
        current_address: currentAddress.trim() || null,
        permanent_address: permanentAddress.trim() || null,
      }));

      setEditMode(false);
      showToast("Profile updated successfully!", "success");
      fetchActivity();
    } catch (err) {
      showToast("Failed to save profile: " + err.message, "error");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      showToast("Password changed successfully!", "success");
      setShowPasswordForm(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showToast(err.message || "Failed to change password.", "error");
    } finally {
      setChangingPassword(false);
    }
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return "N/A";
    const diff = Date.now() - new Date(dateStr).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return "Just now";
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

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
    );
  }

  const displayName =
    employeeData?.name || profile?.full_name || profile?.name || "Employee";
  const displayEmail = employeeData?.email || user?.email || "";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-1 font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCircle className="h-6 w-6 text-blue-500" />
            My Profile
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-body mt-0.5">
            View and manage your personal information
          </p>
        </div>
        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center gap-2 text-body font-semibold text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
          >
            <Edit3 className="h-4 w-4" />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditMode(false);
                setName(employeeData?.name || "");
                setPhone(employeeData?.phone || "");
                setPhotoUrl(employeeData?.profile_photo || "");
                setDateOfBirth(profile?.date_of_birth || "");
                setCurrentAddress(profile?.current_address || "");
                setPermanentAddress(profile?.permanent_address || "");
              }}
              className="flex items-center gap-2 text-body font-semibold text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-2 text-body font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 md:gap-16">
        {/* ── Profile Card ── */}
        <div className="xl:col-span-1 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] shadow-sm p-12 md:p-16 flex flex-col items-center text-center transition-all hover:shadow-xl">
          {/* Avatar */}
          <div className="relative inline-block mb-4">
            {photoUrl || employeeData?.profile_photo ? (
              <img
                src={photoUrl || employeeData?.profile_photo}
                alt={displayName}
                className="w-40 h-40 md:w-56 md:h-56 rounded-full object-cover border-4 border-blue-100 dark:border-blue-900 shadow-md"
              />
            ) : (
              <div className="w-40 h-40 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-6xl md:text-8xl font-black text-white shadow-md">
                {initials}
              </div>
            )}
            {editMode && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-4 right-4 w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white shadow-lg transition"
              >
                {uploadingPhoto ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Camera className="h-6 w-6" />
                )}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          <h2 className="text-heading-1 md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            {displayName}
          </h2>
          <p className="text-heading-2 md:text-heading-1 text-slate-500 dark:text-slate-400 mt-2 font-bold capitalize">
            {employeeData?.designation ||
              employeeData?.role ||
              profile?.role ||
              "Employee"}
          </p>

          {/* Active badge */}
          <div className="inline-flex items-center gap-2 mt-6 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-6 py-2 rounded-full text-body md:text-heading-3 font-black uppercase tracking-widest border-2 border-emerald-200 dark:border-emerald-800 shadow-md">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Active Employee
          </div>

          {/* Join Date */}
          {employeeData?.joined_at && (
            <p className="flex items-center justify-center gap-2 text-body md:text-body text-slate-400 mt-8 font-black uppercase tracking-[0.1em]">
              <Calendar className="h-5 w-5" />
              Joined{" "}
              {new Date(employeeData.joined_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
              })}
            </p>
          )}
              
          <div className="w-full mt-8 md:mt-10 pt-8 border-t-2 border-slate-100 dark:border-slate-700 text-left space-y-6">
            <div>
              <p className="text-[9px] md:text-label text-slate-400 font-black uppercase tracking-widest mb-1">Organization</p>
              <p className="text-[14px] md:text-heading-3 font-black text-slate-800 dark:text-slate-100">{profile?.companies?.name || "CorpLink Enterprise"}</p>
            </div>
            {profile?.company_id && (
              <div>
                <p className="text-[9px] md:text-label text-slate-400 font-black uppercase tracking-widest mb-1">Invite Code / Company ID</p>
                <code className="text-[12px] md:text-[13px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 inline-block">
                  {profile.company_id}
                </code>
              </div>
            )}
            {profile?.phone && (
              <div>
                <p className="text-[9px] md:text-label text-slate-400 font-black uppercase tracking-widest mb-1">Phone</p>
                <p className="text-[14px] md:text-body font-bold text-slate-700 dark:text-slate-300">{profile.phone}</p>
              </div>
            )}
            {profile?.date_of_birth && (
              <div>
                <p className="text-[9px] md:text-label text-slate-400 font-black uppercase tracking-widest mb-1">Date of Birth</p>
                <p className="text-[14px] md:text-body font-bold text-slate-700 dark:text-slate-300">
                  {new Date(profile.date_of_birth).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            )}
            {profile?.current_address && (
              <div>
                <p className="text-[9px] md:text-label text-slate-400 font-black uppercase tracking-widest mb-1">Current Address</p>
                <p className="text-[13px] md:text-body font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{profile.current_address}</p>
              </div>
            )}
            {profile?.permanent_address && (
              <div>
                <p className="text-[9px] md:text-label text-slate-400 font-black uppercase tracking-widest mb-1">Permanent Address</p>
                <p className="text-[13px] md:text-body font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{profile.permanent_address}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Info + Edit Section ── */}
        <div className="xl:col-span-2 space-y-8 md:space-y-12">
          {/* Personal Information */}
          <div className="border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] shadow-sm p-12 md:p-16">
            <h3 className="font-black text-slate-800 dark:text-white mb-8 md:mb-10 text-heading-2 md:text-heading-1 uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Personal Information
            </h3>
            <div className="grid xl:grid-cols-2 gap-8 md:gap-10">
              {/* Name (editable) */}
              <div>
                <label className="text-body md:text-body font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
                  <UserCircle className="h-5 w-5" /> Full Name
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-6 py-4 border-2 border-blue-300 dark:border-blue-700 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-heading-3 outline-none focus:ring-4 focus:ring-blue-500/20"
                  />
                ) : (
                  <p className="text-heading-3 md:text-heading-2 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-700/50 px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700">
                    {displayName}
                  </p>
                )}
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="text-body md:text-body font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
                  <Mail className="h-5 w-5" /> Email
                </label>
                <p className="text-heading-3 md:text-heading-2 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-700/50 px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 truncate">
                  {displayEmail}
                </p>
              </div>

              {/* Phone (editable) */}
              <div>
                <label className="text-body md:text-body font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
                  <Phone className="h-5 w-5" /> Phone Number
                </label>
                {editMode ? (
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-6 py-4 border-2 border-blue-300 dark:border-blue-700 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-heading-3 outline-none focus:ring-4 focus:ring-blue-500/20"
                  />
                ) : (
                  <p className="text-heading-3 md:text-heading-2 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-700/50 px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700">
                    {employeeData?.phone || "Not set"}
                  </p>
                )}
              </div>

              {/* Designation (read-only) */}
              <div>
                <label className="text-body md:text-body font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
                  <Briefcase className="h-5 w-5" /> Designation
                </label>
                <p className="text-heading-3 md:text-heading-2 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-700/50 px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700">
                  {employeeData?.designation || "Not specified"}
                </p>
              </div>

              {/* Date of Birth (editable) */}
              <div>
                <label className="text-body md:text-body font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
                  <Calendar className="h-5 w-5" /> Date of Birth
                </label>
                {editMode ? (
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-6 py-4 border-2 border-blue-300 dark:border-blue-700 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-heading-3 outline-none focus:ring-4 focus:ring-blue-500/20"
                  />
                ) : (
                  <p className="text-heading-3 md:text-heading-2 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-700/50 px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700">
                    {profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "Not set"}
                  </p>
                )}
              </div>

              {/* Empty placeholder for alignment */}
              <div className="hidden xl:block"></div>

              {/* Current Address (editable) */}
              <div className="xl:col-span-2">
                <label className="text-body md:text-body font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
                  Current Address
                </label>
                {editMode ? (
                  <textarea
                    value={currentAddress}
                    onChange={(e) => setCurrentAddress(e.target.value)}
                    placeholder="Enter current address"
                    rows={2}
                    className="w-full px-6 py-4 border-2 border-blue-300 dark:border-blue-700 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-heading-3 outline-none focus:ring-4 focus:ring-blue-500/20 resize-none"
                  />
                ) : (
                  <p className="text-heading-3 md:text-heading-2 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-700/50 px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 leading-relaxed">
                    {profile?.current_address || "Not set"}
                  </p>
                )}
              </div>

              {/* Permanent Address (editable) */}
              <div className="xl:col-span-2">
                <label className="text-body md:text-body font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
                  Permanent Address
                </label>
                {editMode ? (
                  <textarea
                    value={permanentAddress}
                    onChange={(e) => setPermanentAddress(e.target.value)}
                    placeholder="Enter permanent address"
                    rows={2}
                    className="w-full px-6 py-4 border-2 border-blue-300 dark:border-blue-700 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-heading-3 outline-none focus:ring-4 focus:ring-blue-500/20 resize-none"
                  />
                ) : (
                  <p className="text-heading-3 md:text-heading-2 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-700/50 px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 leading-relaxed">
                    {profile?.permanent_address || "Not set"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Security — Password Change */}
          <div className="border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] shadow-sm p-12 md:p-16">
            <div className="flex items-center justify-between mb-8 md:mb-10">
              <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-4 text-heading-2 md:text-heading-1 uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <ShieldCheck className="h-8 w-8" />
                Security
              </h3>
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="text-body md:text-heading-3 font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
              >
                <Lock className="h-5 w-5" />
                {showPasswordForm ? "Cancel" : "Change Password"}
              </button>
            </div>

            {showPasswordForm ? (
              <form
                onSubmit={handleChangePassword}
                className="space-y-6 md:space-y-8"
              >
                <div>
                  <label className="block text-body md:text-body font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em] mb-3">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full px-6 py-4 border-2 border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-heading-3 outline-none focus:ring-4 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-body md:text-body font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em] mb-3">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-6 py-4 border-2 border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-heading-3 outline-none focus:ring-4 focus:ring-blue-500/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-heading-3 font-black uppercase tracking-widest shadow-md transition disabled:opacity-60"
                >
                  {changingPassword && (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  )}
                  {changingPassword ? "Changing..." : "Update Password"}
                </button>
              </form>
            ) : (
              <p className="text-heading-3 md:text-heading-2 text-slate-500 dark:text-slate-400 font-bold">
                Your password is managed securely. Click "Change Password" to
                update it.
              </p>
            )}
          </div>

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <div className="border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl md:rounded-[3rem] shadow-sm p-12 md:p-16">
              <h3 className="font-black text-slate-800 dark:text-white mb-8 md:mb-10 text-heading-2 md:text-heading-1 uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Recent Activity
              </h3>
              <div className="space-y-6 md:space-y-8">
                {recentActivity.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-6 md:gap-8 p-6 md:p-8 border-4 border-slate-100 dark:border-slate-700 rounded-[2rem] hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all group"
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Clock className="h-8 w-8" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-heading-3 md:text-heading-2 font-bold text-slate-800 dark:text-slate-100 truncate mb-1">
                        {log.action}
                      </p>
                      <p className="text-body md:text-body text-slate-500 font-bold uppercase tracking-widest">
                        {timeAgo(log.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

export default MyProfile;

