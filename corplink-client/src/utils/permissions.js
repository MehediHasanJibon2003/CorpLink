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
  CORPORATE_ADMIN: 'corporate_admin',
  DEPT_HEAD: 'dept_head',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  RESTRICTED: 'restricted'
};

export const checkPermission = (userProfile, action, context = {}) => {
  if (!userProfile) return false;
  
  const role = userProfile.role?.toLowerCase();
  
  // 1. Corporate Admin & Super Admin always have full access
  if (role === ROLES.ADMIN || role === ROLES.CORPORATE_ADMIN) return true;

  // 2. Restricted Users (Interns) - Read-only everything
  if (role === ROLES.RESTRICTED) {
    return action.startsWith('view');
  }

  switch (action) {
    case 'manage_employees':
      return false;

    case 'manage_department':
      if (role === ROLES.DEPT_HEAD) {
        return userProfile.department_id === context.departmentId;
      }
      return false;

    case 'manage_tasks':
      if (role === ROLES.DEPT_HEAD) {
        return userProfile.department_id === context.departmentId;
      }
      if (role === ROLES.MANAGER) {
        return userProfile.department_id === context.departmentId;
      }
      return false;

    case 'edit_task':
      if (role === ROLES.EMPLOYEE) {
        return userProfile.id === context.assignedToId;
      }
      return checkPermission(userProfile, 'manage_tasks', context);

    case 'delete_any':
      if (role === ROLES.DEPT_HEAD) {
        return userProfile.department_id === context.departmentId;
      }
      return false;

    case 'view_analytics':
      return [ROLES.ADMIN, ROLES.CORPORATE_ADMIN, ROLES.DEPT_HEAD, ROLES.MANAGER].includes(role);

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

  if (role === ROLES.ADMIN || role === ROLES.CORPORATE_ADMIN) return dataList;

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

