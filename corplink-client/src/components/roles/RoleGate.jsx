import { useAuth } from "../../context/AuthContext";

/**
 * RoleGate component restricts access to its children based on the user's role.
 * 
 * @param {Object} props
 * @param {Array<string>} props.allowedRoles - e.g., ['admin', 'manager']
 * @param {React.ReactNode} props.children - Components to render if allowed
 * @param {React.ReactNode} [props.fallback=null] - Component to render if not allowed
 */
export default function RoleGate({ allowedRoles, children, fallback = null }) {
  const { profile, loading } = useAuth();

  if (loading) return null; // Or a spinner

  // If no specific role is found, assume 'employee' as default or restrict
  const userRole = profile?.role || 'employee';

  if (!allowedRoles.includes(userRole)) {
    return fallback;
  }

  return <>{children}</>;
}
