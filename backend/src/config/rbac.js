// src/config/rbac.js
// Defines roles and their permissions for admin RBAC.
//
// Permissions are string keys that map to protected features.
// A role with ['*'] has unrestricted access.
//
// Usage:
//   import { hasPermission } from '../config/rbac.js';
//   if (!hasPermission(req.adminRole, 'payments')) return res.status(403)...

/** All known permission strings */
export const ALL_PERMISSIONS = [
  'chats',       // read + send chat messages
  'quotations',  // view / create quotations
  'payments',    // view payment history
  'users',       // block/unblock farmers
  'dealers',     // manage dealer orders, approvals
  'products',    // CRUD products
  'announcements',
  'analytics',
  'audit',       // view auth + dealer audit logs
  'admin_users', // create / edit / deactivate admin accounts (superadmin only)
];

/**
 * Maps each role to the permissions it holds.
 * '*' means unrestricted (all current and future permissions).
 */
export const ROLE_PERMISSIONS = {
  superadmin: ['*'],
  manager:    [
    'chats', 'quotations', 'payments', 'users', 'dealers',
    'products', 'announcements', 'analytics', 'audit',
  ],
  support:    ['chats'],
  finance:    ['payments', 'quotations'],
};

/**
 * Returns true if `role` has the given `permission`.
 * @param {string} role
 * @param {string} permission
 */
export function hasPermission(role, permission) {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  if (perms.includes('*')) return true;
  return perms.includes(permission);
}

/**
 * Returns the list of permission strings for a role.
 * Resolves '*' to ALL_PERMISSIONS.
 * @param {string} role
 * @returns {string[]}
 */
export function permissionsForRole(role) {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return [];
  if (perms.includes('*')) return ALL_PERMISSIONS;
  return perms;
}
