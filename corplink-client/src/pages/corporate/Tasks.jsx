import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { logModuleUsage } from "../../services/usageService";
import AppLayout from "../../components/layout/AppLayout";

import ProjectsPanel from "../../components/corporate/tasks/ProjectsPanel";
import TaskKanban from "../../components/corporate/tasks/TaskKanban";
import TaskDetailModal from "../../components/corporate/tasks/TaskDetailModal";
import ProjectChatPanel from "../../components/corporate/tasks/ProjectChatPanel";
import PerformanceAnalytics from "../../components/corporate/tasks/PerformanceAnalytics";
import { logAdminActivity } from "../../utils/logger";
import { filterDataByHierarchy } from "../../utils/permissions";
import { createNotification } from "../../utils/notificationUtils";

function Tasks() {
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState("projects");
  const [activeProject, setActiveProject] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [initialTab, setInitialTab] = useState("comments");
  const [triggerRefetch, setTriggerRefetch] = useState(0);

  const [showCreateTask, setShowCreateTask] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assigned_to: "",
    deadline: "",
    priority: "medium",
  });

  useEffect(() => {
    if (profile) {
      logModuleUsage("Tasks", profile.company_id, user.id);
      supabase
        .from("employees")
        .select("id, name")
        .eq("company_id", profile.company_id)
        .then((res) => {
          if (res.data) setEmployees(res.data);
        });

      // Deep Linking Logic
      const projectId = searchParams.get("projectId");
      const taskId = searchParams.get("taskId");

      if (projectId) {
        supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single()
          .then((res) => {
            if (res.data) {
              setActiveProject(res.data);
              setActiveTab("kanban");
            }
          });
      }

      if (taskId) {
        supabase
          .from("tasks")
          .select("*")
          .eq("id", taskId)
          .single()
          .then((res) => {
            if (res.data) {
              setActiveTask(res.data);
              setActiveTab("kanban");
            }
          });
      }
    }
  }, [profile, user.id, searchParams]);

  const handleSelectProject = (project) => {
    setActiveProject(project);
    setActiveTab("kanban");
    setSearchParams({ projectId: project.id });
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const insertData = {
      company_id: profile.company_id,
      title: form.title.trim(),
      description: form.description.trim(),
      assigned_to: form.assigned_to || null,
      deadline: form.deadline || null,
      priority: form.priority,
      status: "pending",
      created_by: user.id,
    };

    if (activeProject) {
      insertData.project_id = activeProject.id;
      insertData.department_id = activeProject.department_id || null;
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert([insertData])
      .select();
    if (!error) {
      setShowCreateTask(false);

      // Generate Notification if assigned
      if (insertData.assigned_to) {
        await createNotification(
          insertData.assigned_to,
          profile.company_id,
          "task_assigned",
          `New Task Assigned: ${insertData.title}`,
        );
      }

      setForm({
        title: "",
        description: "",
        assigned_to: "",
        deadline: "",
        priority: "medium",
      });
      setTriggerRefetch((prev) => prev + 1);
      await logAdminActivity({
        company_id: profile.company_id,
        user_id: user.id,
        action: `Created task '${insertData.title}'`,
        entity: "task",
      });
    } else {
      alert(error.message);
    }
  };

  return (
    <AppLayout
      title="Projects & Tasks"
      subtitle="Master board for workflows, approvals, and productivity."
    >
      <div className="bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-2 md:p-5 mb-6 md:mb-12 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-2 md:gap-4 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
          <button
            onClick={() => setActiveTab("projects")}
            className={`px-3 py-2 md:px-6 md:py-2.5 font-semibold text-[12px] md:text-body rounded-lg md:rounded-xl transition whitespace-nowrap ${activeTab === "projects" ? "bg-blue-50 text-blue-700" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50"}`}
          >
            📂 Projects
          </button>
          <button
            onClick={() => setActiveTab("kanban")}
            className={`px-3 py-2 md:px-6 md:py-2.5 font-semibold text-[12px] md:text-body rounded-lg md:rounded-xl transition whitespace-nowrap ${activeTab === "kanban" ? "bg-blue-50 text-blue-700" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50"}`}
          >
            📋{" "}
            {activeProject
              ? `Board: ${activeProject.name}`
              : "Global Board"}
          </button>
          {activeProject && (
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-3 py-2 md:px-6 md:py-2.5 font-semibold text-[12px] md:text-body rounded-lg md:rounded-xl transition whitespace-nowrap ${activeTab === "chat" ? "bg-blue-50 text-blue-700" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50"}`}
            >
              💬 Chat
            </button>
          )}
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-3 py-2 md:px-6 md:py-2.5 font-semibold text-[12px] md:text-body rounded-lg md:rounded-xl transition whitespace-nowrap ${activeTab === "analytics" ? "bg-blue-50 text-blue-700" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50"}`}
          >
            📈 Analytics
          </button>
        </div>

        {activeTab === "kanban" && (
          <button
            onClick={() => setShowCreateTask(true)}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-[12px] md:text-button px-6 py-2.5 rounded-xl transition shadow-lg shadow-blue-500/20 active:scale-95"
          >
            + New Task
          </button>
        )}
      </div>

      {activeTab === "projects" && (
        <ProjectsPanel
          profile={profile}
          user={user}
          onSelectProject={handleSelectProject}
        />
      )}

      {activeTab === "kanban" && (
        <div className="animate-in fade-in duration-300">
          <TaskKanban
            activeProject={activeProject}
            profile={profile}
            onTaskClick={(t, tab = "comments") => {
              setActiveTask(t);
              setInitialTab(tab);
            }}
            triggerRefetch={triggerRefetch}
          />
        </div>
      )}

      {activeTab === "chat" && activeProject && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <ProjectChatPanel activeProject={activeProject} profile={profile} />
        </div>
      )}

      {activeTab === "analytics" && <PerformanceAnalytics profile={profile} />}

      {activeTask && (
        <TaskDetailModal
          task={activeTask}
          profile={profile}
          initialTab={initialTab}
          onClose={() => setActiveTask(null)}
          onUpdate={() => {
            setTriggerRefetch((prev) => prev + 1);
          }}
        />
      )}

      {showCreateTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl shadow-xl w-full max-w-2xl p-6 md:p-10">
            <h3 className="text-heading-2 font-bold text-slate-800 dark:text-slate-100 mb-2">
              Create New Task
            </h3>
            <p className="text-body text-slate-500 dark:text-slate-400 mb-6">
              {activeProject
                ? `Adding under project: ${activeProject.name}`
                : "Adding to Global Inbox"}
            </p>
            <form
              onSubmit={handleCreateTask}
              className="space-y-4 md:space-y-6"
            >
              <div>
                <label className="text-label font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 mt-1 outline-none focus:border-blue-500 text-input bg-slate-50 dark:bg-slate-900/50"
                />
              </div>
              <div>
                <label className="text-label font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 mt-1 outline-none focus:border-blue-500 text-input bg-slate-50 dark:bg-slate-900/50"
                  rows="3"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="text-label font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Assign To
                  </label>
                  <select
                    value={form.assigned_to}
                    onChange={(e) =>
                      setForm({ ...form, assigned_to: e.target.value })
                    }
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 mt-1 outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 text-input"
                  >
                    <option value="">-- Unassigned --</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-label font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value })
                    }
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 mt-1 outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 text-input"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-label font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Deadline
                </label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) =>
                    setForm({ ...form, deadline: e.target.value })
                  }
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 mt-1 outline-none focus:border-blue-500 text-input bg-slate-50 dark:bg-slate-900/50"
                />
              </div>
              <div className="flex justify-end gap-3 md:gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setShowCreateTask(false)}
                  className="text-slate-500 dark:text-slate-400 font-bold px-6 py-2.5 text-button hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 text-button rounded-xl transition shadow-lg shadow-blue-500/20 hover:-translate-y-0.5"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default Tasks;
