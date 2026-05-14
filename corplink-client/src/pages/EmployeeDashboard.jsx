import { useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import EmployeeLayout from "../components/employee/EmployeeLayout"
import PersonalDashboard from "../components/employee/PersonalDashboard"
import PerformanceInsight from "../components/employee/PerformanceInsight"
import MyTasks from "../components/employee/MyTasks"
import MyProjects from "../components/employee/MyProjects"
import CorporateFeed from "../components/employee/CorporateFeed"
import Notifications from "../components/employee/Notifications"
import CollaborationRequest from "../components/employee/CollaborationRequest"
import MyProfile from "../components/employee/MyProfile"
import MyDepartment from "../components/employee/MyDepartment"

/**
 * EmployeeDashboard.jsx — Main shell for the Employee Module
 *
 * Routes:
 *  /employee/dashboard     → PersonalDashboard
 *  /employee/performance   → PerformanceInsight
 *  /employee/tasks         → MyTasks
 *  /employee/projects      → MyProjects
 *  /employee/feed          → CorporateFeed
 *  /employee/notifications → Notifications
 *  /employee/collaboration → CollaborationRequest
 *  /employee/profile       → MyProfile
 *
 * Layout: EmployeeLayout (own sidebar + topbar, separate from admin)
 */
import Messages from "./Messages"

function EmployeeDashboard() {
  const location = useLocation()
  const { profile } = useAuth()

  const role = profile?.role?.toLowerCase();

  const rolePermissions = {
    // restricted = intern/trainee — limited read-only access
    "/employee/dashboard":    ["employee", "restricted"],
    "/employee/tasks":        ["employee", "restricted"],  // sees only assigned tasks
    "/employee/feed":         ["employee", "restricted"],  // read-only feed
    "/employee/notifications":["employee", "restricted"],
    "/employee/profile":      ["employee", "restricted"],
    // Regular employee only below
    "/employee/performance":  ["employee"],
    "/employee/projects":     ["employee"],
    "/employee/messages":     ["employee"],
    "/employee/department":   ["employee"],
    "/employee/collaboration":["employee"],
  };

  // Determine which sub-component to render based on URL path
  const renderView = () => {
    const path = location.pathname;

    // Check permissions
    const allowedRoles = Object.entries(rolePermissions).find(([p]) => path.startsWith(p))?.[1];
    if (allowedRoles && !allowedRoles.includes(role)) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-800 rounded-[3rem] border-2 border-slate-200 dark:border-slate-700 shadow-sm">
           <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-red-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m0 0v2m0-2h2m-2 0H10m11 3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
           </div>
           <h2 className="text-heading-1 font-black text-slate-900 dark:text-white uppercase tracking-tighter">Security Protocol Breach</h2>
           <p className="text-heading-2 text-slate-500 dark:text-slate-400 mt-4 max-w-md font-bold uppercase tracking-widest leading-relaxed">
              Your current clearance level <span className="text-red-600">[{role || "N/A"}]</span> does not permit access to this operational sector.
           </p>
           <button 
             onClick={() => window.location.href = "/employee/dashboard"}
             className="mt-10 px-10 py-5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
           >
             Return to Base
           </button>
        </div>
      );
    }

    if (path.startsWith("/employee/messages")) return <Messages isEmployeeView={true} />
    if (path.startsWith("/employee/tasks")) return <MyTasks />
    if (path.startsWith("/employee/projects")) return <MyProjects />
    if (path.startsWith("/employee/performance")) return <PerformanceInsight />
    if (path.startsWith("/employee/feed")) return <CorporateFeed />
    if (path.startsWith("/employee/notifications")) return <Notifications />
    if (path.startsWith("/employee/collaboration")) return <CollaborationRequest />
    if (path.startsWith("/employee/profile")) return <MyProfile />
    if (path.startsWith("/employee/department")) return <MyDepartment />

    // Default: /employee/dashboard
    return <PersonalDashboard />
  }

  return (
    <EmployeeLayout>
      {renderView()}
    </EmployeeLayout>
  )
}

export default EmployeeDashboard

