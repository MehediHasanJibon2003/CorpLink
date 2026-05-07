/**
 * Corporate Hierarchy Access Control Utility
 * Levels: 
 * 1. corporate_admin (Full Access)
 * 2. dept_head (Departmental Control)
 * 3. manager (Team/Task Management)
 * 4. employee (Individual Work)
 * 5. restricted (Read-only/Trainee)
 */

export const ROLES = {
  ADMIN: 'admin',
  DEPT_HEAD: 'dept_head',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  RESTRICTED: 'restricted'
};

export const checkPermission = (userProfile, action, context = {}) => {
  if (!userProfile) return false;
  
  const role = userProfile.role?.toLowerCase();
  
  // 1. Corporate Admin always has full access
  if (role === ROLES.ADMIN) return true;

  // 2. Restricted Users (Interns) - Read-only everything
  if (role === ROLES.RESTRICTED) {
    return action.startsWith('view');
  }

  switch (action) {
    case 'manage_employees':
      // Admin only (handled above)
      return false;

    case 'manage_department':
      // Admin or the specific Dept Head
      if (role === ROLES.DEPT_HEAD) {
        return userProfile.department_id === context.departmentId;
      }
      return false;

    case 'manage_tasks':
      // Admin, Dept Head (same dept), or Manager (any task in their dept/project)
      if (role === ROLES.DEPT_HEAD) {
        return userProfile.department_id === context.departmentId;
      }
      if (role === ROLES.MANAGER) {
        // Managers can manage tasks in their own department or projects they belong to
        return userProfile.department_id === context.departmentId;
      }
      return false;

    case 'edit_task':
      // Same as manage_tasks, but also the assigned employee can update status
      if (role === ROLES.EMPLOYEE) {
        return userProfile.id === context.assignedToId;
      }
      return checkPermission(userProfile, 'manage_tasks', context);

    case 'delete_any':
      // Strict: Only Admin or Dept Head for their own dept
      if (role === ROLES.DEPT_HEAD) {
        return userProfile.department_id === context.departmentId;
      }
      return false;

    case 'view_analytics':
      // Admin, Dept Head, Manager
      return [ROLES.ADMIN, ROLES.DEPT_HEAD, ROLES.MANAGER].includes(role);

    default:
      return false;
  }
};

/**
 * Filters data based on user hierarchy
 * @param {Array} dataList - List of items (tasks, projects, etc)
 * @param {Object} userProfile - The logged-in user
 */
export const filterDataByHierarchy = (dataList, userProfile) => {
  if (!userProfile || !dataList) return [];
  const role = userProfile.role?.toLowerCase();

  if (role === ROLES.ADMIN) return dataList;

  // Department Heads & Managers see everything in their department
  if (role === ROLES.DEPT_HEAD || role === ROLES.MANAGER) {
    return dataList.filter(item => item.department_id === userProfile.department_id);
  }

  // Employees & Restricted see their own tasks or departmental tasks (view-only)
  return dataList.filter(item => 
    item.assigned_to === userProfile.id || 
    item.created_by === userProfile.id ||
    item.department_id === userProfile.department_id
  );
};
