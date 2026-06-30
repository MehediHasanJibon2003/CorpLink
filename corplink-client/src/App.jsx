import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { ThemeProvider } from "./context/ThemeContext"
import { ConfirmProvider } from "./context/ConfirmContext"
import Landing from "./pages/auth/Landing"
import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"
import ForgotPassword from "./pages/auth/ForgotPassword"
import Dashboard from "./pages/corporate/Dashboard"
import Departments from "./pages/corporate/Departments"
import Employees from "./pages/corporate/Employees"
import Tasks from "./pages/corporate/Tasks"
import Activity from "./pages/corporate/Activity"
import Feed from "./pages/corporate/Feed"
import Collaboration from "./pages/corporate/Collaboration"
import Teams from "./pages/corporate/Teams"
import UserProfile from "./pages/corporate/UserProfile"
import Messages from "./pages/corporate/Messages"
import Analytics from "./pages/corporate/Analytics"
import Settings from "./pages/corporate/Settings"
import Billing from "./pages/corporate/Billing"
import Unauthorized from "./pages/auth/Unauthorized"
import PendingApproval from "./pages/auth/PendingApproval"
import ProtectedRoute from "./components/shared/ProtectedRoute"
import SuperAdminRoute from "./components/shared/SuperAdminRoute"
import EmployeeRoute from "./components/shared/EmployeeRoute"

// Employee Module
import EmployeeDashboard from "./pages/employee/EmployeeDashboard"

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
      <ConfirmProvider>
        <AuthProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

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
              path="/billing"
              element={
                <ProtectedRoute>
                  <Billing />
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
              path="/employee/performance"
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
              path="/super-admin/companies"
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
    </ConfirmProvider>
  </ThemeProvider>
  )
}

export default App
