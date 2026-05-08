import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { ThemeProvider } from "./context/ThemeContext"
import Landing from "./pages/Landing"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import Departments from "./pages/Departments"
import Employees from "./pages/Employees"
import Tasks from "./pages/Tasks"
import Activity from "./pages/Activity"
import Feed from "./pages/Feed"
import Collaboration from "./pages/Collaboration"
import Teams from "./pages/Teams"
import UserProfile from "./pages/UserProfile"
import Messages from "./pages/Messages"
import Analytics from "./pages/Analytics"
import Settings from "./pages/Settings"
import Unauthorized from "./pages/Unauthorized"
import PendingApproval from "./pages/PendingApproval"
import ProtectedRoute from "./components/ProtectedRoute"
import SuperAdminRoute from "./components/SuperAdminRoute"
import EmployeeRoute from "./components/EmployeeRoute"

// Employee Module
import EmployeeDashboard from "./pages/EmployeeDashboard"

// Super Admin Pages
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard"
import CorporateManagement from "./pages/superadmin/CorporateManagement"
import SubscriptionBilling from "./pages/superadmin/SubscriptionBilling"
import PlatformSettings from "./pages/superadmin/PlatformSettings"
import SystemActivityLogs from "./pages/superadmin/SystemActivityLogs"
import GlobalAnnouncements from "./pages/superadmin/GlobalAnnouncements"
import PlatformAnalytics from "./pages/superadmin/PlatformAnalytics"
import ThreatManagement from "./pages/superadmin/ThreatManagement"
import UserManagement from "./pages/superadmin/UserManagement"

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teams"
              element={
                <ProtectedRoute>
                  <Teams />
                </ProtectedRoute>
              }
            />
            <Route
              path="/departments"
              element={
                <ProtectedRoute>
                  <Departments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees"
              element={
                <ProtectedRoute>
                  <Employees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <Tasks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/activity"
              element={
                <ProtectedRoute>
                  <Activity />
                </ProtectedRoute>
              }
            />
            <Route
              path="/feed"
              element={
                <ProtectedRoute>
                  <Feed />
                </ProtectedRoute>
              }
            />
            <Route
              path="/collaboration"
              element={
                <ProtectedRoute>
                  <Collaboration />
                </ProtectedRoute>
              }
            />

            {/* ── Employee Routes ── */}
            <Route
              path="/employee/dashboard"
              element={<EmployeeRoute><EmployeeDashboard /></EmployeeRoute>}
            />
            <Route
              path="/employee/messages"
              element={<EmployeeRoute><EmployeeDashboard /></EmployeeRoute>}
            />
            <Route
              path="/employee/tasks"
              element={<EmployeeRoute><EmployeeDashboard /></EmployeeRoute>}
            />
            <Route
              path="/employee/projects"
              element={<EmployeeRoute><EmployeeDashboard /></EmployeeRoute>}
            />
            <Route
              path="/employee/feed"
              element={<EmployeeRoute><EmployeeDashboard /></EmployeeRoute>}
            />
            <Route
              path="/employee/notifications"
              element={<EmployeeRoute><EmployeeDashboard /></EmployeeRoute>}
            />
            <Route
              path="/employee/collaboration"
              element={<EmployeeRoute><EmployeeDashboard /></EmployeeRoute>}
            />
            <Route
              path="/employee/profile"
              element={<EmployeeRoute><EmployeeDashboard /></EmployeeRoute>}
            />
            <Route
              path="/employee/department"
              element={<EmployeeRoute><EmployeeDashboard /></EmployeeRoute>}
            />

            {/* Unauthorized / Pending */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/pending-approval" element={<PendingApproval />} />

            {/* ── Super Admin Routes ── */}
            <Route
              path="/super-admin"
              element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>}
            />
            <Route
              path="/super-admin/corporates"
              element={<SuperAdminRoute><CorporateManagement /></SuperAdminRoute>}
            />
            <Route
              path="/super-admin/subscriptions"
              element={<SuperAdminRoute><SubscriptionBilling /></SuperAdminRoute>}
            />
            <Route
              path="/super-admin/settings"
              element={<SuperAdminRoute><PlatformSettings /></SuperAdminRoute>}
            />
            <Route
              path="/super-admin/logs"
              element={<SuperAdminRoute><SystemActivityLogs /></SuperAdminRoute>}
            />
            <Route
              path="/super-admin/announcements"
              element={<SuperAdminRoute><GlobalAnnouncements /></SuperAdminRoute>}
            />
            <Route
              path="/super-admin/analytics"
              element={<SuperAdminRoute><PlatformAnalytics /></SuperAdminRoute>}
            />
            <Route
              path="/super-admin/threats"
              element={<SuperAdminRoute><ThreatManagement /></SuperAdminRoute>}
            />
            <Route
              path="/super-admin/users"
              element={<SuperAdminRoute><UserManagement /></SuperAdminRoute>}
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App