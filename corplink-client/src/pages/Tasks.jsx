import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import AppLayout from "../components/layout/AppLayout"

function Tasks() {
  const { user, profile } = useAuth()

  const [tasks, setTasks] = useState([])
  const [employees, setEmployees] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const [form, setForm] = useState({
    title: "",
    description: "",
    assigned_to: "",
    deadline: "",
    status: "pending",
    priority: "medium",
  })

  const fetchTasks = async () => {
    setError("")

    const { data, error } = await supabase
      .from("tasks")
      .select("*, employees(name,email)")
      .order("created_at", { ascending: false })

    if (error) {
      setError(error.message)
      return
    }

    setTasks(data || [])
  }

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      setError(error.message)
      return
    }

    setEmployees(data || [])
  }

  useEffect(() => {
    fetchTasks()
    fetchEmployees()
  }, [])

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      assigned_to: "",
      deadline: "",
      status: "pending",
      priority: "medium",
    })
    setEditingId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setMessage("")

    if (!form.title.trim()) {
      setError("Task title দাও")
      return
    }

    if (!profile?.company_id) {
      setError("Company ID পাওয়া যায়নি")
      return
    }

    if (!user?.id) {
      setError("User পাওয়া যায়নি")
      return
    }

    setLoading(true)

    try {
      if (editingId) {
        const { error } = await supabase
          .from("tasks")
          .update({
            title: form.title.trim(),
            description: form.description.trim(),
            assigned_to: form.assigned_to || null,
            deadline: form.deadline || null,
            status: form.status,
            priority: form.priority,
          })
          .eq("id", editingId)

        if (error) {
          setError(error.message)
          setLoading(false)
          return
        }

        await supabase.from("activity_logs").insert([
          {
            company_id: profile.company_id,
            user_id: user.id,
            action: "Updated Task",
            entity: "task",
          },
        ])

        setMessage("Task updated successfully")
      } else {
        const { error } = await supabase.from("tasks").insert([
          {
            company_id: profile.company_id,
            title: form.title.trim(),
            description: form.description.trim(),
            assigned_to: form.assigned_to || null,
            deadline: form.deadline || null,
            status: form.status,
            priority: form.priority,
            created_by: user.id,
          },
        ])

        if (error) {
          setError(error.message)
          setLoading(false)
          return
        }

        await supabase.from("activity_logs").insert([
          {
            company_id: profile.company_id,
            user_id: user.id,
            action: "Created Task",
            entity: "task",
          },
        ])

        setMessage("Task added successfully")
      }

      resetForm()
      fetchTasks()
    } catch (err) {
      console.error(err)
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (task) => {
    setEditingId(task.id)
    setForm({
      title: task.title || "",
      description: task.description || "",
      assigned_to: task.assigned_to || "",
      deadline: task.deadline || "",
      status: task.status || "pending",
      priority: task.priority || "medium",
    })
    setError("")
    setMessage("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this task?")
    if (!ok) return

    setError("")
    setMessage("")

    const { error } = await supabase.from("tasks").delete().eq("id", id)

    if (error) {
      setError(error.message)
      return
    }

    await supabase.from("activity_logs").insert([
      {
        company_id: profile.company_id,
        user_id: user.id,
        action: "Deleted Task",
        entity: "task",
      },
    ])

    setMessage("Task deleted successfully")
    fetchTasks()
  }

  const getStatusBadge = (status) => {
    if (status === "pending") {
      return "bg-amber-100 text-amber-700"
    }
    if (status === "in_progress") {
      return "bg-blue-100 text-blue-700"
    }
    if (status === "finished") {
      return "bg-green-100 text-green-700"
    }
    return "bg-slate-100 text-slate-700"
  }

  const getPriorityBadge = (priority) => {
    if (priority === "high") {
      return "bg-red-100 text-red-700"
    }
    if (priority === "medium") {
      return "bg-purple-100 text-purple-700"
    }
    if (priority === "low") {
      return "bg-slate-100 text-slate-700"
    }
    return "bg-slate-100 text-slate-700"
  }

  return (
    <AppLayout
      title="Task Management"
      subtitle="Create, assign, update and manage your company tasks"
    >
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Task Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="border border-slate-300 px-4 py-3 rounded-xl outline-none focus:border-blue-500"
            />

            <select
              value={form.assigned_to}
              onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
              className="border border-slate-300 px-4 py-3 rounded-xl outline-none focus:border-blue-500"
            >
              <option value="">Assign Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} - {emp.email}
                </option>
              ))}
            </select>

            <textarea
              placeholder="Task Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border border-slate-300 px-4 py-3 rounded-xl outline-none focus:border-blue-500 md:col-span-2"
              rows="4"
            />

            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="border border-slate-300 px-4 py-3 rounded-xl outline-none focus:border-blue-500"
            />

            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="border border-slate-300 px-4 py-3 rounded-xl outline-none focus:border-blue-500"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>

            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="border border-slate-300 px-4 py-3 rounded-xl outline-none focus:border-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="finished">Finished</option>
            </select>

            <div className="flex gap-3 items-center">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium"
              >
                {loading ? "Saving..." : editingId ? "Update Task" : "Add Task"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-6 py-3 rounded-xl font-medium"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
          {message && <p className="text-green-600 text-sm mt-4">{message}</p>}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Total Tasks</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-2">
              {tasks.length}
            </h3>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Pending / In Progress</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-2">
              {
                tasks.filter(
                  (t) => t.status === "pending" || t.status === "in_progress"
                ).length
              }
            </h3>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Finished Tasks</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-2">
              {tasks.filter((t) => t.status === "finished").length}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="text-xl font-semibold text-slate-800">Task List</h3>
          </div>

          {tasks.length === 0 ? (
            <p className="p-5 text-slate-500">No tasks yet</p>
          ) : (
            <div className="divide-y divide-slate-200">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-lg font-semibold text-slate-800">
                        {task.title}
                      </h4>

                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusBadge(
                          task.status
                        )}`}
                      >
                        {task.status === "in_progress"
                          ? "In Progress"
                          : task.status.charAt(0).toUpperCase() +
                            task.status.slice(1)}
                      </span>

                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${getPriorityBadge(
                          task.priority
                        )}`}
                      >
                        {task.priority.charAt(0).toUpperCase() +
                          task.priority.slice(1)}{" "}
                        Priority
                      </span>
                    </div>

                    <p className="text-slate-500 text-sm mt-2">
                      {task.description || "No description"}
                    </p>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 text-sm text-slate-600">
                      <p>
                        <span className="font-semibold">Assigned To:</span>{" "}
                        {task.employees?.name || "Not assigned"}
                      </p>
                      <p>
                        <span className="font-semibold">Employee Email:</span>{" "}
                        {task.employees?.email || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold">Deadline:</span>{" "}
                        {task.deadline || "No deadline"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <button
                      onClick={() => handleEdit(task)}
                      className="text-blue-600 font-medium hover:underline"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(task.id)}
                      className="text-red-600 font-medium hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

export default Tasks