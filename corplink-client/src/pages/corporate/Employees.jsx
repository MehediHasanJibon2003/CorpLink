import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import AppLayout from "../../components/layout/AppLayout";
import RoleGate from "../../components/shared/RoleGate";
import {
  Users,
  Search,
  Filter,
  Plus,
  Mail,
  Building,
  Briefcase,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  ClipboardList,
} from "lucide-react";
import { useConfirm } from "../../context/ConfirmContext";

function Employees() {
  const { user, profile } = useAuth();
  const { showConfirm } = useConfirm();
  const [searchParams] = useSearchParams();

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [taskStats, setTaskStats] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  useEffect(() => {
    const id = searchParams.get("id");
    if (id && employees.length > 0) {
      const target = employees.find((e) => e.id === id);
      if (target) setSearchTerm(target.name);
    }
  }, [searchParams, employees]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    department_id: "",
    role: "employee",
    designation: "",
    joining_date: new Date().toISOString().split("T")[0],
  });

  const fetchEmployees = async () => {
    if (!profile?.company_id) return;
    setError("");

    const { data: emps, error: empErr } = await supabase
      .from("employees")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false });

    if (empErr) {
      setError(empErr.message);
      return;
    }

    // Fetch Task Stats for all employees in this company
    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, assigned_to, status")
      .eq("company_id", profile.company_id);

    const stats = {};
    tasks?.forEach((t) => {
      if (!t.assigned_to) return;
      if (!stats[t.assigned_to])
        stats[t.assigned_to] = { total: 0, completed: 0, inProgress: 0 };
      stats[t.assigned_to].total++;
      if (t.status === "finished") stats[t.assigned_to].completed++;
      if (t.status === "in_progress") stats[t.assigned_to].inProgress++;
    });

    setTaskStats(stats);
    setEmployees(emps || []);
  };

  const fetchDepartments = async () => {
    if (!profile?.company_id) return;
    const { data } = await supabase
      .from("departments")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("name");
    setDepartments(data || []);
  };

  useEffect(() => {
    if (profile?.company_id) {
      fetchEmployees();
      fetchDepartments();
    }
  }, [profile?.company_id]);

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      department_id: "",
      role: "employee",
      designation: "",
      joining_date: new Date().toISOString().split("T")[0],
    });
    setEditingId(null);
  };

  const handleEdit = (emp) => {
    setForm({
      name: emp.name,
      email: emp.email,
      department_id: emp.department_id || "",
      role: emp.role,
      designation: emp.designation || "",
      joining_date: emp.joining_date || new Date().toISOString().split("T")[0],
    });
    setEditingId(emp.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and Email are required");
      return;
    }
    setLoading(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from("employees")
          .update({
            name: form.name.trim(),
            email: form.email.trim(),
            department_id: form.department_id || null,
            role: form.role,
            designation: form.designation,
            joining_date: form.joining_date,
          })
          .eq("id", editingId);
        if (error) throw error;

        await supabase.from("activity_logs").insert([
          {
            company_id: profile.company_id,
            user_id: user.id,
            action: `Updated Employee Profile: ${form.name}`,
            entity: "employee",
          },
        ]);
        setMessage("Employee updated successfully");
      } else {
        const { error } = await supabase.from("employees").insert([
          {
            ...form,
            company_id: profile.company_id,
            created_by: user.id,
          },
        ]);
        if (error) throw error;

        await supabase.from("activity_logs").insert([
          {
            company_id: profile.company_id,
            user_id: user.id,
            action: `Added New Employee: ${form.name}`,
            entity: "employee",
          },
        ]);
        setMessage("Employee added successfully");
      }
      resetForm();
      fetchEmployees();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (emp) => {
    showConfirm({
      title: "Delete Employee",
      message: `Are you sure you want to delete ${emp.name}? This will remove their profile record.`,
      onConfirm: async () => {
        const { error } = await supabase
          .from("employees")
          .delete()
          .eq("id", emp.id);
        if (!error) {
          await supabase.from("activity_logs").insert([
            {
              company_id: profile.company_id,
              user_id: user.id,
              action: `Deleted Employee Record: ${emp.name}`,
              entity: "employee",
              severity: "warning",
            },
          ]);
          setMessage("Employee deleted");
          fetchEmployees();
        }
      },
    });
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      (emp.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept =
      deptFilter === "all" || emp.department_id === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <AppLayout
      title="Employee Management"
      subtitle="Systematic directory, performance tracking, and onboarding."
    >
      {/* Top Stats - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl border-2 border-slate-100 dark:border-violet-500/10 shadow-sm">
          <p className="text-[10px] md:text-label font-black uppercase tracking-widest text-slate-500 mb-2">
            Total Directory
          </p>
          <h3 className="text-heading-2 md:text-heading-1 font-black text-slate-900 dark:text-white">
            {employees.length}
          </h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl border-2 border-slate-100 dark:border-violet-500/10 shadow-sm">
          <p className="text-[10px] md:text-label font-black uppercase tracking-widest text-slate-500 mb-2">
            Activated Users
          </p>
          <h3 className="text-heading-2 md:text-heading-1 font-black text-emerald-500">
            {employees.filter((e) => e.onboarded).length}
          </h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl border-2 border-slate-100 dark:border-violet-500/10 shadow-sm">
          <p className="text-[10px] md:text-label font-black uppercase tracking-widest text-slate-500 mb-2">
            Department Count
          </p>
          <h3 className="text-heading-2 md:text-heading-1 font-black text-blue-500">
            {departments.length}
          </h3>
        </div>
        <div className="bg-blue-600 p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-xl shadow-blue-500/20 flex flex-col justify-between">
          <p className="text-[10px] md:text-label font-black uppercase tracking-widest text-blue-100">
            Invite Code
          </p>
          <div className="flex items-center justify-between mt-2">
            <code className="text-[16px] md:text-heading-2 font-black text-white">
              {profile?.company_id?.slice(0, 8)}...
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(profile.company_id);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="text-[9px] md:text-[10px] font-black uppercase bg-white/20 px-2 md:px-3 py-1 rounded-lg text-white"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
        {/* Left: Form */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-8 bg-white dark:bg-slate-800 p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] border-2 border-slate-100 dark:border-violet-500/15 shadow-lg">
            <h3 className="text-heading-2 md:text-heading-1 font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6 md:mb-8 flex items-center gap-3">
              <Plus className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />{" "}
              {editingId ? "Edit Profile" : "Add Employee"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
              <input
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-violet-500/10 rounded-xl md:rounded-2xl px-5 md:px-6 py-3.5 md:py-4 text-[13px] md:text-body font-bold focus:border-blue-500 outline-none transition-all"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-violet-500/10 rounded-xl md:rounded-2xl px-5 md:px-6 py-3.5 md:py-4 text-[13px] md:text-body font-bold focus:border-blue-500 outline-none transition-all"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select
                  value={form.department_id}
                  onChange={(e) =>
                    setForm({ ...form, department_id: e.target.value })
                  }
                  className="bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-violet-500/10 rounded-xl md:rounded-2xl px-4 py-3.5 md:py-4 text-[11px] md:text-label font-black uppercase"
                >
                  <option value="">Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-violet-500/10 rounded-xl md:rounded-2xl px-4 py-3.5 md:py-4 text-[11px] md:text-label font-black uppercase"
                >
                  <option value="employee">General Employee</option>
                  <option value="manager">Manager</option>
                  <option value="dept_head">Dept Head</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <input
                type="text"
                placeholder="Designation"
                value={form.designation}
                onChange={(e) =>
                  setForm({ ...form, designation: e.target.value })
                }
                className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-violet-500/10 rounded-xl md:rounded-2xl px-5 md:px-6 py-3.5 md:py-4 text-[13px] md:text-body font-bold focus:border-blue-500 outline-none transition-all"
              />

              <div>
                <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 mb-1.5 md:mb-2 block">
                  Joining Date
                </label>
                <input
                  type="date"
                  value={form.joining_date}
                  onChange={(e) =>
                    setForm({ ...form, joining_date: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-violet-500/10 rounded-xl md:rounded-2xl px-5 md:px-6 py-3.5 md:py-4 text-[13px] md:text-body font-bold outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase text-[12px] md:text-label tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {loading
                  ? "Syncing..."
                  : editingId
                    ? "Update Profile"
                    : "Register Employee"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full text-slate-400 font-black uppercase text-[10px] py-2"
                >
                  Cancel Edit
                </button>
              )}
            </form>
            {error && (
              <p className="mt-4 text-red-500 text-[11px] md:text-label font-bold bg-red-50 p-4 rounded-xl">
                {error}
              </p>
            )}
            {message && (
              <p className="mt-4 text-emerald-500 text-[11px] md:text-label font-bold bg-emerald-50 p-4 rounded-xl">
                {message}
              </p>
            )}
          </div>
        </div>

        {/* Right: Directory & Metrics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-2xl md:rounded-3xl border-2 border-slate-100 dark:border-violet-500/15 flex flex-col md:flex-row gap-3 md:gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-xl md:rounded-2xl pl-12 pr-4 py-3 text-[13px] md:text-body font-bold outline-none border-2 border-transparent focus:border-violet-500/30"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Filter className="h-4 w-4 md:h-5 md:w-5 text-slate-400" />
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="flex-1 md:w-48 bg-slate-50 dark:bg-slate-900/50 rounded-lg md:rounded-xl px-3 md:px-4 py-3 text-[9px] md:text-[10px] font-black uppercase tracking-widest outline-none"
              >
                <option value="all">All Depts</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Employee Cards */}
          <div className="space-y-4 md:space-y-6">
            {filteredEmployees.length === 0 ? (
              <div className="py-20 text-center bg-white dark:bg-white/5 rounded-3xl md:rounded-[3rem] border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-black uppercase tracking-[0.2em]">
                  No employees found
                </p>
              </div>
            ) : (
              filteredEmployees.map((emp) => {
                const stats = taskStats[emp.id] || {
                  total: 0,
                  completed: 0,
                  inProgress: 0,
                };
                const deptName =
                  departments.find((d) => d.id === emp.department_id)?.name ||
                  "Unassigned";

                return (
                  <div
                    key={emp.id}
                    className="group bg-white dark:bg-slate-800 p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] border-2 border-slate-100 dark:border-violet-500/10 shadow-sm hover:border-blue-500/30 transition-all"
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-4 md:gap-6">
                      <div className="flex gap-4 md:gap-6">
                        <div
                          className={`w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-[2rem] flex items-center justify-center font-black text-[18px] md:text-heading-1 text-white shadow-lg shrink-0 ${emp.onboarded ? "bg-gradient-to-br from-blue-600 to-indigo-600" : "bg-slate-200 text-slate-400"}`}
                        >
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h4 className="text-[15px] md:text-heading-1 font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2 truncate">
                              {emp.name}
                              {emp.onboarded && (
                                <div
                                  className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse shrink-0"
                                  title="Active"
                                />
                              )}
                            </h4>
                            <span
                              className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest ${
                                emp.role === "manager"
                                  ? "bg-purple-100 text-purple-600"
                                  : emp.role === "dept_head"
                                    ? "bg-amber-100 text-amber-600"
                                    : emp.role === "admin"
                                      ? "bg-red-100 text-red-600"
                                      : "bg-blue-100 text-blue-600"
                              }`}
                            >
                              {emp.role.replace("_", " ")}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1 md:gap-1.5">
                            <p className="text-[11px] md:text-body font-bold text-slate-500 flex items-center gap-2 truncate">
                              <Mail className="h-3 w-3 md:h-3.5 md:w-3.5" /> {emp.email}
                            </p>
                            <p className="text-[11px] md:text-body font-bold text-slate-500 flex items-center gap-2 truncate">
                              <Briefcase className="h-3 w-3 md:h-3.5 md:w-3.5 text-blue-500" />{" "}
                              {emp.designation || "N/A"}
                            </p>
                            <p className="text-[11px] md:text-body font-bold text-slate-500 flex items-center gap-2 truncate">
                              <Building className="h-3 w-3 md:h-3.5 md:w-3.5 text-violet-500" />{" "}
                              {deptName}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Contribution Metrics */}
                      <div className="flex justify-around md:flex-col lg:flex-row items-center gap-3 md:gap-6 bg-slate-50 dark:bg-white/5 p-3 md:p-6 rounded-2xl md:rounded-3xl border-2 border-slate-100 dark:border-white/5">
                        <div className="text-center">
                          <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1">
                            Tasks
                          </p>
                          <p className="text-[14px] md:text-heading-2 font-black text-slate-800 dark:text-white">
                            {stats.total}
                          </p>
                        </div>
                        <div className="w-px h-6 md:h-8 bg-slate-200 dark:bg-white/10" />
                        <div className="text-center">
                          <p className="text-[8px] md:text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-0.5 md:mb-1">
                            Done
                          </p>
                          <p className="text-[14px] md:text-heading-2 font-black text-emerald-600">
                            {stats.completed}
                          </p>
                        </div>
                        <div className="w-px h-6 md:h-8 bg-slate-200 dark:bg-white/10" />
                        <div className="text-center">
                          <p className="text-[8px] md:text-[10px] font-black text-blue-500 uppercase tracking-widest mb-0.5 md:mb-1">
                            Active
                          </p>
                          <p className="text-[14px] md:text-heading-2 font-black text-blue-600">
                            {stats.inProgress}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t-2 border-slate-50 dark:border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Calendar className="h-3 w-3 md:h-3.5 md:w-3.5" /> 
                        <span className="hidden xs:inline">Joined</span> {new Date(emp.joining_date).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(emp)}
                          className="p-2 md:p-3 rounded-lg md:rounded-xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-blue-500 transition-all"
                        >
                          <Edit3 className="h-4 w-4 md:h-5 md:w-5" />
                        </button>
                        <RoleGate allowedRoles={["admin", "corporate_admin"]}>
                          <button
                            onClick={() => handleDelete(emp)}
                            className="p-2 md:p-3 rounded-lg md:rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                          >
                            <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
                          </button>
                        </RoleGate>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default Employees;
