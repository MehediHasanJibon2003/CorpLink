import { useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import EmployeeLayout from "../components/employee/EmployeeLayout"
import PersonalDashboard from "../components/employee/PersonalDashboard"
import MyTasks from "../components/employee/MyTasks"
import MyProjects from "../components/employee/MyProjects"
import CorporateFeed from "../components/employee/CorporateFeed"
import Notifications from "../components/employee/Notifications"
import CollaborationRequest from "../components/employee/CollaborationRequest"
import MyProfile from "../components/employee/MyProfile"

/**
 * EmployeeDashboard.jsx — Main shell for the Employee Module
 *
 * Routes:
 *  /employee/dashboard     → PersonalDashboard
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

  // Determine which sub-component to render based on URL path
  const renderView = () => {
    const path = location.pathname

    if (path.startsWith("/employee/messages")) return <Messages isEmployeeView={true} />
    if (path.startsWith("/employee/tasks")) return <MyTasks />
    if (path.startsWith("/employee/projects")) return <MyProjects />
    if (path.startsWith("/employee/feed")) return <CorporateFeed />
    if (path.startsWith("/employee/notifications")) return <Notifications />
    if (path.startsWith("/employee/collaboration")) return <CollaborationRequest />
    if (path.startsWith("/employee/profile")) return <MyProfile />

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
