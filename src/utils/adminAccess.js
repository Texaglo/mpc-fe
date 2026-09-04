export const readAdminAccess = () => {
  let permissions = [];
  try { permissions = JSON.parse(localStorage.getItem('adminPermissions') || '[]'); } catch (_) { permissions = []; }
  return {
    role: String(localStorage.getItem('adminRole') || '').toLowerCase(),
    permissions: Array.isArray(permissions) ? permissions : [],
  };
};

export const canAccess = (access, requirement) => {
  const role = String(access?.role || '').toLowerCase();
  if (role === 'admin') return true;
  if (role !== 'sub_admin') return false;
  const granted = new Set(Array.isArray(access?.permissions) ? access.permissions : []);
  if (!requirement) return true;
  const required = Array.isArray(requirement) ? requirement : [requirement];
  return required.some((permission) => granted.has(permission)
    || (permission.endsWith('.view') && granted.has(`${permission.slice(0, -5)}.manage`)));
};
